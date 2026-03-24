export interface CurrencyBag {
	gold: number;
	gems: number;
}

export function createDefaultCurrencies(): CurrencyBag {
	return { gold: 0, gems: 0 };
}
