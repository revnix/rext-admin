"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { PermissionGuard } from "@/components/permission/permission-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { toast } from "sonner";
import { useCreatePersona } from "@/hooks/use-personas";
import type { Route } from "next";

const EXPERTISE_SUGGESTIONS = ["SEO", "Digital Marketing", "Content Creation"];

// ── Validation helpers ──────────────────────────────────────────────────────

const CONTAINS_LETTER = /[a-zA-Z]/;
const LINKEDIN_URL_RE =
  /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
const HTTP_URL_RE = /^https?:\/\/.+/;

interface ValidationErrors {
  fullName?: string;
  title?: string;
  bio?: string;
  linkedin?: string;
  avatarUrl?: string;
}

function validateForm(
  formData: {
    fullName: string;
    title: string;
    bio: string;
    linkedin: string;
    avatarUrl: string;
  },
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Full Name — required, min 2 chars, must contain a letter
  if (!formData.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (formData.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  } else if (!CONTAINS_LETTER.test(formData.fullName)) {
    errors.fullName = "Full name must contain at least one letter";
  }

  // Professional Title — required, min 2 chars, must contain a letter
  if (!formData.title.trim()) {
    errors.title = "Professional title is required";
  } else if (formData.title.trim().length < 2) {
    errors.title = "Professional title must be at least 2 characters";
  } else if (!CONTAINS_LETTER.test(formData.title)) {
    errors.title = "Professional title must contain at least one letter";
  }

  // Bio — optional, but if provided must be ≥ 10 chars
  if (formData.bio.trim() && formData.bio.trim().length < 10) {
    errors.bio = "Bio must be at least 10 characters if provided";
  }

  // LinkedIn URL — optional, but if provided must look valid
  if (formData.linkedin.trim() && !LINKEDIN_URL_RE.test(formData.linkedin.trim())) {
    errors.linkedin =
      "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)";
  }

  // Avatar URL — optional, but if provided must be a valid http(s) URL
  if (formData.avatarUrl.trim() && !HTTP_URL_RE.test(formData.avatarUrl.trim())) {
    errors.avatarUrl = "Please enter a valid URL starting with http:// or https://";
  }

  return errors;
}

// ── Tag Input component (reused for multiple fields) ────────────────────────

function TagInput({
  id,
  tags,
  input,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
}: {
  id: string;
  tags: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 min-h-11 bg-background border border-input rounded-xl focus-within:ring-2 focus-within:ring-[#4465FF]/20 focus-within:border-[#4465FF] transition-colors dark:bg-input/30">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 bg-muted hover:bg-muted/80 text-foreground rounded-md px-2 py-0.5 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          <input
            id={id}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              } else if (
                e.key === "Backspace" &&
                !input &&
                tags.length > 0
              ) {
                e.preventDefault();
                onRemove(tags[tags.length - 1]);
              }
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[150px] bg-transparent border-none outline-none focus:ring-0 px-2 py-1 text-sm inline-flex h-8 placeholder:text-muted-foreground"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="bg-background rounded-xl border-border h-auto shrink-0 px-3 sm:px-4"
        >
          Add
        </Button>
      </div>

      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2">
          {suggestions.map((suggestion) => {
            const isSelected =
              input === suggestion || tags.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  if (!tags.includes(suggestion)) {
                    onInputChange("");
                    onAdd();
                    // Directly add the suggestion
                    if (!tags.includes(suggestion)) {
                      onRemove("__noop__"); // no-op, we handle below
                    }
                  } else {
                    onRemove(suggestion);
                  }
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 font-medium
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page component ─────────────────────────────────────────────────────

export default function CreatePersonaPage() {
  const { workspace, workspaceSlug, workspaceId } = useWorkspace();
  const router = useRouter();
  const createPersona = useCreatePersona(workspace?.id || "");
  const { isLoading: isPermLoading } = useWorkspacePermission(
    CONTENT_PERMISSIONS.CREATE,
    workspaceId,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    title: "",
    tone: "",
    bio: "",
    linkedin: "",
    avatarUrl: "",
    demographics: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Tag-based fields
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [painPointsInput, setPainPointsInput] = useState("");
  const [painPointsTags, setPainPointsTags] = useState<string[]>([]);
  const [goalsInput, setGoalsInput] = useState("");
  const [goalsTags, setGoalsTags] = useState<string[]>([]);
  const [behaviorsInput, setBehaviorsInput] = useState("");
  const [behaviorsTags, setBehaviorsTags] = useState<string[]>([]);

  // Generic tag helpers
  const makeAddHandler =
    (input: string, setInput: (v: string) => void, tags: string[], setTags: (t: string[]) => void) =>
    () => {
      const trimmed = input.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setInput("");
      }
    };

  const makeRemoveHandler =
    (tags: string[], setTags: (t: string[]) => void) => (tagToRemove: string) => {
      setTags(tags.filter((t) => t !== tagToRemove));
    };

  const handleAddExpertise = makeAddHandler(expertiseInput, setExpertiseInput, expertiseTags, setExpertiseTags);
  const handleRemoveExpertise = makeRemoveHandler(expertiseTags, setExpertiseTags);
  const handleAddPainPoint = makeAddHandler(painPointsInput, setPainPointsInput, painPointsTags, setPainPointsTags);
  const handleRemovePainPoint = makeRemoveHandler(painPointsTags, setPainPointsTags);
  const handleAddGoal = makeAddHandler(goalsInput, setGoalsInput, goalsTags, setGoalsTags);
  const handleRemoveGoal = makeRemoveHandler(goalsTags, setGoalsTags);
  const handleAddBehavior = makeAddHandler(behaviorsInput, setBehaviorsInput, behaviorsTags, setBehaviorsTags);
  const handleRemoveBehavior = makeRemoveHandler(behaviorsTags, setBehaviorsTags);

  const handleCreate = async () => {
    if (!workspace?.id) return;

    // Validate
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      setIsLoading(true);
      await createPersona.mutateAsync({
        name: formData.fullName,
        description: formData.title,
        full_name: formData.fullName,
        professional_title: formData.title,
        areas_of_expertise: expertiseTags,
        tone_of_voice: formData.tone,
        bio: formData.bio,
        linkedin_url: formData.linkedin,
        avatar_url: formData.avatarUrl || undefined,
        demographics: formData.demographics || undefined,
        pain_points: painPointsTags,
        goals: goalsTags,
        behaviors: behaviorsTags,
      });

      // Success toast is handled by the hook
      router.push(workspaceRoutes.personas(workspaceSlug) as Route);
    } catch {
      // Error toast is handled by the hook
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

  return (
    <PageLayout
      title="Create New Persona"
      description="Define a new author persona to enhance your content's EEAT signals"
      fullWidth
    >
      <PermissionGuard
        permission={CONTENT_PERMISSIONS.CREATE}
        showLoading={false}
        fallback={
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to create personas in this workspace.
              </CardDescription>
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
        <div className="max-w-3xl space-y-8 pb-12">
          <Card className="shadow-sm border border-border bg-card rounded-2xl overflow-hidden">
            <CardContent className="p-4 sm:p-8 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  placeholder="e.g., Dr. Sarah Mitchell"
                  className={`bg-background rounded-xl ${errors.fullName ? "border-destructive" : ""}`}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Professional Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Professional Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: undefined });
                  }}
                  placeholder="e.g., Board-Certified Dermatologist"
                  className={`bg-background rounded-xl ${errors.title ? "border-destructive" : ""}`}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                <Input
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, avatarUrl: e.target.value });
                    if (errors.avatarUrl) setErrors({ ...errors, avatarUrl: undefined });
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className={`bg-background rounded-xl ${errors.avatarUrl ? "border-destructive" : ""}`}
                />
                {errors.avatarUrl && (
                  <p className="text-sm text-destructive">{errors.avatarUrl}</p>
                )}
              </div>

              {/* Areas of Expertise */}
              <div className="space-y-2">
                <Label>Areas of Expertise</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 min-h-11 bg-background border border-input rounded-xl focus-within:ring-2 focus-within:ring-[#4465FF]/20 focus-within:border-[#4465FF] transition-colors dark:bg-input/30">
                    {expertiseTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1 bg-muted hover:bg-muted/80 text-foreground rounded-md px-2 py-0.5 text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpertise(tag)}
                          className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                    <input
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddExpertise();
                        } else if (
                          e.key === "Backspace" &&
                          !expertiseInput &&
                          expertiseTags.length > 0
                        ) {
                          e.preventDefault();
                          handleRemoveExpertise(
                            expertiseTags[expertiseTags.length - 1],
                          );
                        }
                      }}
                      placeholder={
                        expertiseTags.length === 0
                          ? "e.g., Digital Marketing"
                          : ""
                      }
                      className="flex-1 min-w-[150px] bg-transparent border-none outline-none focus:ring-0 px-2 py-1 text-sm inline-flex h-8 placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddExpertise}
                    className="bg-background rounded-xl border-border h-auto shrink-0 px-3 sm:px-4"
                  >
                    Add
                  </Button>
                </div>

                {/* Predefined expertise chips */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {EXPERTISE_SUGGESTIONS.map((suggestion) => {
                    const isSelected =
                      expertiseInput === suggestion ||
                      expertiseTags.includes(suggestion);
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          if (!expertiseTags.includes(suggestion)) {
                            setExpertiseTags([...expertiseTags, suggestion]);
                            setExpertiseInput("");
                          } else {
                            handleRemoveExpertise(suggestion);
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 font-medium
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {suggestion}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone of Voice */}
              <div className="space-y-2">
                <Label htmlFor="tone">Tone of Voice</Label>
                <Input
                  id="tone"
                  value={formData.tone}
                  onChange={(e) =>
                    setFormData({ ...formData, tone: e.target.value })
                  }
                  placeholder="e.g., Professional, Empathetic, Evidence-based"
                  className="bg-background rounded-xl"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => {
                    setFormData({ ...formData, bio: e.target.value });
                    if (errors.bio) setErrors({ ...errors, bio: undefined });
                  }}
                  placeholder="Brief professional biography..."
                  className={`bg-background min-h-[120px] rounded-xl ${errors.bio ? "border-destructive" : ""}`}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio}</p>
                )}
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => {
                    setFormData({ ...formData, linkedin: e.target.value });
                    if (errors.linkedin) setErrors({ ...errors, linkedin: undefined });
                  }}
                  placeholder="https://linkedin.com/in/username"
                  className={`bg-background rounded-xl ${errors.linkedin ? "border-destructive" : ""}`}
                />
                {errors.linkedin && (
                  <p className="text-sm text-destructive">{errors.linkedin}</p>
                )}
              </div>

              {/* ── Additional Persona Fields ────────────────────────────── */}
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Additional Persona Details
                </h3>
                <p className="text-xs text-muted-foreground mb-5">
                  Optionally provide more context about this persona to enhance content targeting.
                </p>

                {/* Demographics */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="demographics">Demographics</Label>
                  <Textarea
                    id="demographics"
                    value={formData.demographics}
                    onChange={(e) =>
                      setFormData({ ...formData, demographics: e.target.value })
                    }
                    placeholder="e.g., 25-40 years old, urban areas, middle to high income"
                    className="bg-background min-h-[80px] rounded-xl"
                  />
                </div>

                {/* Pain Points */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="painPoints">Pain Points</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 min-h-11 bg-background border border-input rounded-xl focus-within:ring-2 focus-within:ring-[#4465FF]/20 focus-within:border-[#4465FF] transition-colors dark:bg-input/30">
                      {painPointsTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1 bg-muted hover:bg-muted/80 text-foreground rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemovePainPoint(tag)}
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                      <input
                        id="painPoints"
                        value={painPointsInput}
                        onChange={(e) => setPainPointsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPainPoint();
                          } else if (
                            e.key === "Backspace" &&
                            !painPointsInput &&
                            painPointsTags.length > 0
                          ) {
                            e.preventDefault();
                            handleRemovePainPoint(
                              painPointsTags[painPointsTags.length - 1],
                            );
                          }
                        }}
                        placeholder={
                          painPointsTags.length === 0
                            ? "e.g., Time constraints, Information overload"
                            : ""
                        }
                        className="flex-1 min-w-[150px] bg-transparent border-none outline-none focus:ring-0 px-2 py-1 text-sm inline-flex h-8 placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPainPoint}
                      className="bg-background rounded-xl border-border h-auto shrink-0 px-3 sm:px-4"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Goals */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor="goals">Goals</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 min-h-11 bg-background border border-input rounded-xl focus-within:ring-2 focus-within:ring-[#4465FF]/20 focus-within:border-[#4465FF] transition-colors dark:bg-input/30">
                      {goalsTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1 bg-muted hover:bg-muted/80 text-foreground rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal(tag)}
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                      <input
                        id="goals"
                        value={goalsInput}
                        onChange={(e) => setGoalsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddGoal();
                          } else if (
                            e.key === "Backspace" &&
                            !goalsInput &&
                            goalsTags.length > 0
                          ) {
                            e.preventDefault();
                            handleRemoveGoal(
                              goalsTags[goalsTags.length - 1],
                            );
                          }
                        }}
                        placeholder={
                          goalsTags.length === 0
                            ? "e.g., Stay competitive, Optimize workflow"
                            : ""
                        }
                        className="flex-1 min-w-[150px] bg-transparent border-none outline-none focus:ring-0 px-2 py-1 text-sm inline-flex h-8 placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddGoal}
                      className="bg-background rounded-xl border-border h-auto shrink-0 px-3 sm:px-4"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Behaviors */}
                <div className="space-y-2">
                  <Label htmlFor="behaviors">Behaviors</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 min-h-11 bg-background border border-input rounded-xl focus-within:ring-2 focus-within:ring-[#4465FF]/20 focus-within:border-[#4465FF] transition-colors dark:bg-input/30">
                      {behaviorsTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1 bg-muted hover:bg-muted/80 text-foreground rounded-md px-2 py-0.5 text-xs font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveBehavior(tag)}
                            className="hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                      <input
                        id="behaviors"
                        value={behaviorsInput}
                        onChange={(e) => setBehaviorsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddBehavior();
                          } else if (
                            e.key === "Backspace" &&
                            !behaviorsInput &&
                            behaviorsTags.length > 0
                          ) {
                            e.preventDefault();
                            handleRemoveBehavior(
                              behaviorsTags[behaviorsTags.length - 1],
                            );
                          }
                        }}
                        placeholder={
                          behaviorsTags.length === 0
                            ? "e.g., Research-driven, Data-oriented"
                            : ""
                        }
                        className="flex-1 min-w-[150px] bg-transparent border-none outline-none focus:ring-0 px-2 py-1 text-sm inline-flex h-8 placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddBehavior}
                      className="bg-background rounded-xl border-border h-auto shrink-0 px-3 sm:px-4"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* EEAT Banner */}
              <div className="bg-amber-50/50 border border-amber-100/60 dark:bg-amber-900/10 dark:border-amber-800/30 rounded-xl p-5 flex gap-3 text-amber-900/80 dark:text-amber-400 text-sm mt-4">
                <Sparkles
                  className="shrink-0 mt-0.5 text-amber-500 fill-amber-200/50 dark:fill-amber-900/20"
                  size={18}
                />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300 text-base">
                    EEAT Optimization
                  </span>
                  <p className="mt-1 leading-relaxed text-amber-800 dark:text-amber-400">
                    This persona will be used to inject authentic experience and
                    expertise into your content, improving trust signals for
                    search engines.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-background rounded-2xl border-border px-6"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6"
                >
                  {isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Create Persona
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </PageLayout>
  );
}
