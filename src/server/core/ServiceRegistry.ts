import { Logger } from "shared/core/Logger";
import { Service } from "./Service";

export class ServiceRegistry {
	private services = new Map<string, Service>();
	private initialized = false;
	private started = false;
	private readonly log = new Logger("ServiceRegistry");

	register(service: Service): this {
		assert(!this.initialized, "Cannot register services after initialization");
		assert(!this.services.has(service.name), `Duplicate service: ${service.name}`);

		this.services.set(service.name, service);
		this.log.debug(`Registered: ${service.name}`);
		return this;
	}

	get<T extends Service>(serviceName: string): T {
		const service = this.services.get(serviceName);
		assert(service !== undefined, `Service not found: ${serviceName}`);
		return service as T;
	}

	start(): void {
		assert(!this.initialized, "ServiceRegistry already started");
		this.initialized = true;

		this.log.info("Initializing services...");
		for (const [serviceName, service] of this.services) {
			if (service.onInit !== undefined) {
				this.log.debug(`Init: ${serviceName}`);
				service.onInit();
			}
		}

		this.log.info("Starting services...");
		this.started = true;
		for (const [serviceName, service] of this.services) {
			if (service.onStart !== undefined) {
				this.log.debug(`Start: ${serviceName}`);
				task.spawn(() => service.onStart!());
			}
		}

		this.log.info("All services running");
	}

	isRunning(): boolean {
		return this.started;
	}
}
