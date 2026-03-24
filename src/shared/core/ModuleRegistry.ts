import { FrameworkModule } from "./Lifecycle";

export class ModuleRegistry<T extends FrameworkModule> {
	private readonly modules = new Map<string, T>();
	private readonly order: string[] = [];
	private initialized = false;
	private started = false;

	register(mod: T): this {
		assert(!this.initialized, `Cannot register after initialization: ${mod.name}`);
		assert(!this.modules.has(mod.name), `Duplicate module: ${mod.name}`);
		this.modules.set(mod.name, mod);
		this.order.push(mod.name);
		return this;
	}

	get<U extends T>(name: string): U {
		const mod = this.modules.get(name);
		assert(mod !== undefined, `Module not found: ${name}`);
		return mod as U;
	}

	start(): void {
		assert(!this.initialized, "Already started");
		this.initialized = true;

		for (const [, mod] of this.modules) {
			mod.onInit?.();
		}

		this.started = true;
		for (const [, mod] of this.modules) {
			if (mod.onStart) {
				task.spawn(() => mod.onStart!());
			}
		}
	}

	shutdown(): void {
		for (let i = this.order.size() - 1; i >= 0; i--) {
			const mod = this.modules.get(this.order[i]);
			mod?.onDestroy?.();
		}
	}

	isRunning(): boolean {
		return this.started;
	}
}
