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
  Star,
  Upload,
} from "lucide-react";
import type { Persona } from "@/types/workspace";
import type { Route } from "next";
import { useState, useEffect, useRef } from "react";
import {
  useUpdatePersona,
  useUploadPersonaAvatar,
  usePersona,
  useDeletePersona,
} from "@/hooks/use-personas";
import { useWorkspace } from "@/providers/workspace-provider";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
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
    CONTENT_PERMISSIONS.UPDATE,
    workspace?.id,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    CONTENT_PERMISSIONS.DELETE,
    workspace?.id,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Persona>(persona);
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
    if (persona) {
      setFormData(persona);
    }
  }, [persona]);

  const handleSave = () => {
    if (!workspace?.id || !persona.id) return;

    const payload = {
      ...formData,
      areas_of_expertise: toArray(formData.areas_of_expertise),
      goals: toArray(formData.goals),
      pain_points: toArray(formData.pain_points),
      behaviors: toArray(formData.behaviors),
    };

    updatePersona.mutate(
      {
        personaId: persona.id,
        data: payload,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
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
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-end w-full sm:w-auto">
        {isEditing ? (
          <div className="flex gap-2 w-full sm:w-72 justify-between">
            <Button
              variant="outline"
              size="sm"
              className="!w-[49%] sm:w-auto"
              onClick={handleCancel}
              disabled={updatePersona.isPending}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="!w-[49%] sm:w-36"
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
          <div className="flex gap-2 w-full sm:w-auto justify-between">
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
                  className="!w-[49%] sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/5"
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
            ) : (
              <LockedFeatureTooltip
                permission={CONTENT_PERMISSIONS.DELETE}
                message="Deleting personas requires Editor role or above"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="!w-[49%] sm:w-auto text-destructive border-destructive/20"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Persona
                </Button>
              </LockedFeatureTooltip>
            )}

            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="!w-[49%] sm:w-auto border-primary/20 text-primary hover:bg-primary/5"
              >
                <Edit2 size={16} className="mr-2" />
                Edit Persona
              </Button>
            ) : (
              <LockedFeatureTooltip
                permission={CONTENT_PERMISSIONS.UPDATE}
                message="Editing personas requires Editor role or above"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="!w-[49%] sm:w-auto border-primary/20 text-primary"
                >
                  <Edit2 size={16} className="mr-2" />
                  Edit Persona
                </Button>
              </LockedFeatureTooltip>
            )}
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
                    <Label htmlFor="name">Persona Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Marketing Manager Mary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Persona Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name || ""}
                      onChange={handleChange}
                      placeholder="e.g. Mary Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      placeholder="Short description of this persona..."
                    />
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
                      placeholder="writer@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used only to look up a Gravatar.
                    </p>
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
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xl font-bold">{persona.name}</p>
                    {/*
                      Shown here as well as on the cards. This is the page
                      someone opens to decide whether to write as this person,
                      and the recommendation was visible everywhere except the
                      screen where the decision is made.
                    */}
                    {persona.is_recommended && (
                      <Badge
                        variant="default"
                        className="gap-1 bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Title */}
              <div className="space-y-2">
                <Label
                  htmlFor="professional_title"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Professional Title
                </Label>
                {isEditing ? (
                  <Input
                    id="professional_title"
                    value={formData.professional_title || ""}
                    onChange={handleChange}
                    placeholder="e.g. Senior Marketing Manager"
                  />
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
                <Label
                  htmlFor="bio"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Bio
                </Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    placeholder="Short biography about this persona..."
                    className="min-h-[120px]"
                  />
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
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url || ""}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                  />
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
                <Textarea
                  id="demographics"
                  value={formData.demographics || ""}
                  onChange={handleChange}
                  placeholder="Age, location, education, etc."
                  className="min-h-[100px]"
                />
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
                  <Input
                    id="areas_of_expertise"
                    value={toStringValue(formData.areas_of_expertise)}
                    onChange={handleChange}
                    placeholder="Comma separated values"
                  />
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
                  <Input
                    id="tone_of_voice"
                    value={formData.tone_of_voice || ""}
                    onChange={handleChange}
                    placeholder="e.g. Professional, friendly, expert"
                  />
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
                  <Textarea
                    id="goals"
                    value={toStringValue(formData.goals)}
                    onChange={handleChange}
                    placeholder="Primary objectives and goals"
                    className="min-h-[80px]"
                  />
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
                  <Textarea
                    id="pain_points"
                    value={toStringValue(formData.pain_points)}
                    onChange={handleChange}
                    placeholder="Main challenges and pain points"
                    className="min-h-[80px]"
                  />
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
                <Textarea
                  id="behaviors"
                  value={toStringValue(formData.behaviors)}
                  onChange={handleChange}
                  placeholder="Key behaviors and habits"
                  className="min-h-[100px]"
                />
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
