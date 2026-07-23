"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { profileQueries } from "@/lib/query-keys";
import { PROFILE_TIMEZONE_OPTIONS } from "@/lib/constants/localization";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  type ProfileFormData,
  validateAvatarFile,
} from "@/schemas/profile-schemas";
import { getAvatarErrorMessage } from "@/lib/error-messages/api-user-messages";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { logger } from "@/lib/logger";

// Helper to convert relative avatar URLs to absolute URLs
const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;

  const baseUrl = resolveApiBaseUrl();

  return `${baseUrl}${avatarUrl}`;
};

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileEdit() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const log = logger.forComponent("ProfileEdit");

  // Fetch profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    ...profileQueries.detail(),
    throwOnError: true,
  });

  // Initialize form with default values to prevent uncontrolled component warnings
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      display_name: "",
      bio: "",
      language: "",
      timezone: "",
    },
    values: profile
      ? {
          full_name: profile.full_name || "",
          display_name: profile.display_name || "",
          bio: profile.bio || "",
          language: profile.language || "en",
          timezone: profile.timezone || "UTC",
        }
      : undefined,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      apiClient.profile.update({
        full_name: data.full_name,
        display_name: data.display_name,
        bio: data.bio,
        language: data.language,
        timezone: data.timezone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: FormData) => apiClient.profile.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
      toast.success("Avatar uploaded successfully");
      setAvatarPreview(null);
      setAvatarFile(null);
    },
    onError: (error: unknown) => {
      log.error("ProfileEdit avatar upload failed", error);
      toast.error(getAvatarErrorMessage(error, "upload"));
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: () => apiClient.profile.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: profileQueries.detail().queryKey,
      });
      toast.success("Avatar removed successfully");
      setAvatarPreview(null);
      setAvatarFile(null);
    },
    onError: (error: unknown) => {
      log.error("ProfileEdit avatar delete failed", error);
      toast.error(getAvatarErrorMessage(error, "delete"));
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load profile. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const currentAvatar = avatarPreview || getAvatarUrl(profile?.avatar_url);

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Upload a profile picture to personalize your account
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Avatar Display */}
          <div className="relative h-24 w-24 shrink-0 rounded-full overflow-hidden bg-muted mx-auto sm:mx-0">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                {profile?.full_name?.[0]}
              </div>
            )}
          </div>

          {/* Avatar Actions */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT_ATTRIBUTE}
              onChange={handleFileChange}
              className="hidden"
            />

            {avatarPreview ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleUploadAvatar}
                  disabled={uploadAvatarMutation.isPending}
                >
                  {uploadAvatarMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Save Avatar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelAvatarChange}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
                {profile?.avatar_url && (
                  <ConfirmationDialog
                    title="Remove Avatar"
                    description="Are you sure you want to remove your avatar?"
                    confirmText="Remove"
                    variant="destructive"
                    onConfirm={() => deleteAvatarMutation.mutate()}
                  >
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteAvatarMutation.isPending}
                    >
                      {deleteAvatarMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  </ConfirmationDialog>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Johnny" {...field} />
                </FormControl>
                <FormDescription>
                  This is how your name will be displayed across the app
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief description for your profile (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-1">
            {/* <FormField
              control={form.control}
              name="language"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select
                      key={`language-${field.value}`}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROFILE_LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            /> */}

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select
                      key={`timezone-${field.value}`}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROFILE_TIMEZONE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
