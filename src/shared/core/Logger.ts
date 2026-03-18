export enum LogLevel {
	Debug = 0,
	Info = 1,
	Warn = 2,
	Error = 3,
	None = 4,
}

let globalLevel = LogLevel.Info;

export function setGlobalLogLevel(level: LogLevel): void {
	globalLevel = level;
}

export class Logger {
	constructor(
		private readonly prefix: string,
		private level?: LogLevel,
	) {}

	private getLevel(): LogLevel {
		return this.level ?? globalLevel;
	}

	debug(message: string, ...args: unknown[]): void {
		if (this.getLevel() <= LogLevel.Debug) {
			print(`[${this.prefix}] ${message}`, ...args);
		}
	}

	info(message: string, ...args: unknown[]): void {
		if (this.getLevel() <= LogLevel.Info) {
			print(`[${this.prefix}] ${message}`, ...args);
		}
	}

	warn(message: string, ...args: unknown[]): void {
		if (this.getLevel() <= LogLevel.Warn) {
			warn(`[${this.prefix}] ${message}`, ...args);
		}
	}

	fatal(message: string): never {
		error(`[${this.prefix}] ${message}`);
	}
}
