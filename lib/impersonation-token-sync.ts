import { useAuthStore } from "@/stores/auth-store";

export interface ImpersonationTokenPair {
    accessToken: string;
    refreshToken: string;
}

export type SessionUpdateFn = (
    payload: { accessToken: string; refreshToken: string },
) => Promise<unknown>;

/**
 * Single source of truth for impersonation token writes.
 * Keeps tokens in-memory and optionally mirrors them into NextAuth session state.
 */
export async function syncImpersonationTokens(
    tokens: ImpersonationTokenPair,
    updateSession?: SessionUpdateFn,
): Promise<void> {
    const { setTokens } = useAuthStore.getState();
    setTokens(tokens.accessToken, tokens.refreshToken);

    if (updateSession) {
        await updateSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
}
