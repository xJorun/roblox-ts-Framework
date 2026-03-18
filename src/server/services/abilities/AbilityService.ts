import { Players } from "@rbxts/services";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { CombatService } from "server/services/combat/CombatService";
import { CombatValidator } from "server/validation/CombatValidator";
import { Logger } from "shared/core/Logger";
import { ABILITY_DEFINITIONS } from "shared/config/CombatConfig";
import { AbilityActivationRequest, AbilityOutcome } from "shared/types/Ability";

export class AbilityService implements Service {
	readonly name = "AbilityService";
	private readonly log = new Logger("AbilityService");

	constructor(
		private readonly network: ServerNetwork,
		private readonly combatService: CombatService,
		private readonly validator: CombatValidator,
	) {}

	onInit(): void {
		this.network.onClientEvent("RequestAbility", (player, request) => {
			this.handleAbilityRequest(player, request);
		});
	}

	private handleAbilityRequest(player: Player, request: AbilityActivationRequest): void {
		const validation = this.validator.validateAbilityRequest(player, request);

		if (!validation.valid) {
			this.log.debug(
				`Rejected ability ${request.abilityId} from ${player.Name}: ${validation.reason}`,
			);
			this.network.fireClient(
				"AbilityRejected",
				player,
				request.sequenceId,
				validation.reason ?? "Validation failed",
			);
			return;
		}

		const ability = ABILITY_DEFINITIONS[request.abilityId];
		const playerId = tostring(player.UserId);

		this.validator.recordCooldown(playerId, request.abilityId);

		const result = this.combatService.processAbilityEffects(player, ability, request.targetId);

		const outcome: AbilityOutcome = {
			abilityId: request.abilityId,
			casterId: playerId,
			success: true,
			sequenceId: request.sequenceId,
			effects: result.effects,
		};

		this.network.fireClient("AbilityOutcome", player, outcome);
		this.broadcastToNearby(player, outcome);
		this.log.debug(`Accepted ability ${request.abilityId} from ${player.Name}`);
	}

	private broadcastToNearby(caster: Player, outcome: AbilityOutcome): void {
		for (const otherPlayer of Players.GetPlayers()) {
			if (otherPlayer === caster) continue;
			this.network.fireClient("AbilityOutcome", otherPlayer, outcome);
		}
	}
}
