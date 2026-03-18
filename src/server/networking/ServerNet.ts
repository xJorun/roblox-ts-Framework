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
		this.log.info("Creating remotes...");

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
		this.log.info(`Created ${this.clientEvents.size() + this.serverEvents.size()} remotes`);
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

			handler(player, ...(rawArgs as unknown as ClientEventArgs<K>));
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
