export function shuffle<T extends defined>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.size() - 1; i > 0; i--) {
		const j = math.random(0, i);
		const temp = result[i];
		result[i] = result[j];
		result[j] = temp;
	}
	return result;
}

export function sample<T>(arr: readonly T[]): T | undefined {
	if (arr.size() === 0) return undefined;
	return arr[math.random(0, arr.size() - 1)];
}

export function removeFirst<T extends defined>(arr: T[], predicate: (item: T) => boolean): boolean {
	for (let i = 0; i < arr.size(); i++) {
		if (predicate(arr[i])) {
			arr.remove(i);
			return true;
		}
	}
	return false;
}

export function findWhere<T>(arr: readonly T[], predicate: (item: T) => boolean): T | undefined {
	for (const item of arr) {
		if (predicate(item)) return item;
	}
	return undefined;
}

export function countWhere<T>(arr: readonly T[], predicate: (item: T) => boolean): number {
	let total = 0;
	for (const item of arr) {
		if (predicate(item)) total++;
	}
	return total;
}

export function flat<T extends defined>(arr: readonly (readonly T[])[]): T[] {
	const result: T[] = [];
	for (const inner of arr) {
		for (const item of inner) {
			result.push(item);
		}
	}
	return result;
}
