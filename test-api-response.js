/**
 * API Response Format Tester
 * Run this to check the actual API response format
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:2024";

async function testProfileEndpoint() {
  console.log("\n=== Testing Profile Endpoint ===");
  console.log(`API URL: ${API_BASE_URL}/api/v1/user/profile\n`);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add your auth token here if needed
        // "Authorization": "Bearer YOUR_TOKEN_HERE",
      },
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("\n❌ Error Response:");
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log("\n✅ Success Response:");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n=== Response Structure Analysis ===");
    console.log(`Has "status" field: ${data && "status" in data}`);
    console.log(`Has "success" field: ${data && "success" in data}`);
    console.log(`Has "data" field: ${data && "data" in data}`);
    console.log(`Top-level keys: ${data ? Object.keys(data).join(", ") : "none"}`);

    if (data && data.data) {
      console.log(`\nData field keys: ${Object.keys(data.data).join(", ")}`);
      console.log(`Data field type: ${typeof data.data}`);

      if (typeof data.data === "object") {
        const dataKeys = Object.keys(data.data);
        if (dataKeys.length === 1) {
          console.log(`\n⚠️  Data contains single nested key: "${dataKeys[0]}"`);
          console.log(`Nested object keys: ${Object.keys(data.data[dataKeys[0]]).join(", ")}`);
        }
      }
    }

    console.log("\n=== Unwrapping Logic Test ===");
    let finalResult;

    // Test the unwrapping logic
    if (data && "status" in data && data.status === "success") {
      if ("data" in data && data.data) {
        const dataKeys = Object.keys(data.data);
        if (
          dataKeys.length === 1 &&
          typeof data.data[dataKeys[0]] === "object" &&
          data.data[dataKeys[0]] !== null
        ) {
          finalResult = data.data[dataKeys[0]];
          console.log(`✅ Would unwrap to: data.${dataKeys[0]}`);
        } else {
          finalResult = data.data;
          console.log(`✅ Would return data as-is`);
        }
      }
    } else if (data && "success" in data && data.success && "data" in data) {
      finalResult = data.data;
      console.log(`✅ Would use success format`);
    } else {
      finalResult = data;
      console.log(`✅ Would use legacy/direct format`);
    }

    console.log("\n=== Final Result ===");
    console.log(JSON.stringify(finalResult, null, 2));

    console.log("\n=== Field Validation ===");
    const requiredFields = ["id", "email", "first_name", "last_name", "display_name"];
    requiredFields.forEach(field => {
      const exists = finalResult && field in finalResult;
      console.log(`${exists ? "✅" : "❌"} ${field}: ${exists ? finalResult[field] : "MISSING"}`);
    });

  } catch (error) {
    console.error("\n❌ Request Failed:");
    console.error(error);
  }
}

// Run the test
testProfileEndpoint();
