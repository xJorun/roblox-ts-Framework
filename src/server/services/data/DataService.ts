import ProfileService from "@rbxts/profileservice";
import type { Profile } from "@rbxts/profileservice/globals";
import { Players } from "@rbxts/services";
import { Service } from "server/core/Service";
import { Logger } from "shared/core/Logger";
import { GameConfig } from "shared/config/GameConfig";
import { PlayerData, createDefaultPlayerData } from "server/data/PlayerDataSchema";

type PlayerProfile = Profile<PlayerData>;

export class DataService implements Service {
	readonly name = "DataService";
	private readonly log = new Logger("DataService");
	private profileStore!: ReturnType<typeof ProfileService.GetProfileStore<PlayerData>>;
	private profiles = new Map<Player, PlayerProfile>();

	onInit(): void {
		this.profileStore = ProfileService.GetProfileStore<PlayerData>(
			GameConfig.data.storeName,
			createDefaultPlayerData(),
		);
	}

	onStart(): void {
		Players.PlayerRemoving.Connect((player) => this.releaseProfile(player));
	}

	loadProfile(player: Player): PlayerProfile | undefined {
		const profile = this.profileStore.LoadProfileAsync(`Player_${player.UserId}`);
		if (!profile) {
			this.log.warn(`Failed to load profile for ${player.Name}`);
			return undefined;
		}

		profile.AddUserId(player.UserId);
		profile.Reconcile();

		if (!player.IsDescendantOf(game)) {
			profile.Release();
			return undefined;
		}

		profile.ListenToRelease(() => {
			this.profiles.delete(player);
			if (player.IsDescendantOf(game)) {
				player.Kick("Your data session has ended. Please rejoin.");
			}
		});

		this.profiles.set(player, profile);
		this.log.info(`Loaded profile for ${player.Name}`);
		return profile;
	}

	getProfile(player: Player): PlayerProfile | undefined {
		return this.profiles.get(player);
	}

	getData(player: Player): PlayerData | undefined {
		return this.profiles.get(player)?.Data;
	}

	getDataOrFail(player: Player): PlayerData {
		const profile = this.profiles.get(player);
		assert(profile !== undefined, `No profile loaded for ${player.Name}`);
		return profile.Data;
	}

	releaseProfile(player: Player): void {
		const profile = this.profiles.get(player);
		if (profile) {
			profile.Release();
		}
	}
}
