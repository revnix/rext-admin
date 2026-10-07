"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useSavedStatus } from "@/components/forms/use-saved-status";
import { useZodForm } from "@/components/forms/use-zod-form";
import { SettingsGroup } from "@/components/settings/settings-group";
import { TimezoneSelect } from "@/components/settings/timezone-select";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { getAvatarErrorMessage } from "@/lib/error-messages/api-user-messages";
import { logger } from "@/lib/logger";
import { profileQueries } from "@/lib/query-keys";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  type ProfileFormData,
  profileSchema,
  validateAvatarFile,
} from "@/schemas/profile-schemas";
import type { UserProfile } from "@/types/profile";
import { initials } from "@/lib/initials";

// Helper to convert relative avatar URLs to absolute URLs
const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  const baseUrl = resolveApiBaseUrl();
  return `${baseUrl}${avatarUrl}`;
};

function toFormValues(profile?: UserProfile): ProfileFormData {
  return {
    full_name: profile?.full_name ?? "",
    display_name: profile?.display_name ?? "",
    bio: profile?.bio ?? "",
    timezone: profile?.timezone || "UTC",
  };
}

/** The time it is now in a timezone, for the field's help text ("14:05"). */
function timeIn(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date());
  } catch {
    return null;
  }
}

/**
 * Account settings, Profile: the photo (saved on its own), then the name, display name, email, bio
 * and timezone on the field set. The timezone is the one scheduled publishing reads; the language
 * isn't asked, since nothing reads it.
 */
export function ProfileEdit() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const log = logger.forComponent("ProfileEdit");

  const { data: profile, isLoading, error } = useQuery(profileQueries.detail());

  const form = useZodForm(profileSchema, { defaultValues: toFormValues() });
  const { status, markSaved } = useSavedStatus(form.formState.isDirty);

  // Follow the profile as it loads and refetches, keeping what the person is typing.
  useEffect(() => {
    if (profile) form.reset(toFormValues(profile), { keepDirtyValues: true });
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await apiClient.profile.update({
        full_name: data.full_name,
        // An emptied display name is cleared, not left as it was.
        display_name: data.display_name,
        bio: data.bio,
        timezone: data.timezone,
      });
      markSaved();
      form.reset(data);
      await queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
    } catch (saveError) {
      form.setError("root.server", {
        message:
          saveError instanceof Error
            ? saveError.message
            : "Your profile couldn't be saved. Try again.",
      });
    }
  };

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: FormData) => apiClient.profile.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
      toast.success("Your photo was saved");
      setAvatarPreview(null);
      setAvatarFile(null);
    },
    onError: (uploadError: unknown) => {
      log.error("ProfileEdit avatar upload failed", uploadError);
      toast.error(getAvatarErrorMessage(uploadError, "upload"));
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: () => apiClient.profile.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
      toast.success("Your photo was removed");
      setAvatarPreview(null);
      setAvatarFile(null);
    },
    onError: (deleteError: unknown) => {
      log.error("ProfileEdit avatar delete failed", deleteError);
      toast.error(getAvatarErrorMessage(deleteError, "delete"));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      apiClient.profile.resendVerification(profile?.email ?? ""),
    onSuccess: (data) => {
      toast.success(data.message || "The verification email is on its way");
    },
    onError: (resendError) => {
      toast.error(
        resendError.message || "The verification email couldn't be sent",
      );
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("file", avatarFile);
    uploadAvatarMutation.mutate(formData);
  };

  const handleCancelAvatarChange = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !profile) {
    return (
      <Notice tone="danger" title="Your profile didn't load">
        Refresh the page to try again.
      </Notice>
    );
  }

  const currentAvatar = avatarPreview || getAvatarUrl(profile.avatar_url);
  const serverError = form.formState.errors.root?.server?.message;
  const timezone = form.watch("timezone");
  const now = timezone ? timeIn(timezone) : null;

  return (
    <div className="flex flex-col gap-8">
      <SettingsGroup
        title="Photo"
        description="Shown beside your name to the people you work with. JPG, PNG or GIF, up to 5 MB."
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-surface-inset">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-section text-muted-foreground">
                {initials(profile.full_name)}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT_ATTRIBUTE}
            onChange={handleFileChange}
            className="hidden"
            aria-label="Choose a photo"
          />

          {avatarPreview ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleUploadAvatar}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Upload aria-hidden />
                )}
                Save photo
              </Button>
              <Button variant="ghost" onClick={handleCancelAvatarChange}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload aria-hidden />
                Choose a photo
              </Button>
              {profile.avatar_url && (
                <ConfirmationDialog
                  title="Remove your photo?"
                  description="Your initial is shown in its place."
                  confirmText="Remove photo"
                  variant="destructive"
                  onConfirm={() => deleteAvatarMutation.mutate()}
                >
                  <Button
                    variant="ghost"
                    disabled={deleteAvatarMutation.isPending}
                  >
                    {deleteAvatarMutation.isPending ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <X aria-hidden />
                    )}
                    Remove
                  </Button>
                </ConfirmationDialog>
              )}
            </div>
          )}
        </div>
      </SettingsGroup>

      <FormShell
        form={form}
        onSubmit={onSubmit}
        submitLabel="Save profile"
        status={status}
      >
        {serverError && (
          <Notice tone="danger" title="Your profile wasn't saved">
            {serverError}
          </Notice>
        )}
        <FormSection title="Profile">
          <FieldController
            control={form.control}
            name="full_name"
            label="Full name"
            required
          >
            {(field) => <Input {...field} autoComplete="name" />}
          </FieldController>
          <FieldController
            control={form.control}
            name="display_name"
            label="Display name"
            description="What the app calls you, if not your full name."
          >
            {(field) => <Input {...field} autoComplete="nickname" />}
          </FieldController>
          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <Input id="profile-email" value={profile.email} readOnly disabled />
            <FieldDescription>
              {profile.email_verified ? (
                "Verified. It's the address you sign in with."
              ) : (
                <>
                  Not verified yet.{" "}
                  <button
                    type="button"
                    className="font-medium text-foreground underline underline-offset-4 disabled:opacity-50"
                    onClick={() => resendMutation.mutate()}
                    disabled={resendMutation.isPending}
                  >
                    Send the verification email again
                  </button>
                </>
              )}
            </FieldDescription>
          </Field>
          <FieldController
            control={form.control}
            name="bio"
            label="Bio"
            maxLength={500}
          >
            {(field) => <Textarea {...field} rows={3} />}
          </FieldController>
          <FieldController
            control={form.control}
            name="timezone"
            label="Timezone"
            description={
              now
                ? `Scheduled articles publish in this timezone. It's ${now} there now.`
                : "Scheduled articles publish in this timezone."
            }
          >
            {(field) => <TimezoneSelect {...field} />}
          </FieldController>
        </FormSection>
      </FormShell>
    </div>
  );
}
