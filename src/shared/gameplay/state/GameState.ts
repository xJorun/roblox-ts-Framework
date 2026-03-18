import { EntityId } from "shared/core/Types";
import { CharacterState } from "shared/gameplay/characters/CharacterTypes";

export interface EntitySnapshot {
	entityId: EntityId;
	state: CharacterState;
	tick: number;
}

export interface WorldSnapshot {
	entities: Map<EntityId, CharacterState>;
	tick: number;
	serverTime: number;
}
