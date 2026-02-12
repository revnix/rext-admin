
import { z } from "zod";
import { checkPasswordBreach } from "./lib/password-utils";

// Mocking the password schema from auth-schemas.ts to avoid importing the whole file and its dependencies
const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less");

async function testPasswordValidation() {
    console.log("--- Testing Password Validation Schema ---");

    const testCases = [
        { password: "short", expected: false, desc: "Too short (<8 chars)" },
        {
            password: "correct horse battery staple",
            expected: true,
            desc: "Passphrase (spaces, no numbers/caps)",
        },
        {
            password: "Password1!",
            expected: true,
            desc: "Traditional complex password",
        },
        {
            password: "a".repeat(129),
            expected: false,
            desc: "Too long (>128 chars)",
        },
        { password: "onlylowercase", expected: true, desc: "Only lowercase" },
        { password: "ONLYUPPERCASE", expected: true, desc: "Only uppercase" },
        { password: "12345678", expected: true, desc: "Only numbers" },
    ];

    for (const test of testCases) {
        const result = passwordSchema.safeParse(test.password);
        const passed = result.success === test.expected;
        console.log(
            `${passed ? "✅" : "❌"} ${test.desc}: ${result.success ? "Valid" : "Invalid"} (Expected: ${test.expected ? "Valid" : "Invalid"})`,
        );
        if (!passed) {
            console.error("   Error:", result.error);
        }
    }
}

async function testBreachCheck() {
    console.log("\n--- Testing Breach Check (HIBP API) ---");

    const testCases = [
        {
            password: "password",
            expectedBreached: true,
            desc: "Common password 'password'",
        },
        {
            password: "correcthorsebatterystaple",
            expectedBreached: true,
            desc: "Known XKCD password",
        },
        {
            password: "ThisIsAVeryUniquePasswordThatShouldNotBeBreached123456!",
            expectedBreached: false,
            desc: "Unique strong password",
        },
    ];

    for (const test of testCases) {
        try {
            console.log(`Checking: "${test.password}"...`);
            const result = await checkPasswordBreach(test.password);
            const passed = result.breached === test.expectedBreached;
            console.log(
                `${passed ? "✅" : "❌"} ${test.desc}: ${result.breached ? "Breached" : "Safe"} (Count: ${result.count})`,
            );
        } catch (error) {
            console.error(`❌ Error checking ${test.desc}:`, error);
        }
    }
}

async function run() {
    await testPasswordValidation();
    await testBreachCheck();
}

run();
