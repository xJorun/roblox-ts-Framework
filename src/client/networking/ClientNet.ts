import { ReplicatedStorage } from "@rbxts/services";
import { Logger } from "shared/core/Logger";
import {
	ClientToServer,
	ServerToClient,
	ClientEventName,
	ServerEventName,
	ClientEventArgs,
	ServerEventArgs,
} from "shared/networking/Remotes";

const FOLDER_NAME = "Remotes";

export class ClientNetwork {
	private readonly events = new Map<string, RemoteEvent>();
	private readonly log = new Logger("ClientNetwork");

	initialize(): void {
		this.log.info("Waiting for remotes...");
		const folder = ReplicatedStorage.WaitForChild(FOLDER_NAME) as Folder;

		for (const [remoteName] of pairs(ClientToServer)) {
			const remote = folder.WaitForChild(remoteName as string) as RemoteEvent;
			this.events.set(remoteName as string, remote);
		}

		for (const [remoteName] of pairs(ServerToClient)) {
			const remote = folder.WaitForChild(remoteName as string) as RemoteEvent;
			this.events.set(remoteName as string, remote);
		}

		this.log.info(`Resolved ${this.events.size()} remotes`);
	}

	fireServer<K extends ClientEventName>(eventName: K, ...args: ClientEventArgs<K>): void {
		const remote = this.events.get(eventName as string);
		assert(remote !== undefined, `Remote not found: ${eventName as string}`);
		remote.FireServer(...(args as unknown[]));
	}

	onServerEvent<K extends ServerEventName>(
		eventName: K,
		handler: (...args: ServerEventArgs<K>) => void,
	): RBXScriptConnection {
		const remote = this.events.get(eventName as string);
		assert(remote !== undefined, `Remote not found: ${eventName as string}`);
		return remote.OnClientEvent.Connect((...rawArgs: unknown[]) => {
			handler(...(rawArgs as unknown as ServerEventArgs<K>));
		});
	}
}
