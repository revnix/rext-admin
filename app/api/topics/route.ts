import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/topics - Fetch all topics from backend
 *
 * This API route acts as a proxy to the backend service, handling authentication
 * server-side to keep the CONTENT_API_KEY secure.
 */
export async function GET(_request: NextRequest) {
  try {
    const contentApiKey = process.env.CONTENT_API_KEY;
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:2024";

    if (!contentApiKey) {
      console.error("CONTENT_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error", topics: [], total_count: 0 },
        { status: 500 },
      );
    }

    if (!backendUrl) {
      console.error("BACKEND_API_URL environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error", topics: [], total_count: 0 },
        { status: 500 },
      );
    }

    console.log(
      "Fetching topics from backend:",
      `${backendUrl}/api/topic/get-topics`,
    );

    const response = await fetch(`${backendUrl}/api/topic/get-topics`, {
      method: "GET",
      headers: {
        "content-api-key": contentApiKey,
        "X-Request-ID": `req_${Date.now()}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        "Backend API error:",
        response.status,
        response.statusText,
        errorText,
      );

      return NextResponse.json(
        {
          error: `Backend API error: ${response.status} ${response.statusText}`,
          topics: [],
          total_count: 0,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    console.log("Successfully fetched topics:", data.topics?.length || 0);

    return NextResponse.json({
      topics: data.topics || [],
      total_count: data.total_count || 0,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        topics: [],
        total_count: 0,
      },
      { status: 500 },
    );
  }
}
