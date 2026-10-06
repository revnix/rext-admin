"use client";

import { Loader2, Upload } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { FormPage } from "@/components/layouts";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspacePermission } from "@/hooks/use-permission";
import {
  useCreatePersona,
  usePersonas,
  useUploadPersonaAvatar,
} from "@/hooks/use-personas";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { workspaceRoutes } from "@/lib/routes";
import {
  normalizePersonaName,
  PERSONA_LIMITS,
  splitList,
} from "@/lib/validation/persona-validation";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  EMPTY_PERSONA_FORM,
  type PersonaFormValues,
  personaFormSchema,
} from "@/schemas/persona-schemas";

/** JPEG/PNG/GIF/WebP up to 5MB, matching what the upload endpoint accepts. */
const AVATAR_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const trimmed = (value: string) => value.trim() || undefined;

export default function CreatePersonaPage() {
  const { workspace, workspaceSlug, workspaceId } = useWorkspace();
  const router = useRouter();
  const createPersona = useCreatePersona(workspace?.id || "");
  const uploadAvatar = useUploadPersonaAvatar(workspace?.id || "");
  const { data: personaList } = usePersonas(workspace?.id || null);
  const { isLoading: isPermLoading } = useWorkspacePermission(
    PERSONA_PERMISSIONS.CREATE,
    workspaceId,
  );

  const form = useZodForm(personaFormSchema, {
    defaultValues: EMPTY_PERSONA_FORM,
  });
  const { control } = form;

  /**
   * The button's `disabled` only takes effect on the next render, so a fast
   * double-click gets two handlers in before React repaints and two personas
   * are created. A ref flips synchronously, inside the same click, which is
   * the only thing that can turn the second click into a no-op. The backend
   * rejects the duplicate as well — this stops it ever being sent.
   */
  const submitting = useRef(false);

  /** A picture chosen before the persona exists. There is no row to attach it
   *  to yet, so it is held here and uploaded once the create call returns an
   *  id; `avatarPreview` is a local object URL purely for the preview. */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Cleared here so choosing the same file twice still fires a change.
    e.target.value = "";
    if (!file) return;
    if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
      toast.error("Choose a JPEG, PNG, GIF or WebP image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image is too large. The maximum is 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    // An uploaded file and a pasted link are the same slot; keeping both would
    // leave the persona showing one and storing the other.
    form.setValue("avatar_url", "", { shouldDirty: true });
    form.clearErrors("avatar_url");
  };

  const clearAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const onSubmit = async (values: PersonaFormValues) => {
    if (!workspace?.id || submitting.current) return;

    // Duplicate names are refused by the API; catching it here saves the round
    // trip and points at the field rather than showing a bare error toast.
    const typed = normalizePersonaName(values.name);
    const taken = (personaList?.personas ?? []).some(
      (p) => normalizePersonaName(p.name || "") === typed,
    );
    if (typed && taken) {
      form.setError(
        "name",
        {
          message: "A persona with this name already exists in this workspace",
        },
        { shouldFocus: true },
      );
      return;
    }

    submitting.current = true;
    try {
      // No cross-filling between `name` and `full_name`: they are separate
      // facts, and copying one into the other is what put the display name
      // under "Full Name" on the detail page.
      const result = await createPersona.mutateAsync({
        name: values.name.trim(),
        full_name: trimmed(values.full_name),
        description: trimmed(values.description) ?? "",
        professional_title: trimmed(values.professional_title),
        avatar_url: avatarFile ? undefined : trimmed(values.avatar_url),
        email: trimmed(values.email),
        bio: trimmed(values.bio),
        linkedin_url: trimmed(values.linkedin_url),
        demographics: trimmed(values.demographics),
        areas_of_expertise: splitList(values.areas_of_expertise),
        tone_of_voice: trimmed(values.tone_of_voice),
        goals: splitList(values.goals),
        pain_points: splitList(values.pain_points),
        behaviors: splitList(values.behaviors),
      });

      // The picture needs a persona to belong to, so it goes up once the row
      // exists. A failure here leaves a valid persona without its photo rather
      // than failing the whole create, so it is reported and not re-thrown.
      const newId = result?.persona?.id;
      if (avatarFile && newId) {
        try {
          await uploadAvatar.mutateAsync({
            personaId: newId,
            file: avatarFile,
          });
        } catch {
          toast.error("Persona created, but the photo could not be uploaded");
        }
      }

      router.push(workspaceRoutes.personas(workspaceSlug) as Route);
    } catch {
      // Error toast handled by mutation hook
      submitting.current = false;
    }
  };

  if (!workspace?.id || isPermLoading) {
    return (
      <FormPage title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </FormPage>
    );
  }

  const displayName = form.watch("name") || "New persona";
  const avatarUrl = form.watch("avatar_url");

  return (
    <FormPage
      title="New persona"
      description="An author persona your articles are written as, for their experience and trust signals."
    >
      <PermissionGuard
        permission={PERSONA_PERMISSIONS.CREATE}
        showLoading={false}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <h3 className="text-destructive font-semibold text-lg">
                Access Denied
              </h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to create personas in this workspace.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Required permission:{" "}
                <code className="text-xs bg-muted px-1 rounded-md">
                  persona.create
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <FormShell
          form={form}
          onSubmit={onSubmit}
          onInvalid={() => toast.error("Please fix the highlighted fields")}
          submitLabel="Create persona"
          cancel={{ onCancel: () => router.back() }}
          sticky
        >
          <FormSection title="Profile">
            <FieldController
              control={control}
              name="name"
              label="Display name"
              required
              maxLength={PERSONA_LIMITS.name.max}
              description={`Letters, spaces, apostrophes, hyphens and periods; no numbers. At least ${PERSONA_LIMITS.name.min} characters.`}
            >
              {(field) => (
                <Input
                  {...field}
                  maxLength={PERSONA_LIMITS.name.max}
                  placeholder="e.g. Marketing Manager Mary"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="full_name"
              label="Full name (optional)"
              maxLength={PERSONA_LIMITS.full_name.max}
            >
              {(field) => (
                <Input
                  {...field}
                  maxLength={PERSONA_LIMITS.full_name.max}
                  placeholder="e.g. Mary Jane"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="professional_title"
              label="Professional title (optional)"
              maxLength={PERSONA_LIMITS.professional_title.max}
            >
              {(field) => (
                <Input
                  {...field}
                  maxLength={PERSONA_LIMITS.professional_title.max}
                  placeholder="e.g. Senior Marketing Manager"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="description"
              label="Short description (optional)"
              maxLength={PERSONA_LIMITS.description.max}
            >
              {(field) => (
                <Textarea
                  {...field}
                  maxLength={PERSONA_LIMITS.description.max}
                  placeholder="Who this persona is, in a sentence"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="bio"
              label="Bio (optional)"
              maxLength={PERSONA_LIMITS.bio.max}
            >
              {(field) => (
                <Textarea
                  {...field}
                  maxLength={PERSONA_LIMITS.bio.max}
                  placeholder="A short biography"
                />
              )}
            </FieldController>
          </FormSection>

          <FormSection
            title="Photo and links"
            description="A photo from your device or a link to one, never both. Without either, a Gravatar for the email is used if there is one."
          >
            <Field>
              <FieldLabel htmlFor="persona-photo">Photo (optional)</FieldLabel>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 rounded-md border">
                  <AvatarImage
                    src={avatarPreview || avatarUrl || ""}
                    alt=""
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-md text-xl font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="persona-photo"
                    type="file"
                    accept={AVATAR_ACCEPT}
                    className="sr-only"
                    onChange={handleAvatarFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload />
                    {avatarFile ? "Choose another" : "Upload from device"}
                  </Button>
                  {avatarFile && (
                    <>
                      <span className="max-w-40 truncate text-xs text-muted-foreground">
                        {avatarFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAvatarFile}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <FieldDescription>
                JPEG, PNG, GIF or WebP, up to 5MB. Uploaded once the persona is
                created.
              </FieldDescription>
            </Field>
            <FieldController
              control={control}
              name="avatar_url"
              label="Photo link (optional)"
              description={
                avatarFile
                  ? "Ignored while a file is chosen."
                  : "A link to a photo, e.g. https://example.com/photo.jpg."
              }
            >
              {(field) => (
                <Input
                  {...field}
                  type="url"
                  maxLength={PERSONA_LIMITS.avatar_url.max}
                  disabled={Boolean(avatarFile)}
                  placeholder="https://example.com/image.jpg"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="email"
              label="Email (optional)"
              description="Used only to look up a Gravatar. Never shown or used to contact anyone."
            >
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  maxLength={PERSONA_LIMITS.email.max}
                  placeholder="writer@example.com"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="linkedin_url"
              label="LinkedIn (optional)"
            >
              {(field) => (
                <Input
                  {...field}
                  type="url"
                  maxLength={PERSONA_LIMITS.linkedin_url.max}
                  placeholder="https://linkedin.com/in/username"
                />
              )}
            </FieldController>
          </FormSection>

          <FormSection
            title="Audience and voice"
            description="Lists are comma separated."
          >
            <FieldController
              control={control}
              name="demographics"
              label="Demographics (optional)"
              maxLength={PERSONA_LIMITS.demographics.max}
            >
              {(field) => (
                <Textarea
                  {...field}
                  maxLength={PERSONA_LIMITS.demographics.max}
                  placeholder="Age, location, education"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="areas_of_expertise"
              label="Areas of expertise (optional)"
              maxLength={PERSONA_LIMITS.areas_of_expertise.max}
              description={`Up to ${PERSONA_LIMITS.areas_of_expertise.maxItems}; letters, numbers, spaces and hyphens.`}
            >
              {(field) => (
                <Input
                  {...field}
                  maxLength={PERSONA_LIMITS.areas_of_expertise.max}
                  placeholder="e.g. SEO, Content strategy, Analytics"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="tone_of_voice"
              label="Tone of voice (optional)"
              maxLength={PERSONA_LIMITS.tone_of_voice.max}
            >
              {(field) => (
                <Input
                  {...field}
                  maxLength={PERSONA_LIMITS.tone_of_voice.max}
                  placeholder="e.g. Professional, friendly, expert"
                />
              )}
            </FieldController>
          </FormSection>

          <FormSection
            title="Goals and behaviour"
            description="Lists are comma separated."
          >
            <FieldController
              control={control}
              name="goals"
              label="Goals (optional)"
              maxLength={PERSONA_LIMITS.goals.max}
            >
              {(field) => (
                <Textarea
                  {...field}
                  maxLength={PERSONA_LIMITS.goals.max}
                  placeholder="e.g. Grow organic traffic, Build authority"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="pain_points"
              label="Pain points (optional)"
              maxLength={PERSONA_LIMITS.pain_points.max}
            >
              {(field) => (
                <Textarea
                  {...field}
                  maxLength={PERSONA_LIMITS.pain_points.max}
                  placeholder="e.g. Limited budget, Tight deadlines"
                />
              )}
            </FieldController>
            <FieldController
              control={control}
              name="behaviors"
              label="Behaviours (optional)"
              maxLength={PERSONA_LIMITS.behaviors.max}
            >
              {(field) => (
                <Textarea
                  {...field}
                  maxLength={PERSONA_LIMITS.behaviors.max}
                  placeholder="e.g. Research driven, Data oriented"
                />
              )}
            </FieldController>
          </FormSection>
        </FormShell>
      </PermissionGuard>
    </FormPage>
  );
}
