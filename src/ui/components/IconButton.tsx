import React, { useRef, useEffect } from "react";
import { setIcon } from "obsidian";

const IconButton = () => {
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (buttonRef.current) {
			// Set the icon on the button itself
			setIcon(buttonRef.current, "check-circle"); // change to your desired icon
		}
	}, []);

	return <button className="KTR-min-button" ref={buttonRef} />;
};

export default IconButton;
