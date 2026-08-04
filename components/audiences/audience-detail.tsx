"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Users,
  Target,
  Heart,
  Compass,
  Edit2,
  Save,
  Trash2,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import type { Audience } from "@/types/workspace";
import { useState, useEffect } from "react";
import {
  useUpdateAudience,
  useAudience,
  useDeleteAudience,
} from "@/hooks/use-audiences";
import { useWorkspace } from "@/providers/workspace-provider";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useRouter } from "next/navigation";

interface TagListFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  isEditing: boolean;
  badgeVariant?: "secondary" | "outline" | "destructive";
}

function TagListField({
  label,
  values,
  onChange,
  placeholder,
  isEditing,
  badgeVariant = "secondary",
}: TagListFieldProps) {
  const [input, setInput] = useState("");

  const add = () => {
    if (input.trim()) {
      onChange([...values, input.trim()]);
      setInput("");
    }
  };
  const remove = (index: number) => onChange(values.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="!w-10 !h-11 p-0 shrink-0"
              onClick={add}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {values.map((v, i) => (
              <Badge key={v} variant={badgeVariant} className="text-sm px-3 py-1">
                {v}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        values.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {values.map((v) => (
              <Badge key={v} variant={badgeVariant} className="text-sm">
                {v}
              </Badge>
            ))}
          </div>
        )
      )}
    </div>
  );
}

interface AudienceDetailProps {
  audience: Audience;
}

export function AudienceDetail({ audience: initialAudience }: AudienceDetailProps) {
  const { workspace, workspaceSlug } = useWorkspace();
  const router = useRouter();
  const audienceId = initialAudience.id || "";

  const { data: audienceData } = useAudience(workspace?.id || null, audienceId);
  const audience = audienceData?.audience || initialAudience;

  const { hasPermission: canEdit } = useWorkspacePermission(
    CONTENT_PERMISSIONS.UPDATE,
    workspace?.id,
  );
  const { hasPermission: canDelete } = useWorkspacePermission(
    CONTENT_PERMISSIONS.DELETE,
    workspace?.id,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Audience>(audience);

  const updateAudience = useUpdateAudience(workspace?.id || "");
  const deleteAudience = useDeleteAudience(workspace?.id || "");

  useEffect(() => {
    if (audience) {
      setFormData(audience);
    }
  }, [audience]);

  const handleSave = () => {
    if (!workspace?.id || !audience.id) return;

    updateAudience.mutate(
      { audienceId: audience.id, data: formData },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDelete = () => {
    if (!workspace?.id || !audience.id) return;

    deleteAudience.mutate(audience.id, {
      onSuccess: () => router.push(`/w/${workspaceSlug}/audiences`),
    });
  };

  const handleCancel = () => {
    setFormData(audience);
    setIsEditing(false);
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
              disabled={updateAudience.isPending}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="!w-[49%] sm:w-36"
              onClick={handleSave}
              disabled={updateAudience.isPending}
            >
              {updateAudience.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Update Audience
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto justify-between">
            {canDelete ? (
              <ConfirmationDialog
                title="Delete Audience"
                description={`Are you sure you want to delete "${audience.name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="!w-[49%] sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/5"
                  disabled={deleteAudience.isPending}
                >
                  {deleteAudience.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  Delete Audience
                </Button>
              </ConfirmationDialog>
            ) : (
              <LockedFeatureTooltip
                permission={CONTENT_PERMISSIONS.DELETE}
                message="Deleting audiences requires Editor role or above"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="!w-[49%] sm:w-auto text-destructive border-destructive/20"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Audience
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
                Edit Audience
              </Button>
            ) : (
              <LockedFeatureTooltip
                permission={CONTENT_PERMISSIONS.UPDATE}
                message="Editing audiences requires Editor role or above"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="!w-[49%] sm:w-auto border-primary/20 text-primary"
                >
                  <Edit2 size={16} className="mr-2" />
                  Edit Audience
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
                <Users size={18} className="text-primary" />
                Segment Details
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Segment Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Enterprise IT Buyer"
                  />
                ) : (
                  <p className="text-xl font-bold">{audience.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of this segment..."
                    className="min-h-[100px]"
                  />
                ) : (
                  audience.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {audience.description}
                    </p>
                  )
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buying_stage" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Buying Stage
                </Label>
                {isEditing ? (
                  <Input
                    id="buying_stage"
                    value={formData.buying_stage || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buying_stage: e.target.value as Audience["buying_stage"],
                      })
                    }
                    placeholder="awareness, consideration, decision, or retention"
                  />
                ) : (
                  audience.buying_stage && (
                    <Badge variant="outline" className="capitalize">
                      {audience.buying_stage}
                    </Badge>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Compass size={18} className="text-primary" />
                Demographics
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Age Range
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.demographics?.age_range || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          demographics: { ...formData.demographics, age_range: e.target.value },
                        })
                      }
                      placeholder="e.g. 25-40"
                    />
                  ) : (
                    audience.demographics?.age_range && (
                      <p className="text-sm">{audience.demographics.age_range}</p>
                    )
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Seniority
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.demographics?.seniority || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          demographics: { ...formData.demographics, seniority: e.target.value },
                        })
                      }
                      placeholder="e.g. Director+"
                    />
                  ) : (
                    audience.demographics?.seniority && (
                      <p className="text-sm">{audience.demographics.seniority}</p>
                    )
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Company Size
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.demographics?.company_size || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          demographics: { ...formData.demographics, company_size: e.target.value },
                        })
                      }
                      placeholder="e.g. 50-200 employees"
                    />
                  ) : (
                    audience.demographics?.company_size && (
                      <p className="text-sm">{audience.demographics.company_size}</p>
                    )
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Location
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.demographics?.location || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          demographics: { ...formData.demographics, location: e.target.value },
                        })
                      }
                      placeholder="e.g. North America"
                    />
                  ) : (
                    audience.demographics?.location && (
                      <p className="text-sm">{audience.demographics.location}</p>
                    )
                  )}
                </div>
              </div>

              <TagListField
                label="Job Titles"
                values={formData.demographics?.job_titles || []}
                onChange={(job_titles) =>
                  setFormData({
                    ...formData,
                    demographics: { ...formData.demographics, job_titles },
                  })
                }
                placeholder="e.g. VP of Engineering"
                isEditing={isEditing}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Goals &amp; Pain Points
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <TagListField
                label="Goals"
                values={formData.goals || []}
                onChange={(goals) => setFormData({ ...formData, goals })}
                placeholder="Primary objective"
                isEditing={isEditing}
              />
              <TagListField
                label="Pain Points"
                values={formData.pain_points || []}
                onChange={(pain_points) => setFormData({ ...formData, pain_points })}
                placeholder="Key challenge"
                isEditing={isEditing}
              />
              <TagListField
                label="Objections"
                values={formData.objections || []}
                onChange={(objections) => setFormData({ ...formData, objections })}
                placeholder="Common objection to buying"
                isEditing={isEditing}
                badgeVariant="destructive"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart size={18} className="text-primary" />
                Psychographics &amp; Behavior
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <TagListField
                label="Fears"
                values={formData.psychographics?.fears || []}
                onChange={(fears) =>
                  setFormData({
                    ...formData,
                    psychographics: { ...formData.psychographics, fears },
                  })
                }
                placeholder="What they're afraid of"
                isEditing={isEditing}
              />
              <TagListField
                label="Decision Levers"
                values={formData.psychographics?.decision_levers || []}
                onChange={(decision_levers) =>
                  setFormData({
                    ...formData,
                    psychographics: { ...formData.psychographics, decision_levers },
                  })
                }
                placeholder="What tips them into buying"
                isEditing={isEditing}
              />
              <TagListField
                label="Behaviors"
                values={formData.behaviors || []}
                onChange={(behaviors) => setFormData({ ...formData, behaviors })}
                placeholder="Observed behavior pattern"
                isEditing={isEditing}
              />
              <TagListField
                label="Preferred Channels"
                values={formData.preferred_channels || []}
                onChange={(preferred_channels) =>
                  setFormData({ ...formData, preferred_channels })
                }
                placeholder="e.g. LinkedIn, email newsletter"
                isEditing={isEditing}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
