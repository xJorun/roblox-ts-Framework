import { EntityId, PlayerId } from "shared/core/Types";
import { CombatState } from "./Combat";

export interface PlayerState {
	playerId: PlayerId;
	entityId: EntityId;
	health: number;
	maxHealth: number;
	alive: boolean;
	combatState: CombatState;
	currencies: CurrencyBag;
}

export interface CurrencyBag {
	gold: number;
	gems: number;
}

export function createDefaultCurrencies(): CurrencyBag {
	return { gold: 0, gems: 0 };
}
