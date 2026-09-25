"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  User,
  Target,
  AlertCircle,
  TrendingUp,
  Activity,
  Edit2,
  Save,
  Trash2,
  X,
  Loader2,
  Link as LinkIcon,
  Image as ImageIcon,
  Mail,
  Upload,
} from "lucide-react";
import type { Persona } from "@/types/workspace";
import type { Route } from "next";
import { useState, useEffect, useRef } from "react";
import {
  useUpdatePersona,
  useUploadPersonaAvatar,
  usePersona,
  usePersonas,
  useDeletePersona,
} from "@/hooks/use-personas";
import { useWorkspace } from "@/providers/workspace-provider";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  PERSONA_LIMITS,
  firstError,
  isValidHttpUrl,
  normalizePersonaName,
  splitList,
  validatePersona,
  type PersonaErrors,
} from "@/lib/validation/persona-validation";
import { toast } from "sonner";

interface PersonaDetailProps {
  persona: Persona;
}

const toArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];

  // Helper: strip surrounding quotes/brackets from a single string value
  const clean = (s: string) =>
    s
      .trim()
      .replace(/^[["'\s]+|[\]"'\s]+$/g, "")
      .trim();

  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const trimmed = value.trim();

  // Handle JSON-encoded arrays: '["Digital Marketing","Content Creation"]'
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed))
        return parsed.map((s: unknown) => clean(String(s))).filter(Boolean);
    } catch {
      // fall through — strip brackets and split by comma
      return trimmed
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map(clean)
        .filter(Boolean);
    }
  }

  return trimmed.split(",").map(clean).filter(Boolean);
};

const toStringValue = (value: string | string[] | undefined): string => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return value;
};

export function PersonaDetail({ persona: initialPersona }: PersonaDetailProps) {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();
  const personaId = initialPersona.id || "";

  const { data: personaData } = usePersona(workspace?.id || null, personaId);
  const persona = personaData?.persona || initialPersona;

  const { hasPermission: canEdit } = useWorkspacePermission(
    PERSONA_PERMISSIONS.UPDATE,
    workspace?.id,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    PERSONA_PERMISSIONS.DELETE,
    workspace?.id,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Persona>(persona);
  const [errors, setErrors] = useState<PersonaErrors>({});
  /** Flips inside the click itself, before React re-renders the disabled
   *  button, so a fast double-click cannot send two updates. */
  const saving = useRef(false);
  const { data: personaList } = usePersonas(workspace?.id || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const uploadAvatar = useUploadPersonaAvatar(workspace?.id || "");
  const isUploadingAvatar = uploadAvatar.isPending;

  /** One place to set the photo: a file upload or a pasted link, both behind
   *  the avatar in either mode. `urlDraft` is the link being edited in the
   *  dialog; it is only committed on Save. */
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const openPhotoDialog = () => {
    setUrlDraft(formData.avatar_url || "");
    setPhotoDialogOpen(true);
  };

  const initials = persona.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  /** Uploads immediately rather than waiting for the form to be saved: the
   *  server stores the file and answers with the persona, so the picture on
   *  screen is the one that was kept. */
  const handleAvatarFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    // Cleared here so choosing the same file twice still fires a change.
    event.target.value = "";
    if (!file || !persona.id) return;
    const updated = await uploadAvatar.mutateAsync({
      personaId: persona.id,
      file,
    });
    if (updated?.avatar_url) {
      setUploadedAvatar(updated.avatar_url);
      setUrlDraft(updated.avatar_url);
    }
    setFormData((current) => ({
      ...current,
      avatar_url: updated?.avatar_url ?? current.avatar_url,
      avatar_source: updated?.avatar_source ?? "custom",
    }));
    setPhotoDialogOpen(false);
  };

  const updatePersona = useUpdatePersona(workspace?.id || "");
  const deletePersona = useDeletePersona(workspace?.id || "");

  /** Commits the pasted link. While editing the form it only updates local
   *  state and is saved with the rest; otherwise it is persisted on its own. */
  const savePhotoUrl = () => {
    const next = urlDraft.trim();
    // "https:///example.com", "https://-example.com" and "https://example,com"
    // all parse as URLs and none of them resolve to a picture, so the host is
    // checked properly before this is stored.
    if (next && !isValidHttpUrl(next)) {
      toast.error(
        "Enter a valid image URL, e.g. https://example.com/photo.jpg",
      );
      return;
    }
    setUploadedAvatar(null);
    setFormData((current) => ({
      ...current,
      avatar_url: next,
      avatar_source: next ? "custom" : current.avatar_source,
    }));
    if (!isEditing && workspace?.id && persona.id) {
      updatePersona.mutate({
        personaId: persona.id,
        data: { ...persona, avatar_url: next },
      });
    }
    setPhotoDialogOpen(false);
  };

  useEffect(() => {
    if (!persona) return;
    setFormData(persona);
    // `uploadedAvatar` is a local override so the picture on screen is the one
    // just uploaded, before the query refetches. It has to be dropped as soon
    // as the server reports a different picture, or it keeps winning over it:
    // that is why adding a Gravatar email after uploading a file looked like
    // it had done nothing — the server had switched to the Gravatar, and this
    // stale value was still being rendered on top of it.
    setUploadedAvatar((current) =>
      current && current !== persona.avatar_url ? null : current,
    );
  }, [persona]);

  /** Every field rule, plus the one check that needs the rest of the
   *  workspace: a name another persona already uses. */
  const validate = (): PersonaErrors => {
    const next = validatePersona({
      ...formData,
      // An uploaded photo is stored as an object key and served back as a
      // presigned link; that is ours, not something the person typed, so it is
      // not held to the pasted-URL rule.
      avatar_url: uploadedAvatar ? "" : formData.avatar_url,
    });

    const typed = normalizePersonaName(formData.name || "");
    const clash = (personaList?.personas ?? []).some(
      (p) =>
        p.id !== persona.id && normalizePersonaName(p.name || "") === typed,
    );
    if (typed && !next.name && clash) {
      next.name = "A persona with this name already exists in this workspace";
    }

    setErrors(next);
    return next;
  };

  const handleSave = () => {
    if (!workspace?.id || !persona.id) return;
    if (saving.current) return;

    const found = validate();
    if (Object.keys(found).length > 0) {
      toast.error(firstError(found) ?? "Please fix the highlighted fields");
      return;
    }

    const payload = {
      ...formData,
      name: (formData.name || "").trim(),
      // `name` and `full_name` are separate facts and neither stands in for
      // the other; the detail view labels them separately for the same reason.
      full_name: formData.full_name?.trim() || null,
      professional_title: formData.professional_title?.trim() || null,
      areas_of_expertise: splitList(formData.areas_of_expertise),
      goals: splitList(formData.goals),
      pain_points: splitList(formData.pain_points),
      behaviors: splitList(formData.behaviors),
    };

    saving.current = true;
    updatePersona.mutate(
      {
        personaId: persona.id,
        data: payload,
      },
      {
        onSuccess: () => {
          setErrors({});
          setIsEditing(false);
        },
        onSettled: () => {
          saving.current = false;
        },
      },
    );
  };

  const handleDelete = () => {
    if (!workspace?.id || !persona.id) return;

    deletePersona.mutate(persona.id, {
      onSuccess: () => {
        router.push(`/w/${workspaceSlug}/personas`);
      },
    });
  };

  const handleCancel = () => {
    setFormData(persona);
    setErrors({});
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof PersonaErrors]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  /** "12 / 200", turning red once the limit is passed. */
  const counter = (value: string | string[] | undefined, max: number) => {
    const length = toStringValue(value).trim().length;
    return (
      <span
        className={`text-xs tabular-nums ${
          length > max ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {length} / {max}
      </span>
    );
  };

  /** The message under a field, or its hint when there is nothing wrong. */
  const fieldError = (field: keyof PersonaErrors) =>
    errors[field] ? (
      <p className="text-sm text-destructive">{errors[field]}</p>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-end w-full sm:w-auto">
        {isEditing ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleCancel}
              disabled={updatePersona.isPending}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleSave}
              disabled={updatePersona.isPending}
            >
              {updatePersona.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Update Persona
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {canDelete ? (
              <ConfirmationDialog
                title="Delete Persona"
                description={`Are you sure you want to delete "${persona.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/5"
                  disabled={deletePersona.isPending}
                >
                  {deletePersona.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  Delete Persona
                </Button>
              </ConfirmationDialog>
            ) : null}

            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto border-primary/20 text-primary hover:bg-primary/5"
              >
                <Edit2 size={16} className="mr-2" />
                Edit Persona
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User size={18} className="text-primary" />
                Profile Details
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Name & Full Name (Only in Edit mode) */}
              {isEditing && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="name">Persona Display Name *</Label>
                      {counter(formData.name, PERSONA_LIMITS.name.max)}
                    </div>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.name.max}
                      aria-invalid={!!errors.name}
                      placeholder="e.g. Marketing Manager Mary"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {fieldError("name")}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="full_name">Persona Full Name</Label>
                      {counter(
                        formData.full_name || "",
                        PERSONA_LIMITS.full_name.max,
                      )}
                    </div>
                    <Input
                      id="full_name"
                      value={formData.full_name || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.full_name.max}
                      aria-invalid={!!errors.full_name}
                      placeholder="e.g. Mary Jane"
                      className={errors.full_name ? "border-destructive" : ""}
                    />
                    {fieldError("full_name")}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Short Description</Label>
                      {counter(
                        formData.description,
                        PERSONA_LIMITS.description.max,
                      )}
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.description.max}
                      aria-invalid={!!errors.description}
                      placeholder="Short description of this persona..."
                      className={errors.description ? "border-destructive" : ""}
                    />
                    {fieldError("description")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail size={14} />
                      Email
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.email.max}
                      aria-invalid={!!errors.email}
                      placeholder="writer@example.com"
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email ? (
                      fieldError("email")
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Used only to look up a Gravatar. Setting one replaces
                        the current photo, an uploaded one included.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Outside the edit block: the avatar is clickable in both modes. */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarFile}
              />

              <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Persona photo</DialogTitle>
                    <DialogDescription>
                      Upload a file from your machine or paste a link to an
                      image. A link you set is kept; clear it to fall back to
                      the photo on their site, then a Gravatar, then initials.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 rounded-xl shadow-md border border-border/50">
                      <AvatarImage
                        src={uploadedAvatar || urlDraft || ""}
                        alt={`${persona.name}'s avatar`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {isUploadingAvatar ? "Uploading..." : "Upload a photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPEG, PNG, GIF or WebP, up to 5MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="avatar_url_dialog"
                      className="flex items-center gap-2"
                    >
                      <ImageIcon size={14} />
                      Image link
                    </Label>
                    <Input
                      id="avatar_url_dialog"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  <DialogFooter className="gap-2 sm:gap-2">
                    {urlDraft.trim() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mr-auto text-destructive hover:text-destructive"
                        onClick={() => setUrlDraft("")}
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPhotoDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={savePhotoUrl}
                      disabled={
                        isUploadingAvatar ||
                        urlDraft.trim() === (formData.avatar_url || "").trim()
                      }
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-4 mb-6">
                {/*
                  While editing, the avatar is the one control for the photo:
                  clicking it opens a dialog that takes a file upload or a
                  pasted link. Outside edit mode it is just the picture.
                */}
                {(() => {
                  const avatar = (
                    <Avatar className="h-16 w-16 rounded-xl shadow-md border border-border/50">
                      <AvatarImage
                        src={
                          uploadedAvatar ||
                          formData.avatar_url ||
                          persona.avatar_url ||
                          ""
                        }
                        alt={`${persona.name}'s avatar`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  );

                  if (!isEditing) return avatar;

                  return (
                    <button
                      type="button"
                      onClick={openPhotoDialog}
                      disabled={isUploadingAvatar}
                      title="Change photo"
                      className="relative group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {avatar}
                      <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        {isUploadingAvatar ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                          <Upload className="h-5 w-5 text-white" />
                        )}
                      </span>
                    </button>
                  );
                })()}
                {isEditing &&
                  !uploadedAvatar &&
                  persona.avatar_source === "generated" && (
                    <span className="text-xs text-muted-foreground">
                      No photo found - click the circle to add one
                    </span>
                  )}
                {/*
                  `persona.name` is the display name and `persona.full_name`
                  is the person's real name. Printing the first under a
                  "Full Name" heading is what made it look as though the
                  display name was being written into the full-name field.
                */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Display Name
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xl font-bold">{persona.name}</p>
                  </div>
                  {persona.full_name?.trim() ? (
                    <>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Full Name
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {persona.full_name}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Professional Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="professional_title"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Professional Title
                    {isEditing ? (
                      <span className="ml-1 normal-case font-normal">
                        (optional)
                      </span>
                    ) : null}
                  </Label>
                  {isEditing
                    ? counter(
                        formData.professional_title || "",
                        PERSONA_LIMITS.professional_title.max,
                      )
                    : null}
                </div>
                {isEditing ? (
                  <>
                    <Input
                      id="professional_title"
                      value={formData.professional_title || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.professional_title.max}
                      aria-invalid={!!errors.professional_title}
                      placeholder="e.g. Senior Marketing Manager"
                      className={
                        errors.professional_title ? "border-destructive" : ""
                      }
                    />
                    {fieldError("professional_title")}
                  </>
                ) : (
                  persona.professional_title && (
                    <p className="text-base font-medium">
                      {persona.professional_title}
                    </p>
                  )
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="bio"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Bio
                  </Label>
                  {isEditing
                    ? counter(formData.bio, PERSONA_LIMITS.bio.max)
                    : null}
                </div>
                {isEditing ? (
                  <>
                    <Textarea
                      id="bio"
                      value={formData.bio || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.bio.max}
                      aria-invalid={!!errors.bio}
                      placeholder="Short biography about this persona..."
                      className={`min-h-[120px] ${
                        errors.bio ? "border-destructive" : ""
                      }`}
                    />
                    {fieldError("bio")}
                  </>
                ) : (
                  persona.bio && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {persona.bio}
                    </p>
                  )
                )}
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label
                  htmlFor="linkedin_url"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                >
                  <LinkIcon size={14} />
                  LinkedIn
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.linkedin_url.max}
                      aria-invalid={!!errors.linkedin_url}
                      placeholder="https://linkedin.com/in/..."
                      className={
                        errors.linkedin_url ? "border-destructive" : ""
                      }
                    />
                    {fieldError("linkedin_url")}
                  </>
                ) : (
                  persona.linkedin_url && (
                    <a
                      href={persona.linkedin_url as Route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {persona.linkedin_url}
                    </a>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User size={18} className="text-primary" />
                Demographics
              </h3>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <>
                  <div className="flex items-center justify-end pb-2">
                    {counter(
                      formData.demographics,
                      PERSONA_LIMITS.demographics.max,
                    )}
                  </div>
                  <Textarea
                    id="demographics"
                    value={formData.demographics || ""}
                    onChange={handleChange}
                    maxLength={PERSONA_LIMITS.demographics.max}
                    aria-invalid={!!errors.demographics}
                    placeholder="Age, location, education, etc."
                    className={`min-h-[100px] ${
                      errors.demographics ? "border-destructive" : ""
                    }`}
                  />
                  {fieldError("demographics")}
                </>
              ) : (
                persona.demographics && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {persona.demographics}
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Expertise & Tone */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Capabilities
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label
                  htmlFor="areas_of_expertise"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Areas of Expertise
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="areas_of_expertise"
                      value={toStringValue(formData.areas_of_expertise)}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.areas_of_expertise.max}
                      aria-invalid={!!errors.areas_of_expertise}
                      placeholder="e.g. SEO, Content Strategy, Analytics"
                      className={
                        errors.areas_of_expertise ? "border-destructive" : ""
                      }
                    />
                    {errors.areas_of_expertise ? (
                      fieldError("areas_of_expertise")
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Separate each area with a comma — up to{" "}
                        {PERSONA_LIMITS.areas_of_expertise.maxItems} entries.
                      </p>
                    )}
                  </>
                ) : (
                  toArray(persona.areas_of_expertise).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {toArray(persona.areas_of_expertise).map((area) => (
                        <Badge
                          key={area}
                          variant="secondary"
                          className="px-3 py-1 text-sm"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )
                )}
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="tone_of_voice"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Activity size={14} />
                  Tone of Voice
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="tone_of_voice"
                      value={formData.tone_of_voice || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.tone_of_voice.max}
                      aria-invalid={!!errors.tone_of_voice}
                      placeholder="e.g. Professional, friendly, expert"
                      className={
                        errors.tone_of_voice ? "border-destructive" : ""
                      }
                    />
                    {fieldError("tone_of_voice")}
                  </>
                ) : (
                  persona.tone_of_voice && (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm italic text-muted-foreground">
                        "{persona.tone_of_voice}"
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goals & Pain Points */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Objectives & Challenges
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label
                  htmlFor="goals"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Goals
                </Label>
                {isEditing ? (
                  <>
                    <Textarea
                      id="goals"
                      value={toStringValue(formData.goals)}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.goals.max}
                      aria-invalid={!!errors.goals}
                      placeholder="Comma separated, e.g. Grow organic traffic, Build authority"
                      className={`min-h-[80px] ${
                        errors.goals ? "border-destructive" : ""
                      }`}
                    />
                    {fieldError("goals")}
                  </>
                ) : (
                  toArray(persona.goals).length > 0 && (
                    <ul className="text-sm leading-relaxed text-muted-foreground list-disc list-inside space-y-1">
                      {toArray(persona.goals).map((goal) => (
                        <li key={goal}>{goal}</li>
                      ))}
                    </ul>
                  )
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="pain_points"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                >
                  <AlertCircle size={14} className="text-destructive" />
                  Pain Points
                </Label>
                {isEditing ? (
                  <>
                    <Textarea
                      id="pain_points"
                      value={toStringValue(formData.pain_points)}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.pain_points.max}
                      aria-invalid={!!errors.pain_points}
                      placeholder="Comma separated, e.g. Limited budget, Tight deadlines"
                      className={`min-h-[80px] ${
                        errors.pain_points ? "border-destructive" : ""
                      }`}
                    />
                    {fieldError("pain_points")}
                  </>
                ) : (
                  toArray(persona.pain_points).length > 0 && (
                    <ul className="text-sm leading-relaxed text-muted-foreground list-disc list-inside space-y-1">
                      {toArray(persona.pain_points).map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Behaviors */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                Behaviors
              </h3>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <>
                  <Textarea
                    id="behaviors"
                    value={toStringValue(formData.behaviors)}
                    onChange={handleChange}
                    maxLength={PERSONA_LIMITS.behaviors.max}
                    aria-invalid={!!errors.behaviors}
                    placeholder="Comma separated, e.g. Research driven, Data oriented"
                    className={`min-h-[100px] ${
                      errors.behaviors ? "border-destructive" : ""
                    }`}
                  />
                  {fieldError("behaviors")}
                </>
              ) : (
                toArray(persona.behaviors).length > 0 && (
                  <ul className="text-sm leading-relaxed text-muted-foreground list-disc list-inside space-y-1">
                    {toArray(persona.behaviors).map((behavior) => (
                      <li key={behavior}>{behavior}</li>
                    ))}
                  </ul>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
