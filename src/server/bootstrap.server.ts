import { setGlobalLogLevel, LogLevel } from "shared/core/Logger";
import { GameConfig } from "shared/config/GameConfig";

import { ServerNetwork } from "server/networking/ServerNet";
import { ServiceRegistry } from "server/core/ServiceRegistry";
import { CombatValidator } from "server/validation/CombatValidator";
import { createRateLimiter } from "server/validation/RateLimiter";
import { registerTypeChecks, createTypeCheckMiddleware, t } from "server/validation/TypeChecker";

import { DataService } from "server/services/data/DataService";
import { PlayerService } from "server/services/players/PlayerService";
import { CombatService } from "server/services/combat/CombatService";
import { AbilityService } from "server/services/abilities/AbilityService";
import { ReplicationService } from "server/services/replication/ReplicationService";

setGlobalLogLevel(LogLevel.Info);

const network = new ServerNetwork();
const registry = new ServiceRegistry();
const combatValidator = new CombatValidator();

registerTypeChecks(
	"RequestAbility",
	t.interface({
		abilityId: t.string,
		sequenceId: t.number,
		targetId: t.optional(t.string),
		position: t.optional(t.Vector3),
		direction: t.optional(t.Vector3),
	}),
);

registerTypeChecks("RequestAction", t.string);

network.use(
	createRateLimiter({
		maxRequests: GameConfig.network.rateLimitMaxRequests,
		windowSeconds: GameConfig.network.rateLimitWindow,
	}),
);
network.use(createTypeCheckMiddleware());

const dataService = new DataService();
const playerService = new PlayerService(network, dataService);
const combatService = new CombatService(network, playerService);
const abilityService = new AbilityService(network, combatService, combatValidator, dataService);
const replicationService = new ReplicationService(network, playerService);

combatService.onEntityKilled.Connect((entityId, killerId) => {
	playerService.incrementDeaths(entityId);
	playerService.incrementKills(killerId);
	playerService.scheduleRespawn(entityId);
});

playerService.onPlayerRemoving.Connect((player) => {
	combatValidator.clearPlayerCooldowns(tostring(player.UserId));
});

registry
	.register(dataService)
	.register(playerService)
	.register(combatService)
	.register(abilityService)
	.register(replicationService);

network.initialize();
registry.start();

game.BindToClose(() => {
	registry.shutdown();
});
