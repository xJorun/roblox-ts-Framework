import { Players, RunService } from "@rbxts/services";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { PlayerService } from "server/services/players/PlayerService";
import { Logger } from "shared/core/Logger";
import { GameConfig } from "shared/config/GameConfig";

export class ReplicationService implements Service {
	readonly name = "ReplicationService";
	private readonly log = new Logger("ReplicationService");
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
				this.replicateAll();
			}
		});

		this.log.info(`Replication running at ${GameConfig.tickRate} ticks/s`);
	}

	private replicateAll(): void {
		for (const player of Players.GetPlayers()) {
			const entityId = tostring(player.UserId);
			const state = this.playerService.getEntityState(entityId);
			if (!state) continue;

			this.network.fireClient("StateReplication", player, entityId, state);
		}
	}

	getCurrentTick(): number {
		return this.currentTick;
	}
}
