export interface MiddlewareContext {
	player: Player;
	remoteName: string;
	args: readonly unknown[];
	timestamp: number;
}

export type MiddlewareFn = (context: MiddlewareContext) => boolean;
