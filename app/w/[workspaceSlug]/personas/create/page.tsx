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
  });

  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);

  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      setExpertiseTags([...expertiseTags, expertiseInput.trim()]);
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (tagToRemove: string) => {
    setExpertiseTags(expertiseTags.filter((tag) => tag !== tagToRemove));
  };

  const handleCreate = async () => {
    if (!workspace?.id) return;
    if (!formData.fullName || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      await createPersona.mutateAsync({
        name: formData.fullName, // Using full name as the internal name
        description: formData.title, // Using title as description
        full_name: formData.fullName,
        professional_title: formData.title,
        areas_of_expertise: expertiseTags.join(", "),
        tone_of_voice: formData.tone,
        bio: formData.bio,
        linkedin_url: formData.linkedin,
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
            <CardContent className="p-8 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="e.g., Dr. Sarah Mitchell"
                  className="bg-background rounded-xl"
                />
              </div>

              {/* Professional Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Professional Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Board-Certified Dermatologist"
                  className="bg-background rounded-xl"
                />
              </div>

              {/* Areas of Expertise */}
              <div className="space-y-2">
                <Label>Areas of Expertise</Label>
                <div className="flex gap-2">
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
                    className="bg-background rounded-xl border-border h-auto shrink-0"
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
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Brief professional biography..."
                  className="bg-background min-h-[120px] rounded-xl"
                />
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/username"
                  className="bg-background rounded-xl"
                />
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
