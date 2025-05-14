export default {};

// import { createContext, useContext, useState, useEffect } from "react";

// import { state, PluginState } from "../core/pluginState";
// import { DailyActivity } from "@/db/db";

// const StateContext = createContext<PluginState | undefined>(undefined);

// export function usePluginState() {
// 	const context = useContext(StateContext);
// 	if (context === undefined) {
// 		throw new Error("useEditorStore must be used within an EditorProvider");
// 	}
// 	return context;
// }

// export function usePluginState2() {
// 	const [pluginState, setPluginState] = useState({
// 		activity: state.currentActivity,
// 		today: state.today,
// 		number: state.number,
// 		app: state.app,
// 	});

// 	useEffect(() => {
// 		const unsubscribe = state.subscribe(() => {
// 			setPluginState({
// 				activity: state.currentActivity,
// 				today: state.today,
// 				number: state.number,
// 				app: state.app,
// 			});
// 		});

// 		return unsubscribe;
// 	}, []);

// 	return pluginState;
// }
