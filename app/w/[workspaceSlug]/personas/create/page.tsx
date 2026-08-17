"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { PermissionGuard } from "@/components/permission/permission-guard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
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
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { toast } from "sonner";
import { useCreatePersona } from "@/hooks/use-personas";
import type { Persona } from "@/types/workspace";
import type { Route } from "next";

const CONTAINS_LETTER = /[a-zA-Z]/;
const LINKEDIN_URL_RE =
  /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
const HTTP_URL_RE = /^https?:\/\/.+/;

const toArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  const clean = (s: string) =>
    s
      .trim()
      .replace(/^[["'\s]+|[\]"'\s]+$/g, "")
      .trim();

  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const trimmed = value.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed))
        return parsed.map((s: unknown) => clean(String(s))).filter(Boolean);
    } catch {
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

interface ValidationErrors {
  name?: string;
  professional_title?: string;
  bio?: string;
  linkedin_url?: string;
  avatar_url?: string;
}

export default function CreatePersonaPage() {
  const { workspace, workspaceSlug, workspaceId } = useWorkspace();
  const router = useRouter();
  const createPersona = useCreatePersona(workspace?.id || "");
  const { isLoading: isPermLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Persona>({
    name: "",
    full_name: "",
    description: "",
    professional_title: "",
    avatar_url: "",
    bio: "",
    linkedin_url: "",
    demographics: "",
    areas_of_expertise: "",
    tone_of_voice: "",
    goals: "",
    pain_points: "",
    behaviors: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    const nameVal = formData.name?.trim() || formData.full_name?.trim() || "";
    const titleVal =
      formData.professional_title?.trim() || formData.description?.trim() || "";

    if (!nameVal) {
      newErrors.name = "Persona display name or full name is required";
    } else if (nameVal.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (!CONTAINS_LETTER.test(nameVal)) {
      newErrors.name = "Name must contain at least one letter";
    }

    if (!titleVal) {
      newErrors.professional_title = "Professional title is required";
    } else if (titleVal.length < 2) {
      newErrors.professional_title =
        "Professional title must be at least 2 characters";
    } else if (!CONTAINS_LETTER.test(titleVal)) {
      newErrors.professional_title =
        "Professional title must contain at least one letter";
    }

    if (formData.bio?.trim() && formData.bio.trim().length < 10) {
      newErrors.bio = "Bio must be at least 10 characters if provided";
    }

    if (
      formData.linkedin_url?.trim() &&
      !LINKEDIN_URL_RE.test(formData.linkedin_url.trim())
    ) {
      newErrors.linkedin_url =
        "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)";
    }

    if (
      formData.avatar_url?.trim() &&
      !HTTP_URL_RE.test(formData.avatar_url.trim())
    ) {
      newErrors.avatar_url =
        "Please enter a valid URL starting with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!workspace?.id) return;
    if (!validate()) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    try {
      setIsLoading(true);
      const displayName =
        formData.name?.trim() || formData.full_name?.trim() || "";
      const fullName =
        formData.full_name?.trim() || formData.name?.trim() || "";
      const title =
        formData.professional_title?.trim() ||
        formData.description?.trim() ||
        "";
      const description =
        formData.description?.trim() ||
        formData.professional_title?.trim() ||
        "";

      await createPersona.mutateAsync({
        name: displayName,
        full_name: fullName,
        description: description,
        professional_title: title,
        avatar_url: formData.avatar_url?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,
        linkedin_url: formData.linkedin_url?.trim() || undefined,
        demographics: formData.demographics?.trim() || undefined,
        areas_of_expertise: toArray(formData.areas_of_expertise),
        tone_of_voice: formData.tone_of_voice?.trim() || undefined,
        goals: toArray(formData.goals),
        pain_points: toArray(formData.pain_points),
        behaviors: toArray(formData.behaviors),
      });

      router.push(workspaceRoutes.personas(workspaceSlug) as Route);
    } catch {
      // Error toast handled by mutation hook
    } finally {
      setIsLoading(false);
    }
  };

  if (!workspace?.id || isPermLoading) {
    return (
      <PageLayout title="Loading Permissions...">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  const avatarDisplayName =
    formData.name || formData.full_name || "New Persona";

  return (
    <PageLayout
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
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Plus size={16} className="mr-2" />
            )}
            Create Persona
          </Button>
        </div>
      }
      fullWidth
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.CREATE}
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
                <code className="text-xs bg-muted px-1 rounded">
                  content:create
                </code>
              </p>
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Details */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    Profile Details
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Persona Display Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Marketing Manager Mary"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
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
                    <Label
                      htmlFor="avatar_url"
                      className="flex items-center gap-2"
                    >
                      <ImageIcon size={14} />
                      Avatar URL
                    </Label>
                    <Input
                      id="avatar_url"
                      value={formData.avatar_url || ""}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className={errors.avatar_url ? "border-destructive" : ""}
                    />
                    {errors.avatar_url && (
                      <p className="text-sm text-destructive">
                        {errors.avatar_url}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 rounded-xl shadow-md border border-border/50">
                      <AvatarImage
                        src={formData.avatar_url || ""}
                        alt={`${avatarDisplayName}'s avatar`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xl">
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
                        Full Name
                      </Label>
                      <p className="text-xl font-bold">{avatarDisplayName}</p>
                    </div>
                  </div>

                  {/* Professional Title */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="professional_title"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      Professional Title *
                    </Label>
                    <Input
                      id="professional_title"
                      value={formData.professional_title || ""}
                      onChange={handleChange}
                      placeholder="e.g. Senior Marketing Manager"
                      className={
                        errors.professional_title ? "border-destructive" : ""
                      }
                    />
                    {errors.professional_title && (
                      <p className="text-sm text-destructive">
                        {errors.professional_title}
                      </p>
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
                    <Textarea
                      id="bio"
                      value={formData.bio || ""}
                      onChange={handleChange}
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
                  <h3 className="font-semibold flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    Demographics
                  </h3>
                </CardHeader>
                <CardContent className="pt-6">
                  <Textarea
                    id="demographics"
                    value={formData.demographics || ""}
                    onChange={handleChange}
                    placeholder="Age, location, education, etc."
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Capabilities */}
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
                    <Input
                      id="areas_of_expertise"
                      value={toStringValue(formData.areas_of_expertise)}
                      onChange={handleChange}
                      placeholder="Comma separated values"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="tone_of_voice"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Activity size={14} />
                      Tone of Voice
                    </Label>
                    <Input
                      id="tone_of_voice"
                      value={formData.tone_of_voice || ""}
                      onChange={handleChange}
                      placeholder="e.g. Professional, friendly, expert"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Objectives & Challenges */}
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
                    <Textarea
                      id="goals"
                      value={toStringValue(formData.goals)}
                      onChange={handleChange}
                      placeholder="Primary objectives and goals"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pain_points"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <AlertCircle size={14} className="text-destructive" />
                      Pain Points
                    </Label>
                    <Textarea
                      id="pain_points"
                      value={toStringValue(formData.pain_points)}
                      onChange={handleChange}
                      placeholder="Main challenges and pain points"
                      className="min-h-[80px]"
                    />
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
                  <Textarea
                    id="behaviors"
                    value={toStringValue(formData.behaviors)}
                    onChange={handleChange}
                    placeholder="Key behaviors and habits"
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
