export function guard(condition: unknown, message: string): asserts condition {
	if (!condition) {
		error(message);
	}
}

export function guardDefined<T>(value: T | undefined, label: string): T {
	if (value === undefined) {
		error(`Expected ${label} to be defined`);
	}
	return value as T;
}

export function guardType<T>(
	value: unknown,
	typeName: keyof CheckableTypes,
	label: string,
): asserts value is T {
	if (!typeIs(value, typeName)) {
		error(`Expected ${label} to be ${typeName}, got ${typeOf(value)}`);
	}
}

export function guardPositive(value: number, label: string): void {
	if (value <= 0) {
		error(`Expected ${label} to be positive, got ${value}`);
	}
}

export function guardRange(value: number, min: number, max: number, label: string): void {
	if (value < min || value > max) {
		error(`Expected ${label} to be in [${min}, ${max}], got ${value}`);
	}
}
