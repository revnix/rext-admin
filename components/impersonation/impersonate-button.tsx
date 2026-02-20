"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface ImpersonateButtonProps {
    userId: string;
    userName: string;
    userEmail: string;
}

/**
 * Impersonate Button Component
 *
 * Allows admins to impersonate another user. Uses the secure centralized token
 * flow through useAuthStore().setTokens() and React Query invalidation.
 */
export function ImpersonateButton({
    userId,
    userName,
    userEmail,
}: ImpersonateButtonProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { setTokens } = useAuthStore();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isPendingRoute, startTransition] = useTransition();

    const impersonateMutation = useMutation({
        mutationFn: () => apiClient.impersonation.start(userId),
        onSuccess: (data) => {
            // Update tokens through centralized auth store
            setTokens(data.access_token, data.refresh_token);

            // Invalidate all queries to refresh data with new user context
            queryClient.invalidateQueries();

            toast.success(`Now impersonating ${userName}`);
            setConfirmOpen(false);

            // Redirect to main dashboard
            startTransition(() => {
                router.push("/");
                // Refresh page to update UI with new user context
                router.refresh();
            });
        },
        onError: (error: Error) => {
            toast.error(`Failed to start impersonation: ${error.message}`);
        },
    });

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="gap-2"
            >
                <UserCog className="h-4 w-4" />
                Impersonate
            </Button>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Impersonate User</DialogTitle>
                        <DialogDescription>
                            You are about to impersonate this user. All actions will be
                            performed as them.
                        </DialogDescription>
                    </DialogHeader>

                    <Alert className="border-orange-500 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-sm text-orange-900">
                            <strong className="font-semibold">Warning:</strong> While
                            impersonating, you will have the same permissions as the user. All
                            actions will be logged in the audit trail.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2 py-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">User Name:</span>
                            <span className="font-medium">{userName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{userEmail}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">User ID:</span>
                            <span className="font-mono text-xs">{userId.slice(0, 8)}...</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                            disabled={impersonateMutation.isPending || isPendingRoute}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => impersonateMutation.mutate()}
                            disabled={impersonateMutation.isPending || isPendingRoute}
                        >
                            {impersonateMutation.isPending || isPendingRoute
                                ? "Starting..."
                                : "Start Impersonation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
