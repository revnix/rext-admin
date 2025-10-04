"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Edit2, Loader2, Plus, RefreshCw, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/workspace";

interface EditableBrandVoiceCardProps {
  workspace: Workspace;
}

interface BrandVoiceFormData {
  about: string;
  customer_profile: string;
  selling_position: string;
  target_audience: string[];
  brand_voice: string[];
  competitors: string[];
  content_strategy: string[];
}

export function EditableBrandVoiceCard({
  workspace,
}: EditableBrandVoiceCardProps) {
  const queryClient = useQueryClient();
  const brandVoice = workspace.brand_voice;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BrandVoiceFormData>({
    about: brandVoice?.about || "",
    customer_profile: brandVoice?.customer_profile || "",
    selling_position: brandVoice?.selling_position || "",
    target_audience: brandVoice?.target_audience || [],
    brand_voice: brandVoice?.brand_voice || [],
    competitors: brandVoice?.competitors || [],
    content_strategy: brandVoice?.content_strategy || [],
  });

  const { brandVoiceRefresh, refreshBrandVoice } = useWorkspaceStore();

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: BrandVoiceFormData) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/workspace/${workspace.id}/brand-voice`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            about: data.about,
            customer_profile: data.customer_profile,
            selling_position: data.selling_position,
            target_audience: data.target_audience,
            brand_voice: data.brand_voice,
            competitors: data.competitors,
            content_pillar: data.content_strategy,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update brand voice");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] });
      toast.success("Brand voice updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update brand voice");
    },
  });

  const handleRefresh = async () => {
    try {
      await refreshBrandVoice(workspace.id);
      toast.success("Brand voice refreshed successfully");
    } catch (_error) {
      toast.error("Failed to refresh brand voice");
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      about: brandVoice?.about || "",
      customer_profile: brandVoice?.customer_profile || "",
      selling_position: brandVoice?.selling_position || "",
      target_audience: brandVoice?.target_audience || [],
      brand_voice: brandVoice?.brand_voice || [],
      competitors: brandVoice?.competitors || [],
      content_strategy: brandVoice?.content_strategy || [],
    });
    setIsEditing(false);
  };

  const handleArrayItemAdd = (field: keyof BrandVoiceFormData) => {
    const value = (
      document.getElementById(`${field}-input`) as HTMLInputElement
    )?.value;
    if (value?.trim()) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[]), value.trim()],
      });
      (document.getElementById(`${field}-input`) as HTMLInputElement).value =
        "";
    }
  };

  const handleArrayItemRemove = (
    field: keyof BrandVoiceFormData,
    index: number,
  ) => {
    setFormData({
      ...formData,
      [field]: (formData[field] as string[]).filter((_, i) => i !== index),
    });
  };

  // Empty state
  if (!brandVoice) {
    return (
      <DetailCard variant="default" className="border-dashed">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            No Brand Voice Extracted
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Brand voice will be automatically extracted when you add content to
            this workspace.
          </p>
          <Button
            onClick={handleRefresh}
            disabled={brandVoiceRefresh.isRefreshing}
          >
            {brandVoiceRefresh.isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Extract Brand Voice
          </Button>
        </div>
      </DetailCard>
    );
  }

  return (
    <DetailCard variant="highlight">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          title="Brand Voice Profile"
          icon={<Brain className="w-5 h-5" />}
          variant="spacious"
          description="AI-extracted brand characteristics and positioning"
          className="mb-0"
        />
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={brandVoiceRefresh.isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${brandVoiceRefresh.isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* About */}
        <div className="space-y-2">
          <Label htmlFor="about" className="text-sm font-semibold">
            About
          </Label>
          {isEditing ? (
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) =>
                setFormData({ ...formData, about: e.target.value })
              }
              placeholder="Brief description about the brand"
              className="min-h-[80px]"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{brandVoice.about}</p>
          )}
        </div>

        {/* Customer Profile */}
        <div className="space-y-2">
          <Label htmlFor="customer_profile" className="text-sm font-semibold">
            Customer Profile
          </Label>
          {isEditing ? (
            <Textarea
              id="customer_profile"
              value={formData.customer_profile}
              onChange={(e) =>
                setFormData({ ...formData, customer_profile: e.target.value })
              }
              placeholder="Details about target customers"
              className="min-h-[80px]"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {brandVoice.customer_profile}
            </p>
          )}
        </div>

        {/* Selling Position */}
        <div className="space-y-2">
          <Label htmlFor="selling_position" className="text-sm font-semibold">
            Unique Selling Position
          </Label>
          {isEditing ? (
            <Textarea
              id="selling_position"
              value={formData.selling_position}
              onChange={(e) =>
                setFormData({ ...formData, selling_position: e.target.value })
              }
              placeholder="Unique selling proposition"
              className="min-h-[80px]"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {brandVoice.selling_position}
            </p>
          )}
        </div>

        {/* Target Audience */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Target Audience</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="target_audience-input"
                  placeholder="Add audience segment"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayItemAdd("target_audience");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleArrayItemAdd("target_audience")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.target_audience.map((item, index) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        handleArrayItemRemove("target_audience", index)
                      }
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brandVoice.target_audience?.map((item) => (
                <Badge key={item} variant="secondary" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Brand Voice */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Voice Characteristics</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="brand_voice-input"
                  placeholder="Add voice characteristic"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayItemAdd("brand_voice");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleArrayItemAdd("brand_voice")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.brand_voice.map((item, index) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="text-sm px-3 py-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        handleArrayItemRemove("brand_voice", index)
                      }
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brandVoice.brand_voice?.map((item) => (
                <Badge key={item} variant="outline" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content Strategy */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Content Strategy</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="content_strategy-input"
                  placeholder="Add content pillar"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayItemAdd("content_strategy");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleArrayItemAdd("content_strategy")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.content_strategy.map((item, index) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        handleArrayItemRemove("content_strategy", index)
                      }
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brandVoice.content_strategy?.map((item) => (
                <Badge key={item} variant="secondary" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Competitors */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Competitors</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="competitors-input"
                  placeholder="Add competitor"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayItemAdd("competitors");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleArrayItemAdd("competitors")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.competitors.map((item, index) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() =>
                        handleArrayItemRemove("competitors", index)
                      }
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {brandVoice.competitors?.join(" • ")}
            </div>
          )}
        </div>
      </div>
    </DetailCard>
  );
}
