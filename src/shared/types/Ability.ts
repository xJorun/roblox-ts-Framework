export enum TargetType {
	Self = "Self",
	Single = "Single",
	Area = "Area",
	Direction = "Direction",
}

export enum AbilityEffectType {
	Damage = "Damage",
	Heal = "Heal",
	StatusApply = "StatusApply",
	Knockback = "Knockback",
}

export interface AbilityEffect {
	effectType: AbilityEffectType;
	value: number;
	duration?: number;
}

export interface AbilityDefinition {
	id: string;
	name: string;
	cooldown: number;
	castTime: number;
	range: number;
	targetType: TargetType;
	effects: AbilityEffect[];
}

export interface AbilityActivationRequest {
	abilityId: string;
	targetId?: string;
	position?: Vector3;
	direction?: Vector3;
	sequenceId: number;
}

export interface AbilityOutcome {
	abilityId: string;
	casterId: string;
	success: boolean;
	sequenceId: number;
	effects?: AppliedEffect[];
	rejection?: string;
}

export interface AppliedEffect {
	targetEntityId: string;
	effectType: AbilityEffectType;
	value: number;
}
