export interface RemoteMarker<T extends unknown[]> {
	readonly _nominal?: T;
}

export function event<T extends unknown[]>(): RemoteMarker<T> {
	return {} as RemoteMarker<T>;
}

export type ExtractArgs<R> = R extends RemoteMarker<infer T> ? T : never;
