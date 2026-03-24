import { UserInputService } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Trove } from "@rbxts/trove";
import { Controller } from "client/core/Controller";
import { KEYBIND_CONFIG } from "shared/config/KeybindConfig";

export class InputController implements Controller {
	readonly name = "InputController";
	private readonly trove = new Trove();
	private readonly bindings = new Map<Enum.KeyCode, string>();

	readonly onAbilityInputPressed = new Signal<[abilityId: string]>();
	readonly onMovementInput = new Signal<[direction: Vector3]>();

	onInit(): void {
		for (const entry of KEYBIND_CONFIG) {
			this.bindings.set(entry.keyCode, entry.abilityId);
		}
	}

	onStart(): void {
		this.trove.connect(UserInputService.InputBegan, (input: InputObject, gameProcessed: boolean) => {
			if (gameProcessed) return;
			this.handleInput(input);
		});
	}

	bindAbility(keyCode: Enum.KeyCode, abilityId: string): void {
		this.bindings.set(keyCode, abilityId);
	}

	private handleInput(input: InputObject): void {
		if (input.UserInputType === Enum.UserInputType.Keyboard) {
			const abilityId = this.bindings.get(input.KeyCode);
			if (abilityId !== undefined) {
				this.onAbilityInputPressed.Fire(abilityId);
			}
		}
	}
}
