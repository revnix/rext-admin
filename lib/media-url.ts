import { getBackendBaseUrl } from "@/lib/backend-url";

export function toAbsoluteMediaUrl(url: string | null): string | null {
    if (!url) return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    const baseUrl = getBackendBaseUrl();
    if (!baseUrl) {
        return null;
    }

    try {
        return new URL(url, `${baseUrl}/`).toString();
    } catch {
        return null;
    }
}
