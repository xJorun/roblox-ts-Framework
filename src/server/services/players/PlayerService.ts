import { Players } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { DataService } from "server/services/data/DataService";
import { Logger } from "shared/core/Logger";
import { CharacterState, createDefaultCharacterState } from "shared/gameplay/characters/CharacterTypes";

export class PlayerService implements Service {
	readonly name = "PlayerService";
	private readonly log = new Logger("PlayerService");
	private readonly entityStates = new Map<string, CharacterState>();

	readonly onPlayerReady = new Signal<[player: Player, state: CharacterState]>();
	readonly onPlayerRemoving = new Signal<[player: Player]>();

	constructor(
		private readonly network: ServerNetwork,
		private readonly dataService: DataService,
	) {}

	onStart(): void {
		Players.PlayerAdded.Connect((player) => this.handlePlayerJoined(player));
		Players.PlayerRemoving.Connect((player) => this.handlePlayerLeaving(player));

		for (const player of Players.GetPlayers()) {
			task.spawn(() => this.handlePlayerJoined(player));
		}
	}

	getEntityState(playerId: string): CharacterState | undefined {
		return this.entityStates.get(playerId);
	}

	setEntityState(playerId: string, state: CharacterState): void {
		this.entityStates.set(playerId, state);
	}

	private handlePlayerJoined(player: Player): void {
		this.log.info(`Player joined: ${player.Name}`);

		this.dataService.loadProfile(player);

		const entityId = tostring(player.UserId);
		const characterState = createDefaultCharacterState(entityId, entityId);
		this.entityStates.set(entityId, characterState);

		player.CharacterAdded.Connect(() => {
			this.onCharacterSpawned(player, entityId);
		});

		if (player.Character) {
			this.onCharacterSpawned(player, entityId);
		}

		this.onPlayerReady.Fire(player, characterState);
	}

	private onCharacterSpawned(player: Player, entityId: string): void {
		const state = this.entityStates.get(entityId);
		if (!state) return;

		state.health = state.maxHealth;
		state.alive = true;
		state.statusEffects = [];

		this.network.fireClient("StateReplication", player, entityId, state);
	}

	private handlePlayerLeaving(player: Player): void {
		this.log.info(`Player leaving: ${player.Name}`);
		const entityId = tostring(player.UserId);
		this.entityStates.delete(entityId);
		this.onPlayerRemoving.Fire(player);
	}
}
