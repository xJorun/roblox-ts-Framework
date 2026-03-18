import { Logger } from "shared/core/Logger";
import { Controller } from "./Controller";

export class ControllerRegistry {
	private controllers = new Map<string, Controller>();
	private initialized = false;
	private started = false;
	private readonly log = new Logger("ControllerRegistry");

	register(controller: Controller): this {
		assert(!this.initialized, "Cannot register controllers after initialization");
		assert(!this.controllers.has(controller.name), `Duplicate controller: ${controller.name}`);

		this.controllers.set(controller.name, controller);
		this.log.debug(`Registered: ${controller.name}`);
		return this;
	}

	get<T extends Controller>(controllerName: string): T {
		const controller = this.controllers.get(controllerName);
		assert(controller !== undefined, `Controller not found: ${controllerName}`);
		return controller as T;
	}

	start(): void {
		assert(!this.initialized, "ControllerRegistry already started");
		this.initialized = true;

		this.log.info("Initializing controllers...");
		for (const [controllerName, controller] of this.controllers) {
			if (controller.onInit !== undefined) {
				this.log.debug(`Init: ${controllerName}`);
				controller.onInit();
			}
		}

		this.log.info("Starting controllers...");
		this.started = true;
		for (const [controllerName, controller] of this.controllers) {
			if (controller.onStart !== undefined) {
				this.log.debug(`Start: ${controllerName}`);
				task.spawn(() => controller.onStart!());
			}
		}

		this.log.info("All controllers running");
	}

	isRunning(): boolean {
		return this.started;
	}
}
