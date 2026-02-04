"use client";

import { useRef, useState } from "react";

interface RateLimitConfig {
	maxAttempts: number;
	windowMs: number;
}

/**
 * Frontend rate limiting hook
 *
 * Prevents spam submissions by limiting attempts per time window.
 * This is a CLIENT-SIDE protection only - backend must also enforce rate limits.
 */
export function useRateLimit(config: RateLimitConfig) {
	const [isLimited, setIsLimited] = useState(false);
	const [remainingTime, setRemainingTime] = useState(0);
	const attemptsRef = useRef<number[]>([]);

	const checkRateLimit = (): boolean => {
		const now = Date.now();
		const windowStart = now - config.windowMs;

		// Remove attempts outside the window
		attemptsRef.current = attemptsRef.current.filter(
			(timestamp) => timestamp > windowStart,
		);

		// Check if limit exceeded
		if (attemptsRef.current.length >= config.maxAttempts) {
			const oldestAttempt = attemptsRef.current[0];
			const resetTime = oldestAttempt + config.windowMs;
			const remaining = Math.ceil((resetTime - now) / 1000);

			setIsLimited(true);
			setRemainingTime(remaining);

			// Auto-reset after window expires
			setTimeout(() => {
				setIsLimited(false);
				setRemainingTime(0);
			}, remaining * 1000);

			return false;
		}

		// Record this attempt
		attemptsRef.current.push(now);
		return true;
	};

	const reset = () => {
		attemptsRef.current = [];
		setIsLimited(false);
		setRemainingTime(0);
	};

	return { checkRateLimit, isLimited, remainingTime, reset };
}
