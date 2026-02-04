"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Edit2, Loader2, Plus, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// UI Components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandVoiceRefreshControl } from "@/components/workspace/brand-voice-refresh-control";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/stores/workspace";
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

const toFormData = (voice?: Workspace["brand_voice"]): BrandVoiceFormData => ({
  about: voice?.about ?? "",
  customer_profile: voice?.customer_profile ?? "",
  selling_position: voice?.selling_position ?? "",
  target_audience: voice?.target_audience ?? [],
  brand_voice: voice?.brand_voice ?? [],
  competitors: voice?.competitors ?? [],
  content_strategy: voice?.content_strategy ?? voice?.content_pillar ?? [],
});

export function EditableBrandVoiceCard({
  workspace,
}: EditableBrandVoiceCardProps) {
  const queryClient = useQueryClient();
  const brandVoice = workspace.brand_voice;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BrandVoiceFormData>(() =>
    toFormData(brandVoice),
  );

  const brandVoiceRefresh = useWorkspaceStore(
    (state) => state.brandVoiceRefresh,
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: BrandVoiceFormData) => {
      return apiClient.workspaces.updateBrandVoice(workspace.id, {
        about: data.about,
        customer_profile: data.customer_profile,
        selling_position: data.selling_position,
        target_audience: data.target_audience,
        brand_voice: data.brand_voice,
        competitors: data.competitors,
        content_strategy: data.content_strategy,
      });
    },
    onSuccess: (response) => {
      const updated = response.brand_voice;
      setFormData(toFormData(updated));
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] });
      queryClient.invalidateQueries({
        queryKey: ["workspace", workspace.slug],
      });
      toast.success("Brand voice updated successfully");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update brand voice");
    },
  });

  useEffect(() => {
    if (!isEditing) {
      setFormData(toFormData(brandVoice));
    }
  }, [brandVoice, isEditing]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(toFormData(brandVoice));
    setIsEditing(false);
  };

  const handleArrayItemAdd = (field: keyof BrandVoiceFormData) => {
    const inputId = `${field}-input`;
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    const value = inputElement?.value;

    if (value?.trim()) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[]), value.trim()],
      });
      inputElement.value = "";
      inputElement.focus();
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6 ring-1 ring-border">
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2 text-foreground">
            No Brand Voice Extracted
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-8">
            Brand voice will be automatically extracted from your content, or
            you can start fresh by extracting it now.
          </p>
          <BrandVoiceRefreshControl
            workspaceId={workspace.id}
            buttonVariant="default"
            buttonSize="default"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Extract Brand Voice</span>
            </span>
          </BrandVoiceRefreshControl>
          {brandVoiceRefresh.refreshError && (
            <p className="mt-4 text-sm text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-md">
              {brandVoiceRefresh.refreshError}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Main Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Brand Voice Profile</h3>
          <p className="text-sm text-muted-foreground">
            AI-extracted brand characteristics and positioning
          </p>
        </div>
        <div className="flex items-center gap-3">
          {brandVoiceRefresh.refreshError && (
            <span className="text-sm text-destructive bg-destructive/10 px-3 py-1 rounded-md">
              {brandVoiceRefresh.refreshError}
            </span>
          )}

          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
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
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <BrandVoiceRefreshControl
                workspaceId={workspace.id}
                buttonVariant="outline"
                buttonSize="sm"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Analysis</span>
                </span>
              </BrandVoiceRefreshControl>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base uppercase text-muted-foreground font-medium">
              About the Brand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              {isEditing ? (
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                  placeholder="Brief description about the brand..."
                  className="min-h-[100px] resize-none"
                />
              ) : (
                <p className="text-base leading-relaxed">
                  {brandVoice.about || "No description available."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base uppercase text-muted-foreground font-medium block">
                Unique Selling Position
              </Label>
              {isEditing ? (
                <Textarea
                  id="selling_position"
                  value={formData.selling_position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      selling_position: e.target.value,
                    })
                  }
                  placeholder="What makes this brand unique..."
                  className="min-h-[80px] resize-none"
                />
              ) : (
                <p className="text-base leading-relaxed text-muted-foreground">
                  {brandVoice.selling_position || "No USP defined."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  id="customer_profile"
                  value={formData.customer_profile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_profile: e.target.value,
                    })
                  }
                  placeholder="Target customer details..."
                  className="min-h-[150px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {brandVoice.customer_profile ||
                    "No customer profile defined."}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Voice Characteristics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  Voice Characteristics
                </CardTitle>
                {!isEditing && (
                  <Badge variant="secondary" className="font-normal">
                    {brandVoice.brand_voice?.length || 0}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="brand_voice-input"
                        placeholder="Add characteristic..."
                        className="h-8 text-sm"
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
                        variant="outline"
                        onClick={() => handleArrayItemAdd("brand_voice")}
                        className="h-8 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.brand_voice.map((item, index) => (
                        <Badge key={`bv-${item}`} variant="secondary">
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              handleArrayItemRemove("brand_voice", index)
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brandVoice.brand_voice?.length ? (
                      brandVoice.brand_voice.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 border-transparent"
                        >
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        None defined
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Target Audience</CardTitle>
                {!isEditing && (
                  <Badge variant="secondary" className="font-normal">
                    {brandVoice.target_audience?.length || 0}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="target_audience-input"
                        placeholder="Add audience..."
                        className="h-8 text-sm"
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
                        variant="outline"
                        onClick={() => handleArrayItemAdd("target_audience")}
                        className="h-8 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.target_audience.map((item, index) => (
                        <Badge key={`ta-${item}`} variant="secondary">
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              handleArrayItemRemove("target_audience", index)
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brandVoice.target_audience?.length ? (
                      brandVoice.target_audience.map((item) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        None defined
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Strategy */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Content Strategy</CardTitle>
                {!isEditing && (
                  <Badge variant="secondary" className="font-normal">
                    {brandVoice.content_strategy?.length || 0}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="content_strategy-input"
                        placeholder="Add strategy..."
                        className="h-8 text-sm"
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
                        variant="outline"
                        onClick={() => handleArrayItemAdd("content_strategy")}
                        className="h-8 px-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.content_strategy.map((item, index) => (
                        <Badge key={`cs-${item}`} variant="secondary">
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              handleArrayItemRemove("content_strategy", index)
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brandVoice.content_strategy?.length ? (
                      brandVoice.content_strategy.map((item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 border-transparent"
                        >
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        None defined
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Competitors</CardTitle>
            <CardDescription>
              Key market rivals identified for this brand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex gap-2 max-w-sm">
                  <Input
                    id="competitors-input"
                    placeholder="Add competitor..."
                    className="h-8 text-sm"
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
                    variant="outline"
                    onClick={() => handleArrayItemAdd("competitors")}
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.competitors.map((item, index) => (
                    <Badge key={`comp-${item}`} variant="outline">
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          handleArrayItemRemove("competitors", index)
                        }
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {brandVoice.competitors?.length ? (
                  brandVoice.competitors.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    No competitors listed.
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
