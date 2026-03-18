import { Players } from "@rbxts/services";
import { Trove } from "@rbxts/trove";
import { Controller } from "client/core/Controller";
import { ClientNetwork } from "client/networking/ClientNet";
import { InputController } from "client/controllers/input/InputController";
import { PredictionBuffer } from "client/prediction/PredictionBuffer";
import { Logger } from "shared/core/Logger";
import { AbilityActivationRequest, AbilityOutcome } from "shared/types/Ability";
import { ABILITY_DEFINITIONS } from "shared/config/CombatConfig";
import { isOnCooldown } from "shared/gameplay/combat/CombatMath";

interface AbilityPrediction {
	abilityId: string;
	timestamp: number;
}

export class PredictionController implements Controller {
	readonly name = "PredictionController";
	private readonly log = new Logger("PredictionController");
	private readonly trove = new Trove();
	private readonly buffer = new PredictionBuffer<AbilityPrediction>();
	private readonly localCooldowns = new Map<string, number>();

	constructor(
		private readonly network: ClientNetwork,
		private readonly inputController: InputController,
	) {}

	onStart(): void {
		this.trove.add(
			this.inputController.onAbilityInputPressed.Connect((abilityId) => {
				this.requestAbility(abilityId);
			}),
		);

		this.trove.add(
			this.network.onServerEvent("AbilityOutcome", (result) => {
				this.handleOutcome(result);
			}),
		);

		this.trove.add(
			this.network.onServerEvent("AbilityRejected", (sequenceId, reason) => {
				this.handleRejection(sequenceId, reason);
			}),
		);

		this.log.info("Prediction controller active");
	}

	private requestAbility(abilityId: string): void {
		const ability = ABILITY_DEFINITIONS[abilityId];
		if (!ability) return;

		const lastUsed = this.localCooldowns.get(abilityId) ?? 0;
		if (isOnCooldown(lastUsed, ability.cooldown, os.clock())) {
			this.log.debug(`Local cooldown block: ${abilityId}`);
			return;
		}

		this.localCooldowns.set(abilityId, os.clock());

		const sequenceId = this.buffer.push({
			abilityId,
			timestamp: os.clock(),
		});

		const request: AbilityActivationRequest = {
			abilityId,
			sequenceId,
		};

		this.network.fireServer("RequestAbility", request);
		this.log.debug(`Sent ability request: ${abilityId} seq=${sequenceId}`);
	}

	private handleOutcome(result: AbilityOutcome): void {
		if (result.casterId !== tostring(Players.LocalPlayer.UserId)) return;

		if (result.success) {
			this.buffer.acknowledge(result.sequenceId);
			this.log.debug(`Prediction confirmed: ${result.abilityId} seq=${result.sequenceId}`);
		}
	}

	private handleRejection(sequenceId: number, reason: string): void {
		const rejected = this.buffer.reject(sequenceId);
		if (rejected) {
			const prediction = rejected.predictedState;
			this.localCooldowns.delete(prediction.abilityId);
			this.log.debug(`Prediction rolled back: seq=${sequenceId} reason=${reason}`);
		}
	}
}
