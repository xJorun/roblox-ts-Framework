import { ReplicatedStorage } from "@rbxts/services";
import { Logger } from "shared/core/Logger";
import { MiddlewareContext, MiddlewareFn } from "shared/networking/Middleware";
import {
	ClientToServer,
	ServerToClient,
	ClientEventName,
	ServerEventName,
	ClientEventArgs,
	ServerEventArgs,
} from "shared/networking/Remotes";

const FOLDER_NAME = "Remotes";

export class ServerNetwork {
	private readonly folder: Folder;
	private readonly clientEvents = new Map<string, RemoteEvent>();
	private readonly serverEvents = new Map<string, RemoteEvent>();
	private readonly globalMiddleware: MiddlewareFn[] = [];
	private readonly log = new Logger("ServerNetwork");

	constructor() {
		this.folder = new Instance("Folder");
		this.folder.Name = FOLDER_NAME;
	}

	initialize(): void {
		for (const [remoteName] of pairs(ClientToServer)) {
			const remote = new Instance("RemoteEvent");
			remote.Name = remoteName as string;
			remote.Parent = this.folder;
			this.clientEvents.set(remoteName as string, remote);
		}

		for (const [remoteName] of pairs(ServerToClient)) {
			const remote = new Instance("RemoteEvent");
			remote.Name = remoteName as string;
			remote.Parent = this.folder;
			this.serverEvents.set(remoteName as string, remote);
		}

		this.folder.Parent = ReplicatedStorage;
	}

	use(middleware: MiddlewareFn): void {
		this.globalMiddleware.push(middleware);
	}

	onClientEvent<K extends ClientEventName>(
		eventName: K,
		handler: (player: Player, ...args: ClientEventArgs<K>) => void,
	): RBXScriptConnection {
		const remote = this.clientEvents.get(eventName as string);
		assert(remote !== undefined, `Client remote not found: ${eventName as string}`);

		return remote.OnServerEvent.Connect((player, ...rawArgs: unknown[]) => {
			const ctx: MiddlewareContext = {
				player,
				remoteName: eventName as string,
				args: rawArgs,
				timestamp: os.clock(),
			};

			if (!this.runMiddleware(ctx)) return;

			handler(player, ...this.deserializeClientArgs<K>(rawArgs));
		});
	}

	fireClient<K extends ServerEventName>(
		eventName: K,
		player: Player,
		...args: ServerEventArgs<K>
	): void {
		const remote = this.serverEvents.get(eventName as string);
		assert(remote !== undefined, `Server remote not found: ${eventName as string}`);
		remote.FireClient(player, ...(args as unknown[]));
	}

	fireAllClients<K extends ServerEventName>(eventName: K, ...args: ServerEventArgs<K>): void {
		const remote = this.serverEvents.get(eventName as string);
		assert(remote !== undefined, `Server remote not found: ${eventName as string}`);
		remote.FireAllClients(...(args as unknown[]));
	}

	fireClientList<K extends ServerEventName>(
		eventName: K,
		players: Player[],
		...args: ServerEventArgs<K>
	): void {
		const remote = this.serverEvents.get(eventName as string);
		assert(remote !== undefined, `Server remote not found: ${eventName as string}`);
		for (const player of players) {
			remote.FireClient(player, ...(args as unknown[]));
		}
	}

	private deserializeClientArgs<K extends ClientEventName>(rawArgs: unknown[]): ClientEventArgs<K> {
		return rawArgs as unknown as ClientEventArgs<K>;
	}

	private runMiddleware(ctx: MiddlewareContext): boolean {
		for (const mw of this.globalMiddleware) {
			if (!mw(ctx)) {
				this.log.debug(`Middleware rejected ${ctx.remoteName} from ${ctx.player.Name}`);
				return false;
			}
		}
		return true;
	}
}
