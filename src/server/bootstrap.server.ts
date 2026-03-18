import { Logger, setGlobalLogLevel, LogLevel } from "shared/core/Logger";
import { GameConfig } from "shared/config/GameConfig";

import { ServerNetwork } from "server/networking/ServerNet";
import { ServiceRegistry } from "server/core/ServiceRegistry";
import { CombatValidator } from "server/validation/CombatValidator";
import { createRateLimiter } from "server/validation/RateLimiter";
import { registerTypeCheck, createTypeCheckMiddleware, t } from "server/validation/TypeChecker";

import { DataService } from "server/services/data/DataService";
import { PlayerService } from "server/services/players/PlayerService";
import { CombatService } from "server/services/combat/CombatService";
import { AbilityService } from "server/services/abilities/AbilityService";
import { ReplicationService } from "server/services/replication/ReplicationService";

const log = new Logger("Server");
setGlobalLogLevel(LogLevel.Info);

log.info("Bootstrapping server...");

// --- Infrastructure ---
const network = new ServerNetwork();
const registry = new ServiceRegistry();
const combatValidator = new CombatValidator();

// --- Runtime type checks for incoming remotes (anti-exploit) ---
registerTypeCheck(
	"RequestAbility",
	t.interface({
		abilityId: t.string,
		sequenceId: t.number,
		targetId: t.optional(t.string),
		position: t.optional(t.Vector3),
		direction: t.optional(t.Vector3),
	}),
);

registerTypeCheck("RequestAction", t.string);

// --- Middleware pipeline ---
network.use(
	createRateLimiter({
		maxRequests: GameConfig.network.rateLimitMaxRequests,
		windowSeconds: GameConfig.network.rateLimitWindow,
	}),
);
network.use(createTypeCheckMiddleware());

// --- Services ---
const dataService = new DataService();
const playerService = new PlayerService(network, dataService);
const combatService = new CombatService(network, playerService);
const abilityService = new AbilityService(network, combatService, combatValidator);
const replicationService = new ReplicationService(network, playerService);

// --- Register ---
registry
	.register(dataService)
	.register(playerService)
	.register(combatService)
	.register(abilityService)
	.register(replicationService);

// --- Boot ---
network.initialize();
registry.start();

log.info("Server ready");
