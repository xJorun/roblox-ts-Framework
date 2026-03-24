import { Players } from "@rbxts/services";
import React from "@rbxts/react";
import { createRoot } from "@rbxts/react-roblox";
import { Trove } from "@rbxts/trove";
import { Controller } from "client/core/Controller";
import { ClientNetwork } from "client/networking/ClientNet";
import { CharacterState } from "shared/gameplay/characters/CharacterTypes";
import { ABILITY_DEFINITIONS } from "shared/config/CombatConfig";
import { KEYBIND_CONFIG } from "shared/config/KeybindConfig";
import { App } from "client/ui/App";
import {
	localHealth,
	localMaxHealth,
	localAlive,
	abilitySlots,
	pushDamageEvent,
	AbilitySlotData,
} from "client/store/Atoms";

export class UIController implements Controller {
	readonly name = "UIController";
	private readonly trove = new Trove();
	private localEntityId!: string;

	constructor(private readonly network: ClientNetwork) {}

	onInit(): void {
		this.localEntityId = tostring(Players.LocalPlayer.UserId);
		this.initAbilitySlots();
	}

	onStart(): void {
		this.mountUI();

		this.trove.add(
			this.network.onServerEvent("StateReplication", (entityId, state) => {
				if (entityId === this.localEntityId) {
					this.updateLocalState(state);
				}
			}),
		);

		this.trove.add(
			this.network.onServerEvent("DamageApplied", (damage) => {
				if (damage.targetEntityId === this.localEntityId) {
					pushDamageEvent(damage.amount, damage.damageType);
				}
			}),
		);

		this.trove.add(
			this.network.onServerEvent("AbilityOutcome", (outcome) => {
				if (outcome.casterId === this.localEntityId && outcome.success) {
					this.startCooldown(outcome.abilityId);
				}
			}),
		);
	}

	private mountUI(): void {
		const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

		const screenGui = new Instance("ScreenGui");
		screenGui.Name = "GameUI";
		screenGui.IgnoreGuiInset = true;
		screenGui.ResetOnSpawn = false;
		screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
		screenGui.Parent = playerGui;

		const root = createRoot(screenGui);
		root.render(React.createElement(App));

		this.trove.add(() => {
			root.unmount();
			screenGui.Destroy();
		});
	}

	private initAbilitySlots(): void {
		const slots: AbilitySlotData[] = [];

		for (const entry of KEYBIND_CONFIG) {
			const def = ABILITY_DEFINITIONS[entry.abilityId];
			if (def) {
				slots.push({
					abilityId: entry.abilityId,
					name: def.name,
					keybind: entry.label,
					cooldownEnd: 0,
					cooldownDuration: def.cooldown,
				});
			}
		}

		abilitySlots(slots);
	}

	private updateLocalState(state: CharacterState): void {
		localHealth(state.health);
		localMaxHealth(state.maxHealth);
		localAlive(state.alive);
	}

	private startCooldown(abilityId: string): void {
		const current = abilitySlots();
		const def = ABILITY_DEFINITIONS[abilityId];
		if (!def) return;

		abilitySlots(
			current.map((slot) => {
				if (slot.abilityId === abilityId) {
					return { ...slot, cooldownEnd: os.clock() + def.cooldown };
				}
				return slot;
			}),
		);
	}
}
