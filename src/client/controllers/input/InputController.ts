import { UserInputService } from "@rbxts/services";
import { Signal } from "@rbxts/beacon";
import { Trove } from "@rbxts/trove";
import { Controller } from "client/core/Controller";
import { Logger } from "shared/core/Logger";

export class InputController implements Controller {
	readonly name = "InputController";
	private readonly log = new Logger("InputController");
	private readonly trove = new Trove();
	private readonly bindings = new Map<Enum.KeyCode, string>();

	readonly onAbilityInputPressed = new Signal<[abilityId: string]>();
	readonly onMovementInput = new Signal<[direction: Vector3]>();

	onInit(): void {
		this.registerDefaultBindings();
	}

	onStart(): void {
		this.trove.connect(UserInputService.InputBegan, (input: InputObject, gameProcessed: boolean) => {
			if (gameProcessed) return;
			this.handleInput(input);
		});

		this.log.info("Input listening active");
	}

	bindAbility(keyCode: Enum.KeyCode, abilityId: string): void {
		this.bindings.set(keyCode, abilityId);
	}

	private registerDefaultBindings(): void {
		this.bindAbility(Enum.KeyCode.Q, "fireball");
		this.bindAbility(Enum.KeyCode.E, "heal");
		this.bindAbility(Enum.KeyCode.R, "dash_strike");
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
