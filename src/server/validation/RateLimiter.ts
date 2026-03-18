import { Players } from "@rbxts/services";
import { MiddlewareFn } from "shared/networking/Middleware";
import { Logger } from "shared/core/Logger";

export interface RateLimitConfig {
	maxRequests: number;
	windowSeconds: number;
}

export function createRateLimiter(config: RateLimitConfig): MiddlewareFn {
	const requests = new Map<Player, number[]>();
	const log = new Logger("RateLimiter");

	Players.PlayerRemoving.Connect((player) => {
		requests.delete(player);
	});

	return (ctx) => {
		let timestamps = requests.get(ctx.player);
		if (!timestamps) {
			timestamps = [];
			requests.set(ctx.player, timestamps);
		}

		const cutoff = ctx.timestamp - config.windowSeconds;
		while (timestamps.size() > 0 && timestamps[0] < cutoff) {
			timestamps.remove(0);
		}

		if (timestamps.size() >= config.maxRequests) {
			log.warn(`Rate limited ${ctx.player.Name} on ${ctx.remoteName}`);
			return false;
		}

		timestamps.push(ctx.timestamp);
		return true;
	};
}
