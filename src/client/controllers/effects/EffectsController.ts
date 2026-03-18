import { Trove } from "@rbxts/trove";
import { Controller } from "client/core/Controller";
import { ClientNetwork } from "client/networking/ClientNet";
import { Logger } from "shared/core/Logger";
import { AbilityOutcome } from "shared/types/Ability";
import { StatusEffect } from "shared/types/Combat";

export class EffectsController implements Controller {
	readonly name = "EffectsController";
	private readonly log = new Logger("EffectsController");
	private readonly trove = new Trove();

	constructor(private readonly network: ClientNetwork) {}

	onStart(): void {
		this.trove.add(
			this.network.onServerEvent("AbilityOutcome", (result) => {
				this.playAbilityVisuals(result);
			}),
		);

		this.trove.add(
			this.network.onServerEvent("EffectApplied", (targetEntityId, effect) => {
				this.playStatusEffectVisual(targetEntityId, effect);
			}),
		);

		this.log.info("Effects controller active");
	}

	private playAbilityVisuals(outcome: AbilityOutcome): void {
		if (!outcome.success) return;
		this.log.debug(`Playing visuals for ${outcome.abilityId} by ${outcome.casterId}`);
	}

	private playStatusEffectVisual(targetEntityId: string, effect: StatusEffect): void {
		this.log.debug(`Status effect ${effect.effectType} applied to ${targetEntityId}`);
	}
}
