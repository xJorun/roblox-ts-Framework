import React, { useEffect, useState } from "@rbxts/react";
import { RunService } from "@rbxts/services";
import { useAtom } from "../hooks/UseAtom";
import { abilitySlots, AbilitySlotData } from "client/store/Atoms";

function AbilitySlot({ slot }: { slot: AbilitySlotData }) {
	const now = os.clock();
	const remaining = math.max(0, slot.cooldownEnd - now);
	const onCooldown = remaining > 0;
	const cooldownPct = onCooldown && slot.cooldownDuration > 0 ? remaining / slot.cooldownDuration : 0;

	return (
		<frame
			Size={new UDim2(0, 52, 0, 52)}
			BackgroundColor3={onCooldown ? Color3.fromRGB(22, 22, 28) : Color3.fromRGB(35, 35, 42)}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uistroke
				Color={onCooldown ? Color3.fromRGB(50, 50, 58) : Color3.fromRGB(80, 80, 95)}
				Thickness={1}
			/>

			<textlabel
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.4)}
				Size={UDim2.fromScale(0.9, 0.5)}
				BackgroundTransparency={1}
				Text={slot.name}
				TextColor3={onCooldown ? Color3.fromRGB(100, 100, 110) : Color3.fromRGB(225, 225, 235)}
				TextSize={10}
				TextTruncate={Enum.TextTruncate.AtEnd}
				Font={Enum.Font.GothamMedium}
			/>

			<textlabel
				AnchorPoint={new Vector2(0.5, 1)}
				Position={new UDim2(0.5, 0, 1, -5)}
				Size={new UDim2(0, 22, 0, 16)}
				BackgroundColor3={Color3.fromRGB(50, 50, 60)}
				BackgroundTransparency={0.3}
				Text={slot.keybind}
				TextColor3={Color3.fromRGB(180, 180, 195)}
				TextSize={10}
				Font={Enum.Font.GothamBold}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(0, 4)} />
			</textlabel>

			{onCooldown && (
				<>
					<frame
						AnchorPoint={new Vector2(0, 1)}
						Position={UDim2.fromScale(0, 1)}
						Size={new UDim2(1, 0, cooldownPct, 0)}
						BackgroundColor3={Color3.fromRGB(0, 0, 0)}
						BackgroundTransparency={0.35}
						BorderSizePixel={0}
						ZIndex={3}
					>
						<uicorner CornerRadius={new UDim(0, 8)} />
					</frame>

					<textlabel
						AnchorPoint={new Vector2(0.5, 0.5)}
						Position={UDim2.fromScale(0.5, 0.5)}
						Size={UDim2.fromScale(1, 1)}
						BackgroundTransparency={1}
						Text={string.format("%.1f", remaining)}
						TextColor3={Color3.fromRGB(200, 200, 210)}
						TextSize={16}
						Font={Enum.Font.GothamBold}
						ZIndex={4}
					/>
				</>
			)}
		</frame>
	);
}

export function AbilityBar() {
	const slots = useAtom(abilitySlots);
	const [, forceUpdate] = useState(0);
	const hasActiveCooldown = slots.some((s) => s.cooldownEnd > os.clock());

	useEffect(() => {
		if (!hasActiveCooldown) return;

		let lastTick = 0;
		const conn = RunService.Heartbeat.Connect(() => {
			const now = os.clock();
			if (now - lastTick >= 0.1) {
				lastTick = now;
				forceUpdate(now);
			}
		});
		return () => conn.Disconnect();
	}, [hasActiveCooldown]);

	return (
		<frame
			AnchorPoint={new Vector2(0.5, 1)}
			Position={new UDim2(0.5, 0, 1, -20)}
			Size={new UDim2(0, 250, 0, 52)}
			BackgroundTransparency={1}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				Padding={new UDim(0, 8)}
			/>
			{slots.map((slot) => (
				<AbilitySlot key={slot.abilityId} slot={slot} />
			))}
		</frame>
	);
}
