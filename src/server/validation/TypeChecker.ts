import { t } from "@rbxts/t";
import { MiddlewareFn } from "shared/networking/Middleware";
import { Logger } from "shared/core/Logger";

const log = new Logger("TypeChecker");
const checkers = new Map<string, t.check<unknown>>();

export function registerTypeCheck(remoteName: string, checker: t.check<unknown>): void {
	checkers.set(remoteName, checker);
}

export function createTypeCheckMiddleware(): MiddlewareFn {
	return (ctx) => {
		const checker = checkers.get(ctx.remoteName);
		if (!checker) return true;

		if (ctx.args.size() === 0) {
			log.warn(`Empty payload for ${ctx.remoteName} from ${ctx.player.Name}`);
			return false;
		}

		if (!checker(ctx.args[0])) {
			log.warn(`Type validation failed for ${ctx.remoteName} from ${ctx.player.Name}`);
			return false;
		}

		return true;
	};
}

export { t };
