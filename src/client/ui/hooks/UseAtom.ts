import { useEffect, useState } from "@rbxts/react";
import { subscribe } from "@rbxts/charm";

export function useAtom<T>(source: () => T): T {
	const [value, setValue] = useState(() => source());

	useEffect(() => {
		setValue(source());
		return subscribe(source, (current) => {
			setValue(current);
		});
	}, [source]);

	return value;
}
