// components/SharedTooltip.tsx
import React from "react";

interface SharedTooltipContextValue {
	show: (content: React.ReactNode, x: number, y: number) => void;
	hide: () => void;
}

const SharedTooltipContext =
	React.createContext<SharedTooltipContextValue | null>(null);

export const SharedTooltipProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [visible, setVisible] = React.useState(false);
	const [content, setContent] = React.useState<React.ReactNode>(null);
	const [position, setPosition] = React.useState({ x: 0, y: 0 });

	const show = (content: React.ReactNode, x: number, y: number) => {
		setContent(content);
		setPosition({ x, y });
		setVisible(true);
	};

	const hide = () => setVisible(false);

	return (
		<SharedTooltipContext.Provider value={{ show, hide }}>
			{children}
			{visible && (
				<div
					className="shared-tooltip"
					style={{
						top: position.y + 10,
						left: position.x + 10,
						position: "fixed",
						background: "rgba(0, 0, 0, 0.85)",
						color: "white",
						padding: "6px 10px",
						borderRadius: 4,
						fontSize: 12,
						pointerEvents: "none",
						transition: "opacity 0.15s ease",
						zIndex: 1000,
					}}
				>
					{content}
				</div>
			)}
		</SharedTooltipContext.Provider>
	);
};

export const useSharedTooltip = () => {
	const ctx = React.useContext(SharedTooltipContext);
	if (!ctx)
		throw new Error(
			"useSharedTooltip must be used within SharedTooltipProvider",
		);
	return ctx;
};
