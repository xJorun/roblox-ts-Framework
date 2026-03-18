import React from "@rbxts/react";
import { HealthBar } from "./components/HealthBar";
import { AbilityBar } from "./components/AbilityBar";
import { DamageFeed } from "./components/DamageFeed";

export function App() {
	return (
		<>
			<HealthBar />
			<AbilityBar />
			<DamageFeed />
		</>
	);
}
