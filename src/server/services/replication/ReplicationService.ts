import { Players, RunService } from "@rbxts/services";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { PlayerService } from "server/services/players/PlayerService";
import { GameConfig } from "shared/config/GameConfig";

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

		for (const player of Players.GetPlayers()) {
			const entityId = tostring(player.UserId);
			const state = dirty.get(entityId);
			if (!state) continue;

			this.network.fireClient("StateReplication", player, entityId, state);
		}
	}

	getCurrentTick(): number {
		return this.currentTick;
	}
}
