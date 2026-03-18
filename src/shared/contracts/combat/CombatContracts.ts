import { AbilityEffectType } from "shared/types/Ability";
import { DamageType } from "shared/types/Combat";
import { EntityId } from "shared/core/Types";

export interface CombatRequest {
	attackType: "melee" | "ranged" | "ability";
	targetEntityId?: EntityId;
	abilityId?: string;
	position?: Vector3;
}

export interface CombatResult {
	accepted: boolean;
	damage?: number;
	damageType?: DamageType;
	appliedEffects?: CombatEffectEntry[];
	reason?: string;
}

export interface CombatEffectEntry {
	targetEntityId: EntityId;
	effectType: AbilityEffectType;
	value: number;
}
