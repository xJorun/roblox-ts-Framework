import { EntityId } from "shared/core/Types";

export interface RequestEnvelope<T = unknown> {
	sequenceId: number;
	timestamp: number;
	payload: T;
}

export interface AcknowledgeEnvelope {
	sequenceId: number;
	accepted: boolean;
	serverTimestamp: number;
	reason?: string;
}

export interface ReplicationEnvelope<T = unknown> {
	entityId: EntityId;
	state: T;
	tick: number;
}

export interface CorrectionEnvelope<T = unknown> {
	sequenceId: number;
	correctedState: T;
	serverTick: number;
}
