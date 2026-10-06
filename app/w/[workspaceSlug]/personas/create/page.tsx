"use client";

import { FormPage } from "@/components/layouts";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PERSONA_PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Target,
  AlertCircle,
  TrendingUp,
  Activity,
  Plus,
  Loader2,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  Mail,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { toast } from "sonner";
import {
  useCreatePersona,
  usePersonas,
  useUploadPersonaAvatar,
} from "@/hooks/use-personas";
import type { Persona } from "@/types/workspace";
import type { Route } from "next";
import {
  PERSONA_LIMITS,
  firstError,
  normalizePersonaName,
  splitList,
  validatePersona,
  type PersonaErrors,
} from "@/lib/validation/persona-validation";

const toStringValue = (value: string | string[] | undefined): string => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return value;
};

/** JPEG/PNG/GIF/WebP up to 5MB, matching what the upload endpoint accepts. */
const AVATAR_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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

  const [isLoading, setIsLoading] = useState(false);
  /**
   * The button's `disabled` only takes effect on the next render, so a fast
   * double-click gets two handlers in before React repaints and two personas
   * are created. A ref flips synchronously, inside the same click, which is
   * the only thing that can turn the second click into a no-op. The backend
   * rejects the duplicate as well — this stops it ever being sent.
   */
  const submitting = useRef(false);

  const [formData, setFormData] = useState<Persona>({
    name: "",
    full_name: "",
    description: "",
    professional_title: "",
    avatar_url: "",
    email: "",
    bio: "",
    linkedin_url: "",
    demographics: "",
    areas_of_expertise: "",
    tone_of_voice: "",
    goals: "",
    pain_points: "",
    behaviors: "",
  });
  const [errors, setErrors] = useState<PersonaErrors>({});

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof PersonaErrors]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

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
    setFormData((prev) => ({ ...prev, avatar_url: "" }));
    setErrors((prev) => ({ ...prev, avatar_url: undefined }));
  };

  const clearAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const validate = (): PersonaErrors => {
    const next = validatePersona({
      ...formData,
      // A file upload replaces the URL field, so it is not validated as one.
      avatar_url: avatarFile ? "" : formData.avatar_url,
    });

    // Duplicate names are refused by the API; catching it here saves the round
    // trip and points at the field rather than showing a bare error toast.
    const typed = normalizePersonaName(formData.name || "");
    const existing = personaList?.personas ?? [];
    if (
      typed &&
      !next.name &&
      existing.some((p) => normalizePersonaName(p.name || "") === typed)
    ) {
      next.name = "A persona with this name already exists in this workspace";
    }

    setErrors(next);
    return next;
  };

  const handleCreate = async () => {
    if (!workspace?.id) return;
    if (submitting.current) return;

    const found = validate();
    if (Object.keys(found).length > 0) {
      toast.error(firstError(found) ?? "Please fix the highlighted fields");
      return;
    }

    submitting.current = true;
    setIsLoading(true);
    try {
      const trimmed = (v: string | null | undefined) => v?.trim() || undefined;

      // No cross-filling between `name` and `full_name`: they are separate
      // facts, and copying one into the other is what put the display name
      // under "Full Name" on the detail page.
      const result = await createPersona.mutateAsync({
        name: (formData.name || "").trim(),
        full_name: trimmed(formData.full_name),
        description: trimmed(formData.description) ?? "",
        professional_title: trimmed(formData.professional_title),
        avatar_url: avatarFile ? undefined : trimmed(formData.avatar_url),
        email: trimmed(formData.email),
        bio: trimmed(formData.bio),
        linkedin_url: trimmed(formData.linkedin_url),
        demographics: trimmed(formData.demographics),
        areas_of_expertise: splitList(formData.areas_of_expertise),
        tone_of_voice: trimmed(formData.tone_of_voice),
        goals: splitList(formData.goals),
        pain_points: splitList(formData.pain_points),
        behaviors: splitList(formData.behaviors),
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
    } finally {
      setIsLoading(false);
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

  const avatarDisplayName = formData.name || "New Persona";

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

  return (
    <FormPage
      title="Create New Persona"
      description="Define a new author persona to enhance your content's EEAT signals"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            <X size={16} className="mr-2" />
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCreate}
            disabled={isLoading || createPersona.isPending}
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Plus size={16} className="mr-2" />
            )}
            {isLoading ? "Creating..." : "Create Persona"}
          </Button>
        </div>
      }
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
        <div className="space-y-6 pb-12">
          <div className="grid grid-cols-1 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Details */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User size={18} className="text-foreground" />
                    Profile Details
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
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
                    {errors.name ? (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Required. Use letters, spaces, apostrophes, hyphens and
                        periods; numbers aren't allowed. At least{" "}
                        {PERSONA_LIMITS.name.min} characters.
                      </p>
                    )}
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
                    {errors.full_name && (
                      <p className="text-sm text-destructive">
                        {errors.full_name}
                      </p>
                    )}
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
                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Photo: a file from this machine or a link, never both. */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon size={14} />
                      Photo
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={AVATAR_ACCEPT}
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={isLoading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {avatarFile ? "Choose another" : "Upload from device"}
                      </Button>
                      {avatarFile && (
                        <>
                          <span className="text-xs text-muted-foreground truncate max-w-[10rem]">
                            {avatarFile.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={clearAvatarFile}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, GIF or WebP, up to 5MB. Uploaded once the
                      persona is created.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="avatar_url"
                      className="flex items-center gap-2"
                    >
                      <LinkIcon size={14} />
                      Avatar URL
                    </Label>
                    <Input
                      id="avatar_url"
                      value={formData.avatar_url || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.avatar_url.max}
                      aria-invalid={!!errors.avatar_url}
                      disabled={!!avatarFile}
                      placeholder="https://example.com/image.jpg"
                      className={errors.avatar_url ? "border-destructive" : ""}
                    />
                    {errors.avatar_url ? (
                      <p className="text-sm text-destructive">
                        {errors.avatar_url}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {avatarFile
                          ? "Ignored while a file is selected."
                          : "Paste a link to a photo. Leave it empty and we will use a Gravatar if the email below has one."}
                      </p>
                    )}
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
                      <p className="text-sm text-destructive">{errors.email}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Used only to look up a Gravatar. Not shown publicly and
                        never used to contact anyone.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 rounded-md shadow-md border border-border/50">
                      <AvatarImage
                        src={avatarPreview || formData.avatar_url || ""}
                        alt={`${avatarDisplayName}'s avatar`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-md bg-muted text-foreground font-bold text-xl">
                        {avatarDisplayName
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Display Name
                      </Label>
                      <p className="text-xl font-bold">{avatarDisplayName}</p>
                      {formData.full_name?.trim() && (
                        <p className="text-sm text-muted-foreground">
                          {formData.full_name.trim()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Professional Title — optional per the meeting decision. */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="professional_title"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        Professional Title
                        <span className="ml-1 normal-case font-normal">
                          (optional)
                        </span>
                      </Label>
                      {counter(
                        formData.professional_title || "",
                        PERSONA_LIMITS.professional_title.max,
                      )}
                    </div>
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
                    {errors.professional_title ? (
                      <p className="text-sm text-destructive">
                        {errors.professional_title}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Include at least one letter; numbers and punctuation are
                        allowed — {PERSONA_LIMITS.professional_title.min}–
                        {PERSONA_LIMITS.professional_title.max} characters if
                        provided.
                      </p>
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
                      {counter(formData.bio, PERSONA_LIMITS.bio.max)}
                    </div>
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
                    {errors.bio && (
                      <p className="text-sm text-destructive">{errors.bio}</p>
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
                    {errors.linkedin_url && (
                      <p className="text-sm text-destructive">
                        {errors.linkedin_url}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Demographics */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User size={18} className="text-foreground" />
                      Demographics
                    </h3>
                    {counter(
                      formData.demographics,
                      PERSONA_LIMITS.demographics.max,
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-2">
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
                  {errors.demographics && (
                    <p className="text-sm text-destructive">
                      {errors.demographics}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Capabilities */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp size={18} className="text-foreground" />
                    Capabilities
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="areas_of_expertise"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        Areas of Expertise
                      </Label>
                      {counter(
                        formData.areas_of_expertise,
                        PERSONA_LIMITS.areas_of_expertise.max,
                      )}
                    </div>
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
                      <p className="text-sm text-destructive">
                        {errors.areas_of_expertise}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        One area per comma; hyphens are allowed, e.g.
                        "seo-marketing, analytics". Up to{" "}
                        {PERSONA_LIMITS.areas_of_expertise.maxItems} entries.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="tone_of_voice"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Activity size={14} />
                        Tone of Voice
                      </Label>
                      {counter(
                        formData.tone_of_voice,
                        PERSONA_LIMITS.tone_of_voice.max,
                      )}
                    </div>
                    <Input
                      id="tone_of_voice"
                      value={formData.tone_of_voice || ""}
                      onChange={handleChange}
                      maxLength={PERSONA_LIMITS.tone_of_voice.max}
                      aria-invalid={!!errors.tone_of_voice}
                      placeholder="Comma separated, e.g. Professional, friendly, expert"
                      className={
                        errors.tone_of_voice ? "border-destructive" : ""
                      }
                    />
                    {errors.tone_of_voice && (
                      <p className="text-sm text-destructive">
                        {errors.tone_of_voice}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Objectives & Challenges */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target size={18} className="text-foreground" />
                    Objectives & Challenges
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="goals"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        Goals
                      </Label>
                      {counter(formData.goals, PERSONA_LIMITS.goals.max)}
                    </div>
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
                    {errors.goals && (
                      <p className="text-sm text-destructive">{errors.goals}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="pain_points"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <AlertCircle size={14} className="text-destructive" />
                        Pain Points
                      </Label>
                      {counter(
                        formData.pain_points,
                        PERSONA_LIMITS.pain_points.max,
                      )}
                    </div>
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
                    {errors.pain_points && (
                      <p className="text-sm text-destructive">
                        {errors.pain_points}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Behaviors */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Activity size={18} className="text-foreground" />
                      Behaviors
                    </h3>
                    {counter(formData.behaviors, PERSONA_LIMITS.behaviors.max)}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-2">
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
                  {errors.behaviors && (
                    <p className="text-sm text-destructive">
                      {errors.behaviors}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </FormPage>
  );
}
