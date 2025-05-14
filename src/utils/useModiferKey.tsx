import React, { createContext, useContext, useState, useEffect } from "react";

type KeyContextType = {
	isAltPressed: boolean;
	isCtrlPressed: boolean;
};

const KeyContext = createContext<KeyContextType>({
	isAltPressed: false,
	isCtrlPressed: false,
});

export function KeyProvider({ children }: { children: React.ReactNode }) {
	const [isAltPressed, setIsAltPressed] = useState(false);
	const [isCtrlPressed, setIsCtrlPressed] = useState(false);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Alt") {
				setIsAltPressed(true);
			} else if (e.key === "Control" || e.key === "Meta") {
				setIsCtrlPressed(true);
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			if (e.key === "Alt") {
				setIsAltPressed(false);
			} else if (e.key === "Control" || e.key === "Meta") {
				setIsCtrlPressed(false);
			}
		}

		function handleBlur() {
			setIsAltPressed(false);
			setIsCtrlPressed(false);
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("blur", handleBlur);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("blur", handleBlur);
		};
	}, []);

	return (
		<KeyContext.Provider value={{ isAltPressed, isCtrlPressed }}>
			{children}
		</KeyContext.Provider>
	);
}

export function useAltKey(): boolean {
	return useContext(KeyContext).isAltPressed;
}

export function useCtrlKey(): boolean {
	return useContext(KeyContext).isCtrlPressed;
}
