import { Players } from "@rbxts/services";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { CombatService } from "server/services/combat/CombatService";
import { DataService } from "server/services/data/DataService";
import { CombatValidator } from "server/validation/CombatValidator";
import { Logger } from "shared/core/Logger";
import { ABILITY_DEFINITIONS } from "shared/config/CombatConfig";
import { AbilityActivationRequest, AbilityOutcome } from "shared/types/Ability";
import { isAlive } from "shared/util/InstanceUtil";

export class AbilityService implements Service {
	readonly name = "AbilityService";
	private readonly log = new Logger("AbilityService");

	constructor(
		private readonly network: ServerNetwork,
		private readonly combatService: CombatService,
		private readonly validator: CombatValidator,
		private readonly dataService: DataService,
	) {}

	onInit(): void {
		this.network.onClientEvent("RequestAbility", (player, request) => {
			this.handleAbilityRequest(player, request);
		});
	}

	private handleAbilityRequest(player: Player, request: AbilityActivationRequest): void {
		const ability = ABILITY_DEFINITIONS[request.abilityId];
		if (!ability) {
			this.sendRejection(player, request.sequenceId, "Unknown ability");
			return;
		}

		const data = this.dataService.getData(player);
		if (!data || !data.inventory.ownedAbilities.includes(request.abilityId)) {
			this.sendRejection(player, request.sequenceId, "Ability not owned");
			return;
		}

		const validation = this.validator.validateAbilityRequest(player, request);
		if (!validation.valid) {
			this.log.debug(`Rejected ability ${request.abilityId} from ${player.Name}: ${validation.reason}`);
			this.sendRejection(player, request.sequenceId, validation.reason ?? "Validation failed");
			return;
		}

		const playerId = tostring(player.UserId);
		this.validator.recordCooldown(playerId, request.abilityId);

		if (ability.castTime > 0) {
			task.delay(ability.castTime, () => {
				if (!isAlive(player.Character)) {
					this.sendRejection(player, request.sequenceId, "Died during cast");
					return;
				}
				this.executeAbility(player, ability.id, request);
			});
		} else {
			this.executeAbility(player, ability.id, request);
		}
	}

	private executeAbility(player: Player, abilityId: string, request: AbilityActivationRequest): void {
		const ability = ABILITY_DEFINITIONS[abilityId];
		if (!ability) return;

		const playerId = tostring(player.UserId);
		const result = this.combatService.processAbilityEffects(
			player,
			ability,
			request.targetId,
			request.direction,
			request.position,
		);

		const outcome: AbilityOutcome = {
			abilityId: request.abilityId,
			casterId: playerId,
			success: true,
			sequenceId: request.sequenceId,
			effects: result.effects,
		};

		this.network.fireClient("AbilityOutcome", player, outcome);
		this.broadcastToOthers(player, outcome);
	}

	private sendRejection(player: Player, sequenceId: number, reason: string): void {
		this.network.fireClient("AbilityRejected", player, sequenceId, reason);
	}

	private broadcastToOthers(caster: Player, outcome: AbilityOutcome): void {
		for (const otherPlayer of Players.GetPlayers()) {
			if (otherPlayer === caster) continue;
			this.network.fireClient("AbilityOutcome", otherPlayer, outcome);
		}
	}
}
