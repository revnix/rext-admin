"use client";

import { useEffect, useState } from "react";

interface HoneypotProps {
	onBotDetected?: () => void;
}

/**
 * Honeypot field to detect bots
 *
 * Invisible to humans, visible to bots. If filled, user is likely a bot.
 */
export function Honeypot({ onBotDetected }: HoneypotProps) {
	const [value, setValue] = useState("");

	useEffect(() => {
		if (value && onBotDetected) {
			onBotDetected();
		}
	}, [value, onBotDetected]);

	return (
		<input
			type="text"
			name="website"
			autoComplete="off"
			tabIndex={-1}
			value={value}
			onChange={(e) => setValue(e.target.value)}
			style={{
				position: "absolute",
				left: "-9999px",
				width: "1px",
				height: "1px",
				opacity: 0,
			}}
			aria-hidden="true"
		/>
	);
}

/**
 * Hook to validate honeypot wasn't filled
 */
export function useHoneypot() {
	const [isBot, setIsBot] = useState(false);

	const HoneypotField = () => (
		<Honeypot onBotDetected={() => setIsBot(true)} />
	);

	return { isBot, HoneypotField };
}
