"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/api-client/users";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
}: EditUserDialogProps) {
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user && open) {
      setFullName(user.full_name || "");
      setDisplayName(user.display_name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatar_url || "");
      setLanguage(user.language || "en");
      setTimezone(user.timezone || "UTC");
      setPassword("");
    }
  }, [user, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const payload: Record<string, string | null> = {};

      if (fullName.trim() !== (user.full_name || "")) {
        payload.full_name = fullName.trim();
      }
      if (displayName.trim() !== (user.display_name || "")) {
        payload.display_name = displayName.trim();
      }
      if (email.trim() !== (user.email || "")) {
        payload.email = email.trim();
      }
      if (avatarUrl.trim() !== (user.avatar_url || "")) {
        payload.avatar_url = avatarUrl.trim() || null;
      }
      if (language.trim() !== (user.language || "en")) {
        payload.language = language.trim();
      }
      if (timezone.trim() !== (user.timezone || "UTC")) {
        payload.timezone = timezone.trim();
      }
      if (password.trim().length > 0) {
        payload.password = password.trim();
      }

      return apiClient.users.updateUser(user.id, payload);
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="h-5 w-5 text-primary" />
            Edit User Details
          </DialogTitle>
          <DialogDescription>
            Update profile details, email, locale, or password for{" "}
            <span className="font-semibold text-foreground">
              {user?.display_name || user?.full_name || user?.email}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Full Name</Label>
              <Input
                id="edit-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display-name">Display Name</Label>
              <Input
                id="edit-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="johndoe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-avatar-url">Avatar URL</Label>
            <Input
              id="edit-avatar-url"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-language">Language</Label>
              <Input
                id="edit-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-timezone">Timezone</Label>
              <Input
                id="edit-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="edit-password">
              New Password{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (leave blank to keep unchanged)
              </span>
            </Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
