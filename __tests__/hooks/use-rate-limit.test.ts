import { act, renderHook } from "@testing-library/react";
import { useRateLimit } from "@/hooks/use-rate-limit";

describe("useRateLimit", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test("should allow attempts within limit", () => {
		const { result } = renderHook(() =>
			useRateLimit({ maxAttempts: 3, windowMs: 1000 }),
		);

		act(() => {
			expect(result.current.checkRateLimit()).toBe(true);
			expect(result.current.checkRateLimit()).toBe(true);
			expect(result.current.checkRateLimit()).toBe(true);
		});

		expect(result.current.isLimited).toBe(false);
	});

	test("should block attempts over limit", () => {
		const { result } = renderHook(() =>
			useRateLimit({ maxAttempts: 2, windowMs: 1000 }),
		);

		act(() => {
			result.current.checkRateLimit();
			result.current.checkRateLimit();
			expect(result.current.checkRateLimit()).toBe(false);
		});

		expect(result.current.isLimited).toBe(true);
		expect(result.current.remainingTime).toBeGreaterThan(0);
	});

	test("should reset after time window expires", () => {
		const { result } = renderHook(() =>
			useRateLimit({ maxAttempts: 2, windowMs: 1000 }),
		);

		act(() => {
			result.current.checkRateLimit();
			result.current.checkRateLimit();
			expect(result.current.checkRateLimit()).toBe(false);
		});

		expect(result.current.isLimited).toBe(true);

		// Fast-forward time past the window
		act(() => {
			jest.advanceTimersByTime(1100);
		});

		act(() => {
			expect(result.current.checkRateLimit()).toBe(true);
		});

		expect(result.current.isLimited).toBe(false);
	});

	test("should manually reset rate limit", () => {
		const { result } = renderHook(() =>
			useRateLimit({ maxAttempts: 2, windowMs: 1000 }),
		);

		act(() => {
			result.current.checkRateLimit();
			result.current.checkRateLimit();
			expect(result.current.checkRateLimit()).toBe(false);
		});

		expect(result.current.isLimited).toBe(true);

		act(() => {
			result.current.reset();
		});

		expect(result.current.isLimited).toBe(false);
		expect(result.current.remainingTime).toBe(0);

		act(() => {
			expect(result.current.checkRateLimit()).toBe(true);
		});
	});

	test("should calculate remaining time correctly", () => {
		const { result } = renderHook(() =>
			useRateLimit({ maxAttempts: 1, windowMs: 5000 }),
		);

		act(() => {
			result.current.checkRateLimit();
			expect(result.current.checkRateLimit()).toBe(false);
		});

		expect(result.current.isLimited).toBe(true);
		expect(result.current.remainingTime).toBeGreaterThan(0);
		expect(result.current.remainingTime).toBeLessThanOrEqual(5);
	});

	test("should handle different window sizes", () => {
		const { result: result1 } = renderHook(() =>
			useRateLimit({ maxAttempts: 5, windowMs: 60000 }),
		);
		const { result: result2 } = renderHook(() =>
			useRateLimit({ maxAttempts: 10, windowMs: 120000 }),
		);

		act(() => {
			// Fill up first limiter
			for (let i = 0; i < 5; i++) {
				result1.current.checkRateLimit();
			}
			expect(result1.current.checkRateLimit()).toBe(false);

			// Second limiter should still allow more
			for (let i = 0; i < 10; i++) {
				result2.current.checkRateLimit();
			}
			expect(result2.current.checkRateLimit()).toBe(false);
		});

		expect(result1.current.isLimited).toBe(true);
		expect(result2.current.isLimited).toBe(true);
	});

	test("should clean up old attempts from window", () => {
		const { result } = renderHook(() =>
			useRateLimit({ maxAttempts: 2, windowMs: 1000 }),
		);

		act(() => {
			result.current.checkRateLimit();
		});

		// Fast-forward past first attempt's window
		act(() => {
			jest.advanceTimersByTime(1100);
		});

		act(() => {
			// Should allow 2 more attempts since first one expired
			expect(result.current.checkRateLimit()).toBe(true);
			expect(result.current.checkRateLimit()).toBe(true);
		});

		expect(result.current.isLimited).toBe(false);
	});
});
