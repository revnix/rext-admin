import { NextResponse } from "next/server";

export async function GET() {
  const providers = [
    "https://api.country.is",
    "https://ipwho.is/",
    "https://ipapi.co/json/",
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) continue;

      const data = await response.json();
      const countryCode = data.country_code || data.country || data.countryCode;

      if (countryCode) {
        return NextResponse.json({ countryCode: countryCode.toLowerCase() });
      }
    } catch (error) {
      console.warn(`[Proxy Fetch Country Provider Failed: ${url}]`, error);
    }
  }

  return NextResponse.json({ countryCode: "us" });
}
