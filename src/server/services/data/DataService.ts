import ProfileService from "@rbxts/profileservice";
import type { Profile } from "@rbxts/profileservice/globals";
import { Players } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Service } from "server/core/Service";
import { Logger } from "shared/core/Logger";
import { Result, ok, err } from "shared/core/Result";
import { GameConfig } from "shared/config/GameConfig";
import { PlayerData, createDefaultPlayerData, migratePlayerData } from "server/data/PlayerDataSchema";

type PlayerProfile = Profile<PlayerData>;

export class DataService implements Service {
	readonly name = "DataService";
	private readonly log = new Logger("DataService");
	private profileStore!: ReturnType<typeof ProfileService.GetProfileStore<PlayerData>>;
	private readonly profiles = new Map<Player, PlayerProfile>();
	readonly onAutoSave = new Signal<[]>();

	onInit(): void {
		this.profileStore = ProfileService.GetProfileStore<PlayerData>(
			GameConfig.data.storeName,
			createDefaultPlayerData(),
		);
	}

	onStart(): void {
		Players.PlayerRemoving.Connect((player) => this.releaseProfile(player));

		task.spawn(() => {
			while (true) {
				task.wait(GameConfig.data.autoSaveInterval);
				this.onAutoSave.Fire();
			}
		});
	}

	onDestroy(): void {
		for (const [, profile] of this.profiles) {
			profile.Release();
		}
	}

	loadProfile(player: Player): Result<PlayerProfile, string> {
		const profile = this.profileStore.LoadProfileAsync(`Player_${player.UserId}`);
		if (!profile) {
			this.log.error(`Failed to load profile for ${player.Name}`);
			return err(`Failed to load profile for ${player.Name}`);
		}

		profile.AddUserId(player.UserId);
		migratePlayerData(profile.Data);
		profile.Reconcile();

		if (!player.IsDescendantOf(game)) {
			profile.Release();
			return err("Player left during profile load");
		}

		profile.ListenToRelease(() => {
			this.profiles.delete(player);
			if (player.IsDescendantOf(game)) {
				player.Kick("Your data session has ended. Please rejoin.");
			}
		});

		this.profiles.set(player, profile);
		this.log.info(`Loaded profile for ${player.Name}`);
		return ok(profile);
	}

	getProfile(player: Player): PlayerProfile | undefined {
		return this.profiles.get(player);
	}

	getData(player: Player): PlayerData | undefined {
		return this.profiles.get(player)?.Data;
	}

	releaseProfile(player: Player): void {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Release();
		}
	}
}
