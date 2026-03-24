import { t } from "@rbxts/t";
import { MiddlewareFn } from "shared/networking/Middleware";
import { Logger } from "shared/core/Logger";

const log = new Logger("TypeChecker");
const checkerMap = new Map<string, t.check<unknown>[]>();

export function registerTypeChecks(remoteName: string, ...checkers: t.check<unknown>[]): void {
	checkerMap.set(remoteName, checkers);
}

export function createTypeCheckMiddleware(): MiddlewareFn {
	return (ctx) => {
		const checkers = checkerMap.get(ctx.remoteName);
		if (!checkers) return true;

		if (ctx.args.size() < checkers.size()) {
			log.warn(`Insufficient args for ${ctx.remoteName} from ${ctx.player.Name}`);
			return false;
		}

		for (let i = 0; i < checkers.size(); i++) {
			if (!checkers[i](ctx.args[i])) {
				log.warn(`Type validation failed for ${ctx.remoteName} arg ${i} from ${ctx.player.Name}`);
				return false;
			}
		}

		return true;
	};
}

export { t };
