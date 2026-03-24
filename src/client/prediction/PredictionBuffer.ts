export interface PredictionEntry<T = unknown> {
	sequenceId: number;
	timestamp: number;
	predictedState: T;
}

export class PredictionBuffer<T = unknown> {
	private buffer: PredictionEntry<T>[] = [];
	private nextSequenceId = 0;

	push(predictedState: T): number {
		const sequenceId = this.nextSequenceId++;
		this.buffer.push({
			sequenceId,
			timestamp: os.clock(),
			predictedState,
		});
		return sequenceId;
	}

	acknowledge(sequenceId: number): void {
		this.buffer = this.buffer.filter((entry) => entry.sequenceId > sequenceId);
	}

	reject(sequenceId: number): PredictionEntry<T> | undefined {
		for (let i = 0; i < this.buffer.size(); i++) {
			if (this.buffer[i].sequenceId === sequenceId) {
				return this.buffer.remove(i);
			}
		}
		return undefined;
	}

	getPending(): readonly PredictionEntry<T>[] {
		return this.buffer;
	}

	clear(): void {
		this.buffer.clear();
	}

	getNextSequenceId(): number {
		return this.nextSequenceId;
	}

	getSize(): number {
		return this.buffer.size();
	}
}
