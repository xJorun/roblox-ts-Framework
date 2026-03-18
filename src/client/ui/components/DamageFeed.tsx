import React, { useEffect } from "@rbxts/react";
import { useMotion } from "@rbxts/pretty-react-hooks";
import { useAtom } from "../hooks/UseAtom";
import { damageEvents, DamageEvent } from "client/store/Atoms";

function DamageEntry({ dmg }: { dmg: DamageEvent }) {
	const [transparency, transparencyMotion] = useMotion(0);

	useEffect(() => {
		const thread = task.delay(1, () => {
			transparencyMotion.spring(1);
		});
		return () => task.cancel(thread);
	}, []);

	return (
		<textlabel
			Size={new UDim2(1, 0, 0, 22)}
			BackgroundTransparency={1}
			Text={`-${math.floor(dmg.amount)} ${dmg.damageType}`}
			TextColor3={Color3.fromRGB(240, 70, 70)}
			TextTransparency={transparency}
			TextSize={14}
			Font={Enum.Font.GothamBold}
			TextXAlignment={Enum.TextXAlignment.Right}
		/>
	);
}

export function DamageFeed() {
	const events = useAtom(damageEvents);

	return (
		<frame
			AnchorPoint={new Vector2(1, 0)}
			Position={new UDim2(1, -20, 0, 20)}
			Size={new UDim2(0, 200, 0, 250)}
			BackgroundTransparency={1}
		>
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 2)}
				VerticalAlignment={Enum.VerticalAlignment.Top}
			/>
			{events.map((ev) => (
				<DamageEntry key={`dmg-${ev.id}`} dmg={ev} />
			))}
		</frame>
	);
}
