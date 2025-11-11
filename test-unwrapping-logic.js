/**
 * Test Response Unwrapping Logic
 * This tests the exact logic used in core.ts
 */

// Mock profile data
const mockProfile = {
  id: "123",
  email: "user@example.com",
  username: "testuser",
  first_name: "John",
  last_name: "Doe",
  display_name: "John Doe",
  email_verified: true,
  status: "active",
  avatar_url: "/avatars/test.jpg",
  bio: "Test bio",
  language: "en",
  timezone: "UTC",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

// Test different response formats
const testCases = [
  {
    name: "API Spec Format (nested profile)",
    response: {
      status: "success",
      data: {
        profile: mockProfile,
      },
      message: "Profile retrieved successfully",
    },
    expectedResult: mockProfile,
  },
  {
    name: "API Spec Format (direct data)",
    response: {
      status: "success",
      data: mockProfile,
      message: "Profile retrieved successfully",
    },
    expectedResult: mockProfile,
  },
  {
    name: "Success Format (direct data)",
    response: {
      success: true,
      data: mockProfile,
    },
    expectedResult: mockProfile,
  },
  {
    name: "Success Format (nested with message) - YOUR BACKEND FORMAT",
    response: {
      success: true,
      meta: {
        request_id: "req_1762855053_31d5929e",
        timestamp: "2025-11-11T09:57:33.026786Z",
      },
      data: {
        message: "Profile retrieved successfully",
        profile: mockProfile,
      },
      error: null,
    },
    expectedResult: mockProfile,
  },
  {
    name: "Direct Format (legacy)",
    response: mockProfile,
    expectedResult: mockProfile,
  },
];

// Implement the exact unwrapping logic from core.ts
function unwrapResponse(result) {
  console.log("\n--- Testing Response ---");
  console.log("Input:", JSON.stringify(result, null, 2).substring(0, 200) + "...");

  // Handle API spec format: { status: "success", data: {...}, message: "..." }
  if (
    result &&
    typeof result === "object" &&
    "status" in result &&
    result.status === "success"
  ) {
    console.log("✓ Matched: API spec format (status: success)");
    if ("data" in result && result.data) {
      // If data contains a single nested object (e.g., { profile: {...} }),
      // unwrap it to the inner object
      const dataKeys = Object.keys(result.data);
      console.log(`  Data keys: [${dataKeys.join(", ")}]`);
      if (
        dataKeys.length === 1 &&
        typeof result.data[dataKeys[0]] === "object" &&
        result.data[dataKeys[0]] !== null
      ) {
        console.log(`  → Unwrapping nested key: "${dataKeys[0]}"`);
        return result.data[dataKeys[0]];
      }
      // Otherwise return data as-is
      console.log("  → Returning data as-is");
      return result.data;
    }
  }

  // Handle alternative format: { success: true, data: {...}, meta: {...} }
  if (result && typeof result === "object" && "success" in result) {
    console.log("✓ Matched: Success format");
    if (result.success === false && "error" in result) {
      throw new Error(result.error?.message || "Request failed");
    }

    if (result.success && "data" in result && result.data) {
      // If data contains a single nested object (e.g., { profile: {...} }),
      // unwrap it to the inner object (excluding 'message' key)
      const dataKeys = Object.keys(result.data).filter((key) => key !== "message");
      console.log(`  Data keys (excluding message): [${dataKeys.join(", ")}]`);

      if (
        dataKeys.length === 1 &&
        typeof result.data[dataKeys[0]] === "object" &&
        result.data[dataKeys[0]] !== null
      ) {
        console.log(`  → Unwrapping nested key: "${dataKeys[0]}"`);
        return result.data[dataKeys[0]];
      }

      console.log("  → Returning data as-is");
      return result.data;
    }
  }

  // Legacy format or direct data
  console.log("✓ Matched: Legacy/direct format");
  return result;
}

// Run all test cases
console.log("=".repeat(80));
console.log("RESPONSE UNWRAPPING LOGIC TEST");
console.log("=".repeat(80));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log("=".repeat(80));

  try {
    const result = unwrapResponse(testCase.response);

    // Validate result
    const hasRequiredFields =
      result &&
      "id" in result &&
      "email" in result &&
      "first_name" in result &&
      "last_name" in result;

    if (hasRequiredFields) {
      console.log("\n✅ PASS");
      console.log(`  Result has all required fields:`);
      console.log(`    - id: ${result.id}`);
      console.log(`    - email: ${result.email}`);
      console.log(`    - first_name: ${result.first_name}`);
      console.log(`    - last_name: ${result.last_name}`);
      passedTests++;
    } else {
      console.log("\n❌ FAIL");
      console.log(`  Result missing required fields`);
      console.log(`  Actual result:`, result);
      failedTests++;
    }
  } catch (error) {
    console.log("\n❌ FAIL");
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
});

console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passedTests} ✅`);
console.log(`Failed: ${failedTests} ❌`);
console.log("=".repeat(80));

if (failedTests > 0) {
  console.log("\n⚠️  UNWRAPPING LOGIC HAS ISSUES - NEEDS FIXING");
  process.exit(1);
} else {
  console.log("\n✅ ALL TESTS PASSED - UNWRAPPING LOGIC IS CORRECT");
  process.exit(0);
}
