// custom-elements.d.ts
import "@number-flow/react";

declare global {
	namespace JSX {
		interface IntrinsicElements {
			"number-flow": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value: number;
					format?: Intl.NumberFormatOptions;
					prefix?: string;
					suffix?: string;
				},
				HTMLElement
			>;
		}
	}
}
