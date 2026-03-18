export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function err<E = string>(reason: E): Result<never, E> {
	return { ok: false, error: reason };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
	return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
	return !result.ok;
}

export function unwrap<T, E>(result: Result<T, E>): T {
	if (!result.ok) {
		error(`Unwrap failed: ${result.error}`);
	}
	return (result as { ok: true; value: T }).value;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
	return result.ok ? result.value : fallback;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
	if (result.ok) {
		return ok(fn(result.value));
	}
	return result as unknown as Result<U, E>;
}
