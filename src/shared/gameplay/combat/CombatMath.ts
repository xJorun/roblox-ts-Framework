import { StatusEffect } from "shared/types/Combat";

export function calculateDamage(
	baseDamage: number,
	attackMultiplier: number,
	defenseMultiplier: number,
): number {
	const raw = baseDamage * attackMultiplier;
	const mitigated = raw * math.max(0, 1 - defenseMultiplier);
	return math.floor(math.max(1, mitigated));
}

export function isInRange(source: Vector3, target: Vector3, range: number): boolean {
	return source.sub(target).Magnitude <= range;
}

export function isOnCooldown(
	lastUsedTime: number,
	cooldownDuration: number,
	currentTime: number,
): boolean {
	return currentTime - lastUsedTime < cooldownDuration;
}

export function getRemainingCooldown(
	lastUsedTime: number,
	cooldownDuration: number,
	currentTime: number,
): number {
	return math.max(0, cooldownDuration - (currentTime - lastUsedTime));
}

export function clampHealth(current: number, max: number): number {
	return math.clamp(current, 0, max);
}

export function isEffectExpired(effect: StatusEffect, currentTime: number): boolean {
	return currentTime - effect.startTime >= effect.duration;
}

export function pruneExpiredEffects(effects: StatusEffect[], currentTime: number): StatusEffect[] {
	return effects.filter((effect) => !isEffectExpired(effect, currentTime));
}
