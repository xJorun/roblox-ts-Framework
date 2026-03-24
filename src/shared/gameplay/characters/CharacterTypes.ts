import { EntityId, PlayerId } from "shared/core/Types";
import { CombatState, createDefaultCombatState } from "shared/types/Combat";
import { GameConfig } from "shared/config/GameConfig";

export interface CharacterState {
	entityId: EntityId;
	ownerId: PlayerId;
	health: number;
	maxHealth: number;
	attack: number;
	defense: number;
	alive: boolean;
	combatState: CombatState;
}

export function createDefaultCharacterState(entityId: EntityId, ownerId: PlayerId): CharacterState {
	return {
		entityId,
		ownerId,
		health: GameConfig.defaultHealth,
		maxHealth: GameConfig.defaultMaxHealth,
		attack: 1,
		defense: 0,
		alive: true,
		combatState: createDefaultCombatState(),
	};
}
