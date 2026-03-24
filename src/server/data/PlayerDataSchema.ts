import { CurrencyBag, createDefaultCurrencies } from "shared/types/Player";

export interface PlayerData {
	version: number;
	currencies: CurrencyBag;
	stats: PlayerStats;
	inventory: InventoryData;
}

export interface PlayerStats {
	totalKills: number;
	totalDeaths: number;
	totalDamageDealt: number;
	playTime: number;
}

export interface InventoryData {
	ownedAbilities: string[];
	equippedAbilities: string[];
}

export const CURRENT_DATA_VERSION = 1;

type MigrationFn = (data: PlayerData) => void;

const DATA_MIGRATIONS: MigrationFn[] = [];

export function migratePlayerData(data: PlayerData): PlayerData {
	while (data.version < CURRENT_DATA_VERSION) {
		const migration = DATA_MIGRATIONS[data.version - 1];
		if (migration) {
			migration(data);
		}
		data.version++;
	}
	return data;
}

export function createDefaultPlayerData(): PlayerData {
	return {
		version: CURRENT_DATA_VERSION,
		currencies: createDefaultCurrencies(),
		stats: {
			totalKills: 0,
			totalDeaths: 0,
			totalDamageDealt: 0,
			playTime: 0,
		},
		inventory: {
			ownedAbilities: ["fireball", "heal", "dash_strike"],
			equippedAbilities: ["fireball", "heal", "dash_strike"],
		},
	};
}
