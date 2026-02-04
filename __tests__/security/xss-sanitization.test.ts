import { InputSanitizer } from "@/lib/sanitization";

describe("XSS Sanitization", () => {
	const xssPayloads = [
		'<script>alert("XSS")</script>',
		"<img src=x onerror=alert(1)>",
		"javascript:alert(1)",
		'<iframe src="evil.com"></iframe>',
		'onclick="alert(1)"',
		"<object data='evil.com'></object>",
		"<embed src='evil.com'>",
		"vbscript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"<svg onload=alert(1)>",
	];

	test("should detect XSS in all payloads", () => {
		for (const payload of xssPayloads) {
			expect(InputSanitizer.containsXSS(payload)).toBe(true);
		}
	});

	test("should sanitize XSS from text", () => {
		for (const payload of xssPayloads) {
			const sanitized = InputSanitizer.sanitizeText(payload);
			// Verify dangerous content is removed
			expect(sanitized).not.toContain("<script");
			expect(sanitized).not.toContain("javascript:");
			expect(sanitized).not.toContain("onerror=");
			expect(sanitized).not.toContain("onclick=");
		}
	});

	test("should sanitize XSS from HTML", () => {
		for (const payload of xssPayloads) {
			const sanitized = InputSanitizer.sanitizeHtml(payload);
			// Verify dangerous tags are removed (attributes may remain in non-dangerous tags)
			expect(sanitized).not.toContain("<script");
			expect(sanitized).not.toContain("<iframe");
			expect(sanitized).not.toContain("javascript:");
		}
	});

	test("should allow safe text", () => {
		const safeInputs = [
			"John Doe",
			"john@example.com",
			"My Company Inc.",
			"Professional, Friendly, Helpful",
			"https://example.com",
			"This is a normal sentence.",
		];

		for (const input of safeInputs) {
			expect(InputSanitizer.containsXSS(input)).toBe(false);
			expect(InputSanitizer.sanitizeText(input)).toBe(input.trim());
		}
	});

	test("should validate email addresses correctly", () => {
		expect(InputSanitizer.validateEmail("test@example.com")).toBe(true);
		expect(InputSanitizer.validateEmail("user+tag@domain.co.uk")).toBe(true);
		expect(InputSanitizer.validateEmail("invalid")).toBe(false);
		expect(InputSanitizer.validateEmail("@example.com")).toBe(false);
		expect(InputSanitizer.validateEmail("test@")).toBe(false);
	});

	test("should validate URLs correctly", () => {
		expect(InputSanitizer.validateUrl("https://example.com")).toBe(true);
		expect(InputSanitizer.validateUrl("http://example.com")).toBe(true);
		expect(InputSanitizer.validateUrl("ftp://example.com")).toBe(false);
		expect(InputSanitizer.validateUrl("javascript:alert(1)")).toBe(false);
		expect(InputSanitizer.validateUrl("not-a-url")).toBe(false);
	});

	test("should sanitize filenames", () => {
		expect(InputSanitizer.sanitizeFilename("normal-file.txt")).toBe(
			"normal-file.txt",
		);
		expect(InputSanitizer.sanitizeFilename("../../etc/passwd")).toBe(
			"etcpasswd",
		);
		expect(InputSanitizer.sanitizeFilename('file<>:"/\\|?*.txt')).toBe(
			"file.txt",
		);
	});

	test("should limit text length", () => {
		const longText = "a".repeat(20000);
		const sanitized = InputSanitizer.sanitizeText(longText);
		expect(sanitized.length).toBeLessThanOrEqual(10000);
	});

	test("should sanitize logs", () => {
		const sensitiveData = {
			email: "user@example.com",
			password: "secret123",
			token: "abc123",
			apiKey: "xyz789",
		};

		const sanitized = InputSanitizer.sanitizeForLog(sensitiveData);
		expect(sanitized).toContain("[REDACTED]");
		expect(sanitized).not.toContain("secret123");
		expect(sanitized).not.toContain("abc123");
		expect(sanitized).not.toContain("xyz789");
	});
});
