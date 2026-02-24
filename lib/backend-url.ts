export function getBackendBaseUrl(): string | null {
    const value =
        process.env.NEXT_PUBLIC_BACKEND_API_URL ??
        process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!value || value.trim().length === 0) {
        return null;
    }

    return value.replace(/\/+$/, "");
}
