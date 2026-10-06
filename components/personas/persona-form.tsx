"use client";

import { Upload } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FieldController } from "@/components/forms/field-controller";
import { FormSection, FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreatePersona,
  usePersonas,
  useUpdatePersona,
  useUploadPersonaAvatar,
} from "@/hooks/use-personas";
import { workspaceRoutes } from "@/lib/routes";
import {
  isServerOwnedAvatar,
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
import type { Persona } from "@/types/workspace";

/** JPEG/PNG/GIF/WebP up to 5MB, matching what the upload endpoint accepts. */
const AVATAR_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const trimmed = (value: string) => value.trim() || undefined;

const asText = (value: string | string[] | null | undefined) =>
  splitList(value ?? undefined).join(", ");

/**
 * A saved persona as the form's values. The photo link shows only a link someone typed: an uploaded
 * photo comes back as a presigned address, and a Gravatar or drawn initials aren't a link to edit.
 */
export function toPersonaFormValues(persona: Persona): PersonaFormValues {
  const avatar = persona.avatar_url ?? "";
  // An upload is stored under avatars/personas/<id>/ and served from storage at that path.
  const uploaded =
    isServerOwnedAvatar(avatar) || avatar.includes("/avatars/personas/");
  const typedLink =
    persona.avatar_source === "custom" &&
    /^https?:\/\//.test(avatar) &&
    !uploaded;
  return {
    name: persona.name ?? "",
    full_name: persona.full_name ?? "",
    description: persona.description ?? "",
    professional_title: persona.professional_title ?? "",
    avatar_url: typedLink ? avatar : "",
    email: persona.email ?? "",
    bio: persona.bio ?? "",
    linkedin_url: persona.linkedin_url ?? "",
    demographics: persona.demographics ?? "",
    areas_of_expertise: asText(persona.areas_of_expertise),
    tone_of_voice: persona.tone_of_voice ?? "",
    goals: asText(persona.goals),
    pain_points: asText(persona.pain_points),
    behaviors: asText(persona.behaviors),
  };
}

/**
 * The one persona form (plans/app/D-pages.md §2.2), for creating and for editing, on the field set.
 * A photo chosen from the device is held until the save and uploaded after it, so creating and
 * editing behave the same; a typed photo link is sent only when it was changed, since an empty one
 * would clear an uploaded photo.
 */
export function PersonaForm({ persona }: { persona?: Persona }) {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();
  const workspaceId = workspace?.id || "";
  const createPersona = useCreatePersona(workspaceId);
  const updatePersona = useUpdatePersona(workspaceId);
  const uploadAvatar = useUploadPersonaAvatar(workspaceId);
  const { data: personaList } = usePersonas(workspace?.id || null);
  const editing = Boolean(persona?.id);

  const form = useZodForm(personaFormSchema, {
    defaultValues: persona ? toPersonaFormValues(persona) : EMPTY_PERSONA_FORM,
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

  /** A picture chosen on the device, uploaded after the save (a new persona has no row to attach it
   *  to until then); `avatarPreview` is a local object URL purely for the preview. */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** A saved photo the link field doesn't show (an upload, or one taken from the website) is
   *  removed here; the save sends the backend's removal signal, an empty `avatar_url`. */
  const storedPhoto = Boolean(
    editing &&
      persona?.avatar_url &&
      (persona.avatar_source === "custom" ||
        persona.avatar_source === "page") &&
      !toPersonaFormValues(persona).avatar_url,
  );
  const [removePhoto, setRemovePhoto] = useState(false);

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
    // A new photo replaces the saved one; there's nothing left to remove.
    setRemovePhoto(false);
    // An uploaded file and a pasted link are the same slot; keeping both would
    // leave the persona showing one and storing the other.
    form.setValue("avatar_url", "", { shouldDirty: true });
    form.clearErrors("avatar_url");
  };

  const clearAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    // Choosing the file emptied the photo link; dropping the file gives back the link it had (or
    // none), and the field is no longer an edit, so a save doesn't clear the current photo.
    form.resetField("avatar_url");
  };

  const onSubmit = async (values: PersonaFormValues) => {
    if (!workspace?.id || submitting.current) return;

    // Duplicate names are refused by the API; catching it here saves the round
    // trip and points at the field rather than showing a bare error toast.
    const typed = normalizePersonaName(values.name);
    const taken = (personaList?.personas ?? []).some(
      (p) =>
        p.id !== persona?.id && normalizePersonaName(p.name || "") === typed,
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

    // No cross-filling between `name` and `full_name`: they are separate
    // facts, and copying one into the other is what put the display name
    // under "Full Name" on the detail page.
    const fields = {
      name: values.name.trim(),
      full_name: trimmed(values.full_name),
      description: trimmed(values.description) ?? "",
      professional_title: trimmed(values.professional_title),
      email: trimmed(values.email),
      bio: trimmed(values.bio),
      linkedin_url: trimmed(values.linkedin_url),
      demographics: trimmed(values.demographics),
      areas_of_expertise: splitList(values.areas_of_expertise),
      tone_of_voice: trimmed(values.tone_of_voice),
      goals: splitList(values.goals),
      pain_points: splitList(values.pain_points),
      behaviors: splitList(values.behaviors),
    };

    submitting.current = true;
    try {
      let personaId = persona?.id;
      if (editing && personaId) {
        await updatePersona.mutateAsync({
          personaId,
          data: {
            ...fields,
            // A field emptied here is cleared, not left as it was (the backend leaves
            // out only what isn't sent); the photo link only when it was edited.
            full_name: values.full_name.trim() || null,
            professional_title: values.professional_title.trim() || null,
            email: values.email.trim() || null,
            bio: values.bio.trim(),
            linkedin_url: values.linkedin_url.trim() || null,
            demographics: values.demographics.trim(),
            tone_of_voice: values.tone_of_voice.trim(),
            ...(avatarFile
              ? {}
              : form.formState.dirtyFields.avatar_url
                ? { avatar_url: values.avatar_url.trim() }
                : removePhoto
                  ? { avatar_url: "" }
                  : {}),
          },
        });
      } else {
        const result = await createPersona.mutateAsync({
          ...fields,
          avatar_url: avatarFile ? undefined : trimmed(values.avatar_url),
        });
        personaId = result?.persona?.id;
      }

      // The picture needs a persona to belong to, so it goes up after the save.
      // A failure here leaves the saved persona without its photo rather than
      // failing the whole save, so it is reported and not re-thrown.
      if (avatarFile && personaId) {
        try {
          await uploadAvatar.mutateAsync({ personaId, file: avatarFile });
        } catch {
          toast.error(
            "The persona was saved, but the photo couldn't be uploaded",
          );
        }
      }

      // Saved: the form is clean, so leaving it doesn't ask.
      form.reset(values);
      setAvatarFile(null);
      setRemovePhoto(false);
      router.push(
        (personaId
          ? workspaceRoutes.persona(workspaceSlug, personaId)
          : workspaceRoutes.personas(workspaceSlug)) as Route,
      );
    } catch {
      // Error toast handled by the mutation hook
      submitting.current = false;
    }
  };

  const displayName = form.watch("name") || persona?.name || "New persona";
  const avatarLink = form.watch("avatar_url");
  const avatarShown =
    avatarPreview ||
    avatarLink ||
    (editing && !removePhoto ? persona?.avatar_url : "") ||
    "";

  return (
    <FormShell
      form={form}
      onSubmit={onSubmit}
      onInvalid={() => toast.error("Please fix the highlighted fields")}
      submitLabel={editing ? "Save persona" : "Create persona"}
      cancel={{ onCancel: () => router.back() }}
      sticky
      // A chosen or removed photo lives outside the form's values; leaving would drop it.
      dirty={Boolean(avatarFile) || removePhoto}
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
              <AvatarImage src={avatarShown} alt="" className="object-cover" />
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
              {storedPhoto &&
                !avatarFile &&
                (removePhoto ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Removed when you save
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemovePhoto(false)}
                    >
                      Keep photo
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemovePhoto(true)}
                  >
                    Remove photo
                  </Button>
                ))}
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
            JPEG, PNG, GIF or WebP, up to 5MB. Uploaded when you{" "}
            {editing ? "save" : "create the persona"}.
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
  );
}
