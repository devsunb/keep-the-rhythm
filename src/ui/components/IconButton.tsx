import React, { useRef, useEffect } from "react";
import { setIcon } from "obsidian";

const IconButton = () => {
	const buttonRef = useRef<HTMLButtonElement>(null);

	if (buttonRef.current) {
		setIcon(buttonRef.current, "check-circle");
	}

	return <button className="KTR-min-button" ref={buttonRef} />;
};

export default IconButton;
