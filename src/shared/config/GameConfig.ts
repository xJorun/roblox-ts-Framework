export const GameConfig = {
	maxPlayers: 20,
	tickRate: 20,
	defaultHealth: 100,
	defaultMaxHealth: 100,
	combatExitDelay: 5,
	respawnDelay: 5,
	replicationRange: 250,

	network: {
		rateLimitWindow: 1,
		rateLimitMaxRequests: 30,
	},

	data: {
		autoSaveInterval: 120,
		storeName: "PlayerData_v1",
	},
} as const;
