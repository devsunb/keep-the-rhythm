// FloatingUI.tsx
import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "obsidian";

interface FloatingUIProps {
	app: App;
	onClose: () => void;
	initialPosition?: { top: number; left: number };
}

const FloatingUI: React.FC<FloatingUIProps> = ({
	app,
	onClose,
	initialPosition = { top: 50, left: window.innerWidth - 300 },
}) => {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = React.useState(false);
	const [position, setPosition] = React.useState(initialPosition);
	const dragStartPos = React.useRef({ x: 0, y: 0 });

	const handleMouseDown = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).closest(".close-button")) return;

		setIsDragging(true);
		dragStartPos.current = {
			x: e.clientX - position.left,
			y: e.clientY - position.top,
		};
	};

	const handleMouseMove = React.useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			setPosition({
				top: Math.max(0, e.clientY - dragStartPos.current.y),
				left: Math.max(0, e.clientX - dragStartPos.current.x),
			});
		},
		[isDragging],
	);

	const handleMouseUp = React.useCallback(() => {
		setIsDragging(false);
	}, []);

	React.useEffect(() => {
		if (isDragging) {
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		} else {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		}

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, handleMouseMove, handleMouseUp]);

	const handleAction = () => {
		console.log("Action performed in React component");
		// Add your custom action here
	};

	return (
		<div
			ref={containerRef}
			className="floating-ui-container"
			style={{
				position: "absolute",
				top: `${position.top}px`,
				left: `${position.left}px`,
				zIndex: 25,
				color: "var(--text-normal)",
				borderRadius: "8px",
				boxShadow: "0 2px 8px var(--background-modifier-box-shadow)",
				width: "280px",
				padding: "12px",
				cursor: isDragging ? "grabbing" : "auto",
			}}
		>
			<div
				className="floating-ui-header"
				onMouseDown={handleMouseDown}
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					borderBottom: "1px solid var(--background-modifier-border)",
					paddingBottom: "8px",
					marginBottom: "8px",
					cursor: "grab",
				}}
			>
				<h4 style={{ margin: 0 }}>Widget</h4>✕
			</div>
			<div className="floating-ui-content">
				Lorem ipsum dolor sit amet consectetur adipisicing elit.
				Blanditiis, explicabo.
			</div>
		</div>
	);
};

export class FloatingUIManager {
	private root: any;
	private container: HTMLElement;
	private app: App;
	private visible: boolean = false;

	constructor(app: App) {
		this.app = app;
		this.container = document.createElement("div");
		this.container.id = "floating-ui-root";
		document.body.appendChild(this.container);
		this.root = createRoot(this.container);
		this.render();
	}

	private render() {
		if (!this.visible) {
			this.root.render(null);
			return;
		}

		this.root.render(
			<FloatingUI app={this.app} onClose={() => this.hide()} />,
		);
	}

	public show() {
		this.visible = true;
		this.render();
	}

	public hide() {
		this.visible = false;
		this.render();
	}

	public toggle() {
		this.visible = !this.visible;
		this.render();
	}

	public cleanup() {
		if (this.container) {
			this.root.unmount();
			this.container.remove();
		}
	}
}
