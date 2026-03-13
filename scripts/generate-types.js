#!/usr/bin/env node
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// biome-ignore lint/suspicious/noConsole: CLI script requires console output
console.log("🔄 Generating TypeScript types from backend OpenAPI schema...");

const backendUrl = process.env.BACKEND_URL || "http://localhost:2024";
const openapiPath = path.join(__dirname, "../openapi.json");
const typesOutputPath = path.join(__dirname, "../types/generated");

try {
  // Option 1: Fetch from running backend
  // biome-ignore lint/suspicious/noConsole: CLI script requires console output
  console.log(`📡 Fetching OpenAPI schema from ${backendUrl}/openapi.json...`);
  execSync(`curl -s ${backendUrl}/openapi.json > ${openapiPath}`, {
    stdio: "inherit",
  });

  // Verify file was created
  if (!fs.existsSync(openapiPath)) {
    throw new Error("Failed to fetch OpenAPI schema");
  }

  // biome-ignore lint/suspicious/noConsole: CLI script requires console output
  console.log("🔄 Generating TypeScript types...");
  execSync(`npx @hey-api/openapi-ts -i ${openapiPath} -o ${typesOutputPath}`, {
    stdio: "inherit",
  });

  // biome-ignore lint/suspicious/noConsole: CLI script requires console output
  console.log("✅ Types generated successfully!");
  // biome-ignore lint/suspicious/noConsole: CLI script requires console output
  console.log(`📁 Output: ${typesOutputPath}`);
} catch (error) {
  // biome-ignore lint/suspicious/noConsole: CLI script requires console output
  console.error("❌ Error generating types:", error.message);
  // biome-ignore lint/suspicious/noConsole: CLI script requires console output
  console.error("\n💡 Make sure the backend is running at", backendUrl);
  process.exit(1);
}
