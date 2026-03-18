import { Players } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { PlayerService } from "server/services/players/PlayerService";
import { Logger } from "shared/core/Logger";
import { AbilityDefinition, AbilityEffectType, AppliedEffect } from "shared/types/Ability";
import { DamageType, DamageInstance, StatusEffectType, StatusEffect } from "shared/types/Combat";
import { CombatConfig } from "shared/config/CombatConfig";
import { calculateDamage, clampHealth, pruneExpiredEffects } from "shared/gameplay/combat/CombatMath";

export interface AbilityApplicationResult {
	effects: AppliedEffect[];
}

export class CombatService implements Service {
	readonly name = "CombatService";
	private readonly log = new Logger("CombatService");

	readonly onEntityDamaged = new Signal<[damage: DamageInstance]>();
	readonly onEntityKilled = new Signal<[entityId: string, killerId: string]>();

	constructor(
		private readonly network: ServerNetwork,
		private readonly playerService: PlayerService,
	) {}

	processAbilityEffects(
		caster: Player,
		ability: AbilityDefinition,
		targetId: string | undefined,
	): AbilityApplicationResult {
		const applied: AppliedEffect[] = [];
		const casterId = tostring(caster.UserId);

		for (const effect of ability.effects) {
			switch (effect.effectType) {
				case AbilityEffectType.Damage: {
					if (targetId !== undefined) {
						const dmg = this.applyDamage(casterId, targetId, effect.value, DamageType.Magical);
						if (dmg) {
							applied.push({
								targetEntityId: targetId,
								effectType: AbilityEffectType.Damage,
								value: dmg.amount,
							});
						}
					}
					break;
				}
				case AbilityEffectType.Heal: {
					this.applyHeal(casterId, effect.value);
					applied.push({
						targetEntityId: casterId,
						effectType: AbilityEffectType.Heal,
						value: effect.value,
					});
					break;
				}
				case AbilityEffectType.StatusApply: {
					const effectTarget = targetId ?? casterId;
					if (effect.duration !== undefined) {
						this.applyStatusEffect(effectTarget, {
							id: `${ability.id}_${os.clock()}`,
							effectType: StatusEffectType.Burn,
							value: effect.value,
							duration: effect.duration,
							startTime: os.clock(),
						});
						applied.push({
							targetEntityId: effectTarget,
							effectType: AbilityEffectType.StatusApply,
							value: effect.value,
						});
					}
					break;
				}
				case AbilityEffectType.Knockback: {
					applied.push({
						targetEntityId: targetId ?? casterId,
						effectType: AbilityEffectType.Knockback,
						value: effect.value,
					});
					break;
				}
			}
		}

		return { effects: applied };
	}

	applyDamage(
		sourceEntityId: string,
		targetEntityId: string,
		baseDamage: number,
		damageType: DamageType,
	): DamageInstance | undefined {
		const targetState = this.playerService.getEntityState(targetEntityId);
		if (!targetState || !targetState.alive) return undefined;

		const finalDamage = math.clamp(
			calculateDamage(baseDamage, 1, 0),
			CombatConfig.minDamage,
			CombatConfig.maxDamage,
		);

		targetState.health = clampHealth(targetState.health - finalDamage, targetState.maxHealth);
		targetState.combatState.lastDamageTimestamp = os.clock();
		targetState.combatState.isInCombat = true;

		const damageInstance: DamageInstance = {
			sourceEntityId,
			targetEntityId,
			amount: finalDamage,
			damageType,
			timestamp: os.clock(),
		};

		this.onEntityDamaged.Fire(damageInstance);
		this.broadcastDamage(damageInstance, targetEntityId);

		if (targetState.health <= 0) {
			targetState.alive = false;
			this.onEntityKilled.Fire(targetEntityId, sourceEntityId);
			this.log.info(`Entity ${targetEntityId} killed by ${sourceEntityId}`);
		}

		return damageInstance;
	}

	private applyHeal(entityId: string, amount: number): void {
		const state = this.playerService.getEntityState(entityId);
		if (!state || !state.alive) return;

		state.health = clampHealth(state.health + amount, state.maxHealth);
	}

	private applyStatusEffect(entityId: string, effect: StatusEffect): void {
		const state = this.playerService.getEntityState(entityId);
		if (!state) return;

		state.statusEffects = pruneExpiredEffects(state.statusEffects, os.clock());
		if (state.statusEffects.size() >= CombatConfig.maxConcurrentStatusEffects) return;

		state.statusEffects.push(effect);

		const target = Players.GetPlayerByUserId(tonumber(entityId) ?? 0);
		if (target) {
			this.network.fireClient("EffectApplied", target, entityId, effect);
		}
	}

	private broadcastDamage(damage: DamageInstance, targetEntityId: string): void {
		const target = Players.GetPlayerByUserId(tonumber(targetEntityId) ?? 0);
		if (target) {
			this.network.fireClient("DamageApplied", target, damage);
			this.network.fireClient(
				"StateReplication",
				target,
				targetEntityId,
				this.playerService.getEntityState(targetEntityId)!,
			);
		}
	}
}
