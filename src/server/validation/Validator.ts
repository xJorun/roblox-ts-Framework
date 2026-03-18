export interface ValidationResult {
	valid: boolean;
	reason?: string;
}

export function pass(): ValidationResult {
	return { valid: true };
}

export function fail(reason: string): ValidationResult {
	return { valid: false, reason };
}

export type ValidatorFn<T> = (player: Player, data: T) => ValidationResult;

export function composeValidators<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> {
	return (player: Player, data: T): ValidationResult => {
		for (const validator of validators) {
			const result = validator(player, data);
			if (!result.valid) return result;
		}
		return pass();
	};
}
