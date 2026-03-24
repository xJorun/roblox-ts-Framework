import { Players } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { PlayerService } from "server/services/players/PlayerService";
import { Logger } from "shared/core/Logger";
import { AbilityDefinition, AbilityEffectType, AppliedEffect, TargetType } from "shared/types/Ability";
import { DamageType, DamageInstance, StatusEffect } from "shared/types/Combat";
import { CombatConfig } from "shared/config/CombatConfig";
import { calculateDamage } from "shared/gameplay/combat/CombatMath";
import { getCharacterPosition } from "shared/util/InstanceUtil";

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
		direction: Vector3 | undefined,
		position: Vector3 | undefined,
	): AbilityApplicationResult {
		const casterId = tostring(caster.UserId);
		const targets = this.resolveTargets(caster, ability, targetId, direction, position);
		const applied: AppliedEffect[] = [];

		for (const effect of ability.effects) {
			switch (effect.effectType) {
				case AbilityEffectType.Damage: {
					for (const tid of targets) {
						if (tid === casterId) continue;
						const dmg = this.applyDamage(casterId, tid, effect.value, DamageType.Magical);
						if (dmg) {
							applied.push({
								targetEntityId: tid,
								effectType: AbilityEffectType.Damage,
								value: dmg.amount,
							});
						}
					}
					break;
				}
				case AbilityEffectType.Heal: {
					for (const tid of targets) {
						this.playerService.applyHeal(tid, effect.value);
						applied.push({
							targetEntityId: tid,
							effectType: AbilityEffectType.Heal,
							value: effect.value,
						});
					}
					break;
				}
				case AbilityEffectType.StatusApply: {
					if (effect.duration === undefined || effect.statusType === undefined) break;
					for (const tid of targets) {
						const statusEffect: StatusEffect = {
							id: `${ability.id}_${os.clock()}`,
							effectType: effect.statusType,
							value: effect.value,
							duration: effect.duration,
							startTime: os.clock(),
						};
						if (this.playerService.addStatusEffect(tid, statusEffect)) {
							const targetPlayer = Players.GetPlayerByUserId(tonumber(tid) ?? 0);
							if (targetPlayer) {
								this.network.fireClient("EffectApplied", targetPlayer, tid, statusEffect);
							}
							applied.push({
								targetEntityId: tid,
								effectType: AbilityEffectType.StatusApply,
								value: effect.value,
							});
						}
					}
					break;
				}
				case AbilityEffectType.Knockback: {
					for (const tid of targets) {
						if (tid === casterId) continue;
						applied.push({
							targetEntityId: tid,
							effectType: AbilityEffectType.Knockback,
							value: effect.value,
						});
					}
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

		const casterState = this.playerService.getEntityState(sourceEntityId);
		const attackMult = casterState?.attack ?? 1;
		const defenseMult = targetState.defense;

		const finalDamage = math.clamp(
			calculateDamage(baseDamage, attackMult, defenseMult),
			CombatConfig.minDamage,
			CombatConfig.maxDamage,
		);

		if (!this.playerService.applyDamage(targetEntityId, finalDamage)) return undefined;

		this.playerService.addDamageDealt(sourceEntityId, finalDamage);

		const damageInstance: DamageInstance = {
			sourceEntityId,
			targetEntityId,
			amount: finalDamage,
			damageType,
			timestamp: os.clock(),
		};

		this.onEntityDamaged.Fire(damageInstance);

		const targetPlayer = Players.GetPlayerByUserId(tonumber(targetEntityId) ?? 0);
		if (targetPlayer) {
			this.network.fireClient("DamageApplied", targetPlayer, damageInstance);
		}

		const updatedState = this.playerService.getEntityState(targetEntityId);
		if (updatedState && !updatedState.alive) {
			this.onEntityKilled.Fire(targetEntityId, sourceEntityId);
			this.log.info(`Entity ${targetEntityId} killed by ${sourceEntityId}`);
		}

		return damageInstance;
	}

	private resolveTargets(
		caster: Player,
		ability: AbilityDefinition,
		targetId: string | undefined,
		direction: Vector3 | undefined,
		position: Vector3 | undefined,
	): string[] {
		const casterId = tostring(caster.UserId);

		switch (ability.targetType) {
			case TargetType.Self:
				return [casterId];
			case TargetType.Single:
				return targetId !== undefined ? [targetId] : [];
			case TargetType.Direction:
				return this.findDirectionTargets(caster, direction, ability.range);
			case TargetType.Area:
				return this.findAreaTargets(position, ability.range);
		}

		return [];
	}

	private findDirectionTargets(caster: Player, direction: Vector3 | undefined, range: number): string[] {
		if (!direction) return [];
		const casterPos = getCharacterPosition(caster);
		if (!casterPos) return [];

		const targets: string[] = [];
		const dirUnit = direction.Unit;

		for (const player of Players.GetPlayers()) {
			if (player === caster) continue;
			const targetPos = getCharacterPosition(player);
			if (!targetPos) continue;

			const toTarget = targetPos.sub(casterPos);
			if (toTarget.Magnitude > range) continue;

			if (toTarget.Unit.Dot(dirUnit) > 0.5) {
				targets.push(tostring(player.UserId));
			}
		}

		return targets;
	}

	private findAreaTargets(position: Vector3 | undefined, range: number): string[] {
		if (!position) return [];

		const targets: string[] = [];
		for (const player of Players.GetPlayers()) {
			const targetPos = getCharacterPosition(player);
			if (!targetPos) continue;

			if (targetPos.sub(position).Magnitude <= range) {
				targets.push(tostring(player.UserId));
			}
		}

		return targets;
	}
}
