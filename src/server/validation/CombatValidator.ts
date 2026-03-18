import { AbilityDefinition, AbilityActivationRequest, TargetType } from "shared/types/Ability";
import { ABILITY_DEFINITIONS, CombatConfig } from "shared/config/CombatConfig";
import { isOnCooldown, isInRange } from "shared/gameplay/combat/CombatMath";
import { isAlive, getCharacterPosition } from "shared/util/InstanceUtil";
import { ValidationResult, pass, fail } from "./Validator";
import { Players } from "@rbxts/services";

export class CombatValidator {
	private cooldowns = new Map<string, Map<string, number>>();

	validateAbilityRequest(player: Player, request: AbilityActivationRequest): ValidationResult {
		const ability = ABILITY_DEFINITIONS[request.abilityId];
		if (!ability) {
			return fail("Unknown ability");
		}

		if (!isAlive(player.Character)) {
			return fail("Player is dead");
		}

		if (this.isAbilityOnCooldown(tostring(player.UserId), request.abilityId, ability)) {
			return fail("Ability on cooldown");
		}

		if (ability.targetType === TargetType.Single && request.targetId !== undefined) {
			const rangeResult = this.validateTargetRange(player, request.targetId, ability.range);
			if (!rangeResult.valid) return rangeResult;
		}

		return pass();
	}

	validateTargetRange(attacker: Player, targetId: string, maxRange: number): ValidationResult {
		const attackerPos = getCharacterPosition(attacker);
		if (!attackerPos) return fail("No attacker position");

		const target = Players.GetPlayerByUserId(tonumber(targetId) ?? 0);
		if (!target) return fail("Target not found");

		const targetPos = getCharacterPosition(target);
		if (!targetPos) return fail("No target position");

		if (!isAlive(target.Character)) return fail("Target is dead");

		if (!isInRange(attackerPos, targetPos, math.min(maxRange, CombatConfig.maxHitRange))) {
			return fail("Out of range");
		}

		return pass();
	}

	isAbilityOnCooldown(playerId: string, abilityId: string, ability: AbilityDefinition): boolean {
		const playerCooldowns = this.cooldowns.get(playerId);
		if (!playerCooldowns) return false;

		const lastUsed = playerCooldowns.get(abilityId);
		if (lastUsed === undefined) return false;

		return isOnCooldown(lastUsed, ability.cooldown, os.clock());
	}

	recordCooldown(playerId: string, abilityId: string): void {
		let playerCooldowns = this.cooldowns.get(playerId);
		if (!playerCooldowns) {
			playerCooldowns = new Map();
			this.cooldowns.set(playerId, playerCooldowns);
		}
		playerCooldowns.set(abilityId, os.clock());
	}

	clearPlayerCooldowns(playerId: string): void {
		this.cooldowns.delete(playerId);
	}
}
