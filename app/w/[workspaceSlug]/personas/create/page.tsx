"use client";

import { PageLayout } from "@/components/page-layout";
import { useWorkspace } from "@/providers/workspace-provider";
import { workspaceRoutes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePersonaPage() {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();

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

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    {
      label: workspace?.title || "...",
      href: workspaceRoutes.root(workspaceSlug),
    },
    {
      label: "Persona Forge",
      href: workspaceRoutes.personas(workspaceSlug),
    },
    { label: "Create New" },
  ];

  return (
    <PageLayout
      title="Create New Persona"
      description="Define a new author persona to enhance your content's EEAT signals"
      breadcrumbs={breadcrumbs}
      fullWidth
    >
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <Card className="shadow-none border-0 bg-transparent">
          <CardContent className="p-0 space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g., Dr. Sarah Mitchell"
                className="bg-white"
              />
            </div>

            {/* Professional Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Board-Certified Dermatologist"
                className="bg-white"
              />
            </div>

            {/* Areas of Expertise */}
            <div className="space-y-2">
              <Label>Areas of Expertise</Label>
              <div className="flex gap-2">
                <Input
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddExpertise();
                    }
                  }}
                  placeholder="Add expertise tag"
                  className="bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddExpertise}
                  className="bg-white"
                >
                  Add
                </Button>
              </div>

              {expertiseTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 p-1">
                  {expertiseTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(tag)}
                        className="hover:bg-slate-300 rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tone of Voice */}
            <div className="space-y-2">
              <Label htmlFor="tone">Tone of Voice</Label>
              <Input
                id="tone"
                placeholder="e.g., Professional, Empathetic, Evidence-based"
                className="bg-white"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief professional biography..."
                className="bg-white min-h-[120px]"
              />
            </div>

            {/* LinkedIn URL */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/username"
                className="bg-white"
              />
            </div>

            {/* EEAT Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3 text-amber-900/80 text-sm mt-2">
              <Sparkles className="shrink-0 mt-0.5 text-amber-500" size={16} />
              <div>
                <span className="font-semibold text-amber-900">
                  EEAT Optimization
                </span>
                <p className="mt-1">
                  This persona will be used to inject authentic experience and
                  expertise into your content, improving trust signals for
                  search engines.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="bg-white"
              >
                Cancel
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus size={16} className="mr-2" />
                Create Persona
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
