import { Players, RunService } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Service } from "server/core/Service";
import { ServerNetwork } from "server/networking/ServerNet";
import { DataService } from "server/services/data/DataService";
import { Logger } from "shared/core/Logger";
import { GameConfig } from "shared/config/GameConfig";
import { CombatConfig } from "shared/config/CombatConfig";
import { CharacterState, createDefaultCharacterState } from "shared/gameplay/characters/CharacterTypes";
import { StatusEffect } from "shared/types/Combat";
import { clampHealth, pruneExpiredEffects } from "shared/gameplay/combat/CombatMath";

export class PlayerService implements Service {
	readonly name = "PlayerService";
	private readonly log = new Logger("PlayerService");
	private readonly entityStates = new Map<string, CharacterState>();
	private readonly dirtyEntities = new Set<string>();
	private readonly playTimeTrackers = new Map<string, number>();
	private lastPlayTimeFlush = os.clock();

	readonly onPlayerReady = new Signal<[player: Player, state: Readonly<CharacterState>]>();
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

		RunService.Heartbeat.Connect(() => this.tick());
		this.dataService.onAutoSave.Connect(() => this.flushPlayTime());
	}

	onDestroy(): void {
		this.flushPlayTime();
	}

	getEntityState(entityId: string): Readonly<CharacterState> | undefined {
		return this.entityStates.get(entityId);
	}

	applyDamage(entityId: string, amount: number): boolean {
		const state = this.entityStates.get(entityId);
		if (!state || !state.alive) return false;

		state.health = clampHealth(state.health - amount, state.maxHealth);
		state.combatState.lastDamageTimestamp = os.clock();
		state.combatState.isInCombat = true;

		if (state.health <= 0) {
			state.alive = false;
		}

		this.dirtyEntities.add(entityId);
		return true;
	}

	applyHeal(entityId: string, amount: number): void {
		const state = this.entityStates.get(entityId);
		if (!state || !state.alive) return;

		state.health = clampHealth(state.health + amount, state.maxHealth);
		this.dirtyEntities.add(entityId);
	}

	setAlive(entityId: string, alive: boolean): void {
		const state = this.entityStates.get(entityId);
		if (!state) return;

		state.alive = alive;
		this.dirtyEntities.add(entityId);
	}

	addStatusEffect(entityId: string, effect: StatusEffect): boolean {
		const state = this.entityStates.get(entityId);
		if (!state) return false;

		state.combatState.statusEffects = pruneExpiredEffects(state.combatState.statusEffects, os.clock());
		if (state.combatState.statusEffects.size() >= CombatConfig.maxConcurrentStatusEffects) return false;

		state.combatState.statusEffects.push(effect);
		this.dirtyEntities.add(entityId);
		return true;
	}

	markDirty(entityId: string): void {
		this.dirtyEntities.add(entityId);
	}

	consumeDirtyEntities(): Map<string, Readonly<CharacterState>> {
		const result = new Map<string, Readonly<CharacterState>>();
		for (const entityId of this.dirtyEntities) {
			const state = this.entityStates.get(entityId);
			if (state) result.set(entityId, state);
		}
		this.dirtyEntities.clear();
		return result;
	}

	isEntityAlive(entityId: string): boolean {
		const state = this.entityStates.get(entityId);
		return state !== undefined && state.alive;
	}

	scheduleRespawn(entityId: string): void {
		task.delay(GameConfig.respawnDelay, () => {
			const state = this.entityStates.get(entityId);
			if (!state) return;

			state.health = state.maxHealth;
			state.alive = true;
			state.combatState.statusEffects = [];
			state.combatState.isInCombat = false;
			this.dirtyEntities.add(entityId);
		});
	}

	incrementKills(entityId: string): void {
		const player = Players.GetPlayerByUserId(tonumber(entityId) ?? 0);
		if (!player) return;
		const data = this.dataService.getData(player);
		if (data) data.stats.totalKills++;
	}

	incrementDeaths(entityId: string): void {
		const player = Players.GetPlayerByUserId(tonumber(entityId) ?? 0);
		if (!player) return;
		const data = this.dataService.getData(player);
		if (data) data.stats.totalDeaths++;
	}

	addDamageDealt(entityId: string, amount: number): void {
		const player = Players.GetPlayerByUserId(tonumber(entityId) ?? 0);
		if (!player) return;
		const data = this.dataService.getData(player);
		if (data) data.stats.totalDamageDealt += amount;
	}

	private tick(): void {
		const now = os.clock();

		for (const [entityId, state] of this.entityStates) {
			if (
				state.combatState.isInCombat &&
				now - state.combatState.lastDamageTimestamp > GameConfig.combatExitDelay
			) {
				state.combatState.isInCombat = false;
				this.dirtyEntities.add(entityId);
			}
		}

		if (now - this.lastPlayTimeFlush >= 60) {
			this.lastPlayTimeFlush = now;
			this.flushPlayTime();
		}
	}

	private flushPlayTime(): void {
		for (const [entityId, lastCheck] of this.playTimeTrackers) {
			const player = Players.GetPlayerByUserId(tonumber(entityId) ?? 0);
			if (!player) continue;

			const data = this.dataService.getData(player);
			if (data) {
				data.stats.playTime += os.clock() - lastCheck;
			}
			this.playTimeTrackers.set(entityId, os.clock());
		}
	}

	private handlePlayerJoined(player: Player): void {
		const result = this.dataService.loadProfile(player);
		if (!result.ok) {
			player.Kick(result.error);
			return;
		}

		this.log.info(`Player joined: ${player.Name}`);

		const entityId = tostring(player.UserId);
		const characterState = createDefaultCharacterState(entityId, entityId);
		this.entityStates.set(entityId, characterState);
		this.playTimeTrackers.set(entityId, os.clock());

		player.CharacterAdded.Connect(() => {
			this.onCharacterSpawned(entityId);
		});

		if (player.Character) {
			this.onCharacterSpawned(entityId);
		}

		this.onPlayerReady.Fire(player, characterState);
	}

	private onCharacterSpawned(entityId: string): void {
		const state = this.entityStates.get(entityId);
		if (!state) return;

		state.health = state.maxHealth;
		state.alive = true;
		state.combatState.statusEffects = [];
		this.dirtyEntities.add(entityId);
	}

	private handlePlayerLeaving(player: Player): void {
		this.log.info(`Player leaving: ${player.Name}`);
		const entityId = tostring(player.UserId);

		const lastCheck = this.playTimeTrackers.get(entityId);
		if (lastCheck !== undefined) {
			const data = this.dataService.getData(player);
			if (data) {
				data.stats.playTime += os.clock() - lastCheck;
			}
		}

		this.entityStates.delete(entityId);
		this.dirtyEntities.delete(entityId);
		this.playTimeTrackers.delete(entityId);
		this.onPlayerRemoving.Fire(player);
	}
}
