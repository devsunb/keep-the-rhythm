import React, { createContext, useContext, useState, useEffect } from "react";
import { editorStore, EditorStore } from "../store/editorStore";

// Create context with the same shape as the store
const EditorContext = createContext<EditorStore | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
	const [, forceUpdate] = useState({});

	useEffect(() => {
		// Subscribe to store updates
		const unsubscribe = editorStore.subscribe(() => {
			forceUpdate({}); // Force re-render when store changes
		});

		return unsubscribe; // Clean up subscription
	}, []);

	return (
		<EditorContext.Provider value={editorStore}>
			{children}
		</EditorContext.Provider>
	);
}

// Custom hook to use the store within React components
export function useEditorStore() {
	const context = useContext(EditorContext);
	if (context === undefined) {
		throw new Error("useEditorStore must be used within an EditorProvider");
	}
	return context;
}
