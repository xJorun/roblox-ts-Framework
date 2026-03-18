import { EntityId, Timestamp } from "shared/core/Types";

export enum DamageType {
	Physical = "Physical",
	Magical = "Magical",
	True = "True",
}

export interface DamageInstance {
	sourceEntityId: EntityId;
	targetEntityId: EntityId;
	amount: number;
	damageType: DamageType;
	timestamp: Timestamp;
}

export enum StatusEffectType {
	Stun = "Stun",
	Slow = "Slow",
	Burn = "Burn",
	Heal = "Heal",
	Shield = "Shield",
}

export interface StatusEffect {
	id: string;
	effectType: StatusEffectType;
	value: number;
	duration: number;
	startTime: Timestamp;
}

export interface CombatState {
	statusEffects: StatusEffect[];
	lastDamageTimestamp: Timestamp;
	isInCombat: boolean;
}

export function createDefaultCombatState(): CombatState {
	return {
		statusEffects: [],
		lastDamageTimestamp: 0,
		isInCombat: false,
	};
}
