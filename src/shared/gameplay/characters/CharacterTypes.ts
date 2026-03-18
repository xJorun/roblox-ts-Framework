import { EntityId, PlayerId } from "shared/core/Types";
import { CombatState, StatusEffect, createDefaultCombatState } from "shared/types/Combat";

export interface CharacterState {
	entityId: EntityId;
	ownerId: PlayerId;
	health: number;
	maxHealth: number;
	alive: boolean;
	statusEffects: StatusEffect[];
	combatState: CombatState;
}

export function createDefaultCharacterState(entityId: EntityId, ownerId: PlayerId): CharacterState {
	return {
		entityId,
		ownerId,
		health: 100,
		maxHealth: 100,
		alive: true,
		statusEffects: [],
		combatState: createDefaultCombatState(),
	};
}
