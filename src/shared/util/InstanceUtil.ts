export function getHumanoid(character: Model): Humanoid | undefined {
	return character.FindFirstChildOfClass("Humanoid");
}

export function getHumanoidRootPart(character: Model): BasePart | undefined {
	return character.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
}

export function getCharacterPosition(player: Player): Vector3 | undefined {
	const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
	return rootPart?.Position;
}

export function waitForCharacterLoaded(player: Player): Model {
	const character = player.Character ?? player.CharacterAdded.Wait()[0];
	character.WaitForChild("HumanoidRootPart");
	return character;
}

export function isAlive(character: Model | undefined): boolean {
	if (!character) return false;
	const humanoid = character.FindFirstChildOfClass("Humanoid");
	return humanoid !== undefined && humanoid.Health > 0;
}

export function distanceBetween(a: Vector3, b: Vector3): number {
	return a.sub(b).Magnitude;
}
