export interface KeybindEntry {
	readonly abilityId: string;
	readonly keyCode: Enum.KeyCode;
	readonly label: string;
}

export const KEYBIND_CONFIG: readonly KeybindEntry[] = [
	{ abilityId: "fireball", keyCode: Enum.KeyCode.Q, label: "Q" },
	{ abilityId: "heal", keyCode: Enum.KeyCode.E, label: "E" },
	{ abilityId: "dash_strike", keyCode: Enum.KeyCode.R, label: "R" },
];
