import { Players, RunService } from "@rbxts/services";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { PlayerService } from "server/services/players/PlayerService";
import { GameConfig } from "shared/config/GameConfig";
import { distanceBetween, getCharacterPosition } from "shared/util/InstanceUtil";

export class ReplicationService implements Service {
	readonly name = "ReplicationService";
	private tickAccumulator = 0;
	private currentTick = 0;

	constructor(
		private readonly network: ServerNetwork,
		private readonly playerService: PlayerService,
	) {}

	onStart(): void {
		const tickInterval = 1 / GameConfig.tickRate;

		RunService.Heartbeat.Connect((dt) => {
			this.tickAccumulator += dt;
			if (this.tickAccumulator >= tickInterval) {
				this.tickAccumulator -= tickInterval;
				this.currentTick++;
				this.replicateDirty();
			}
		});
	}

	private replicateDirty(): void {
		const dirty = this.playerService.consumeDirtyEntities();
		if (dirty.size() === 0) return;

		const range = GameConfig.replicationRange;
		const players = Players.GetPlayers();

		for (const [entityId, state] of dirty) {
			const owner = Players.GetPlayerByUserId(tonumber(entityId) ?? 0);
			const entityPos = owner !== undefined ? getCharacterPosition(owner) : undefined;

			for (const player of players) {
				if (tostring(player.UserId) === entityId) {
					this.network.fireClient("StateReplication", player, entityId, state);
					continue;
				}

				if (entityPos === undefined) {
					continue;
				}

				const observerPos = getCharacterPosition(player);
				if (observerPos === undefined) {
					continue;
				}

				if (distanceBetween(entityPos, observerPos) <= range) {
					this.network.fireClient("StateReplication", player, entityId, state);
				}
			}
		}
	}

	getCurrentTick(): number {
		return this.currentTick;
	}
}
