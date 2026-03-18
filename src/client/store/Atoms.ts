import { atom } from "@rbxts/charm";

export interface AbilitySlotData {
	abilityId: string;
	name: string;
	keybind: string;
	cooldownEnd: number;
	cooldownDuration: number;
}

export interface DamageEvent {
	id: number;
	amount: number;
	damageType: string;
	timestamp: number;
}

export const localHealth = atom(100);
export const localMaxHealth = atom(100);
export const localAlive = atom(true);
export const abilitySlots = atom<AbilitySlotData[]>([]);
export const damageEvents = atom<DamageEvent[]>([]);

let nextDamageId = 0;

export function pushDamageEvent(amount: number, damageType: string): void {
	nextDamageId++;
	const id = nextDamageId;
	const current = damageEvents();
	damageEvents([...current, { id, amount, damageType, timestamp: os.clock() }]);

	task.delay(3, () => {
		const live = damageEvents();
		damageEvents(live.filter((e) => e.id !== id));
	});
}
