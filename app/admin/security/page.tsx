"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageLayout } from "@/components/page-layout";
import { AdminGuard } from "@/components/permission/admin-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiClient, ApiError } from "@/lib/api-client";
import type { AllowlistEntry } from "@/lib/api-client/admin-account-allowlist";

const KEY = ["admin", "account-allowlist"];

export default function AccountAllowlistPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ip, setIp] = useState("");
  const [label, setLabel] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AllowlistEntry | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.accountAllowlist.list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const addMutation = useMutation({
    mutationFn: () =>
      apiClient.accountAllowlist.create({
        ip_address: ip.trim(),
        label: label.trim() || null,
      }),
    onSuccess: () => {
      toast.success("IP added to the allowlist");
      setIp("");
      setLabel("");
      setFieldError(null);
      invalidate();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.statusCode === 422) {
        const detail = Array.isArray(err.context)
          ? (err.context[0] as { message?: string })?.message
          : undefined;
        setFieldError(detail ?? err.message);
      } else if (err instanceof ApiError && err.statusCode === 409) {
        setFieldError("That address is already on the list.");
      } else {
        toast.error(`Couldn't add IP: ${(err as Error).message}`);
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.accountAllowlist.update(id, { is_active }),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(`Update failed: ${(err as Error).message}`),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiClient.accountAllowlist.remove(id),
    onSuccess: () => {
      toast.success("IP removed");
      setPendingDelete(null);
      invalidate();
    },
    onError: (err) => toast.error(`Delete failed: ${(err as Error).message}`),
  });

  const entries = data?.entries ?? [];
  const togglingId = toggleMutation.isPending
    ? toggleMutation.variables?.id
    : undefined;

  return (
    <AdminGuard>
      <PageLayout
        title="Account Creation Allowlist"
        description="Public egress IPs that may create multiple accounts past the per-device limit."
      >
        <Card>
          <CardHeader>
            <CardTitle>Add an IP</CardTitle>
            <CardDescription>
              Enter your organization&apos;s public internet-facing (egress) IP -
              the address this app sees when your staff connect, not an internal{" "}
              <code className="font-mono">192.168.x</code> /{" "}
              <code className="font-mono">10.x</code> address. Ask your network
              team if unsure. CIDR ranges like{" "}
              <code className="font-mono">198.51.100.0/28</code> are allowed, and
              you can add more than one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate();
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="grid gap-1">
                <label htmlFor="allowlist-ip" className="text-sm font-medium">
                  IP address or CIDR
                </label>
                <Input
                  id="allowlist-ip"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="198.51.100.24"
                  aria-invalid={!!fieldError}
                  className="w-64"
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="allowlist-label" className="text-sm font-medium">
                  Label (optional)
                </label>
                <Input
                  id="allowlist-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="HQ NAT gateway"
                  className="w-64"
                />
              </div>
              <Button
                type="submit"
                disabled={!ip.trim() || addMutation.isPending}
              >
                Add IP
              </Button>
            </form>
            {fieldError && (
              <p className="mt-2 text-sm text-destructive">{fieldError}</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Allowlisted IPs</CardTitle>
            <CardDescription>
              Disable an entry to revoke its bypass without losing the record of
              who added it. Changes take effect immediately, though a brand-new
              entry can occasionally take a minute to apply to live signups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`sk-${i.toString()}`} className="h-12 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No IPs allowlisted. The per-device cap applies to everyone.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP / CIDR</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={entry.is_active ? undefined : "opacity-60"}
                    >
                      <TableCell className="font-mono text-sm">
                        {entry.ip_address}
                      </TableCell>
                      <TableCell>{entry.label ?? "—"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={entry.is_active}
                          disabled={togglingId === entry.id}
                          onCheckedChange={(v) =>
                            toggleMutation.mutate({
                              id: entry.id,
                              is_active: v,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDelete(entry)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this IP?</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-mono">{pendingDelete?.ip_address}</span>{" "}
                will be permanently removed from the allowlist. The per-device
                cap will apply to registrations from this address again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  pendingDelete && removeMutation.mutate(pendingDelete.id)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayout>
    </AdminGuard>
  );
}
