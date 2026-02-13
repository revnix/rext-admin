type ParamValue = string | number | boolean | undefined | null | string[];

export function buildUrl(
    basePath: string,
    params: Record<string, ParamValue> = {},
): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(key, String(v)));
            } else {
                searchParams.set(key, String(value));
            }
        }
    }

    const queryString = searchParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildQueryString(
    params: Record<string, ParamValue>,
): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(key, String(v)));
            } else {
                searchParams.set(key, String(value));
            }
        }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}