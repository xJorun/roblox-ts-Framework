import { AbilityDefinition, AbilityEffectType, TargetType } from "shared/types/Ability";
import { StatusEffectType } from "shared/types/Combat";

export const CombatConfig = {
	maxHitRange: 100,
	minDamage: 1,
	maxDamage: 9999,
	combatTimeout: 5,
	maxConcurrentStatusEffects: 10,
} as const;

export const ABILITY_DEFINITIONS: { readonly [id: string]: AbilityDefinition } = {
	fireball: {
		id: "fireball",
		name: "Fireball",
		cooldown: 3,
		castTime: 0.5,
		range: 50,
		targetType: TargetType.Single,
		effects: [
			{ effectType: AbilityEffectType.Damage, value: 25 },
			{ effectType: AbilityEffectType.StatusApply, value: 5, duration: 3, statusType: StatusEffectType.Burn },
		],
	},
	heal: {
		id: "heal",
		name: "Heal",
		cooldown: 8,
		castTime: 1,
		range: 0,
		targetType: TargetType.Self,
		effects: [{ effectType: AbilityEffectType.Heal, value: 40 }],
	},
	dash_strike: {
		id: "dash_strike",
		name: "Dash Strike",
		cooldown: 5,
		castTime: 0,
		range: 20,
		targetType: TargetType.Direction,
		effects: [
			{ effectType: AbilityEffectType.Damage, value: 15 },
			{ effectType: AbilityEffectType.Knockback, value: 30 },
		],
	},
};
