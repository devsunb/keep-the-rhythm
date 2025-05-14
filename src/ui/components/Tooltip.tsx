import * as RadixTooltip from "@radix-ui/react-tooltip";
import React from "react";

interface TooltipProps {
	content: React.ReactNode;
	children: React.ReactNode;
}

export const Tooltip = ({ content, children }: TooltipProps) => (
	<RadixTooltip.Root>
		<RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
		<RadixTooltip.Portal>
			<RadixTooltip.Content
				className="tooltip-content"
				side="bottom"
				sideOffset={2}
				collisionPadding={8}
			>
				{content}
				<RadixTooltip.Arrow className="tooltip-arrow" />
			</RadixTooltip.Content>
		</RadixTooltip.Portal>
	</RadixTooltip.Root>
);
