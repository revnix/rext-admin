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
} from "lucide-react";
import type { Persona } from "@/types/workspace";
import type { Route } from "next";
import { useState, useEffect } from "react";
import {
  useUpdatePersona,
  usePersona,
  useDeletePersona,
} from "@/hooks/use-personas";
import { useWorkspace } from "@/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PersonaDetailProps {
  persona: Persona;
}

export function PersonaDetail({ persona: initialPersona }: PersonaDetailProps) {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();
  const personaId = initialPersona.id || "";

  // Fetch the latest persona data directly to ensure synchronization
  const { data: personaData } = usePersona(workspace?.id || null, personaId);
  const persona = personaData?.persona || initialPersona;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Persona>(persona);

  const updatePersona = useUpdatePersona(workspace?.id || "");
  const deletePersona = useDeletePersona(workspace?.id || "");

  useEffect(() => {
    if (persona) {
      setFormData(persona);
    }
  }, [persona]);

  const handleSave = () => {
    if (!workspace?.id || !persona.id) return;

    updatePersona.mutate(
      {
        personaId: persona.id,
        data: formData,
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
      <div className="flex justify-end">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={updatePersona.isPending}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
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
          <div className="flex gap-2">
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
                className="text-destructive border-destructive/20 hover:bg-destructive/5"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Persona
            </Button>
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
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 rounded-xl shadow-md border border-border/50">
                  <AvatarImage
                    src={persona.avatar_url || ""}
                    alt={`${persona.name}'s avatar`}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xl">
                    {persona.name
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
                  <p className="text-xl font-bold">{persona.name}</p>
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
                    value={formData.areas_of_expertise || ""}
                    onChange={handleChange}
                    placeholder="Comma separated values"
                  />
                ) : (
                  persona.areas_of_expertise && (
                    <div className="flex flex-wrap gap-2">
                      {persona.areas_of_expertise.split(",").map((area) => (
                        <Badge
                          key={area.trim()}
                          variant="secondary"
                          className="px-3 py-1 text-sm"
                        >
                          {area.trim()}
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
                    value={formData.goals || ""}
                    onChange={handleChange}
                    placeholder="Primary objectives and goals"
                    className="min-h-[80px]"
                  />
                ) : (
                  persona.goals && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {persona.goals}
                    </p>
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
                    value={formData.pain_points || ""}
                    onChange={handleChange}
                    placeholder="Main challenges and pain points"
                    className="min-h-[80px]"
                  />
                ) : (
                  persona.pain_points && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {persona.pain_points}
                    </p>
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
                  value={formData.behaviors || ""}
                  onChange={handleChange}
                  placeholder="Key behaviors and habits"
                  className="min-h-[100px]"
                />
              ) : (
                persona.behaviors && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {persona.behaviors}
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
