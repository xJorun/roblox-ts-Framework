import { AbilityActivationRequest, AbilityOutcome } from "shared/types/Ability";
import { DamageInstance, StatusEffect } from "shared/types/Combat";
import { CharacterState } from "shared/gameplay/characters/CharacterTypes";
import { event, RemoteMarker } from "./NetTypes";

export const ClientToServer = {
	RequestAbility: event<[request: AbilityActivationRequest]>(),
	RequestAction: event<[actionType: string]>(),
};

export const ServerToClient = {
	AbilityOutcome: event<[result: AbilityOutcome]>(),
	AbilityRejected: event<[sequenceId: number, reason: string]>(),
	DamageApplied: event<[damage: DamageInstance]>(),
	StateReplication: event<[entityId: string, state: CharacterState]>(),
	EffectApplied: event<[targetEntityId: string, effect: StatusEffect]>(),
};

export type ClientEventName = keyof typeof ClientToServer;
export type ServerEventName = keyof typeof ServerToClient;

type InferArgs<R> = R extends RemoteMarker<infer T> ? T : never;
export type ClientEventArgs<K extends ClientEventName> = InferArgs<(typeof ClientToServer)[K]>;
export type ServerEventArgs<K extends ServerEventName> = InferArgs<(typeof ServerToClient)[K]>;
