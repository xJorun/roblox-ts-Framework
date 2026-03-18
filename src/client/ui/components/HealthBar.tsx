import React, { useEffect } from "@rbxts/react";
import { useMotion } from "@rbxts/pretty-react-hooks";
import { useAtom } from "../hooks/UseAtom";
import { localHealth, localMaxHealth } from "client/store/Atoms";

function healthColor(pct: number): Color3 {
	if (pct > 0.5) {
		return Color3.fromRGB(50, 200, 70).Lerp(Color3.fromRGB(230, 200, 50), (1 - pct) * 2);
	}
	return Color3.fromRGB(230, 200, 50).Lerp(Color3.fromRGB(220, 50, 50), (0.5 - pct) * 2);
}

export function HealthBar() {
	const health = useAtom(localHealth);
	const maxHealth = useAtom(localMaxHealth);
	const pct = maxHealth > 0 ? health / maxHealth : 0;
	const [widthBinding, widthMotion] = useMotion(pct);

	useEffect(() => {
		widthMotion.spring(pct);
	}, [pct]);

	return (
		<frame
			AnchorPoint={new Vector2(0.5, 1)}
			Position={new UDim2(0.5, 0, 1, -80)}
			Size={new UDim2(0.25, 0, 0, 28)}
			BackgroundColor3={Color3.fromRGB(20, 20, 25)}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 6)} />
			<uistroke Color={Color3.fromRGB(55, 55, 65)} Thickness={1} />

			<frame
				Size={widthBinding.map((w: number) => new UDim2(w, 0, 1, 0))}
				BackgroundColor3={healthColor(pct)}
				BorderSizePixel={0}
				ClipsDescendants={true}
			>
				<uicorner CornerRadius={new UDim(0, 6)} />
			</frame>

			<textlabel
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={1}
				Text={`${math.floor(health)} / ${math.floor(maxHealth)}`}
				TextColor3={Color3.fromRGB(240, 240, 245)}
				TextSize={13}
				Font={Enum.Font.GothamBold}
				ZIndex={2}
			/>
		</frame>
	);
}
