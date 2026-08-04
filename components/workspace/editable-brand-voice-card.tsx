"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Edit2, Loader2, Plus, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";
import { BrandVoiceRefreshControl } from "@/components/workspace";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Workspace } from "@/types/workspace";

interface EditableBrandVoiceCardProps {
  workspace: Workspace;
  readOnly?: boolean;
}

interface PreferredTermRow {
  term: string;
  use_instead_of: string;
}

interface BrandVoiceFormData {
  brand_name: string;
  about: string;
  customer_profile: string;
  selling_position: string;
  target_audience: string[];
  brand_voice: string[];
  competitors: string[];
  content_strategy: string[];
  formality_level: string;
  point_of_view: string;
  cta_style: string;
  banned_terms: string[];
  preferred_terms: PreferredTermRow[];
}

const toFormData = (voice?: Workspace["brand_voice"]): BrandVoiceFormData => ({
  brand_name: voice?.brand_name ?? "",
  about: voice?.about ?? "",
  customer_profile: voice?.customer_profile ?? "",
  selling_position: voice?.selling_position ?? "",
  target_audience: voice?.target_audience ?? [],
  brand_voice: voice?.brand_voice ?? [],
  competitors: voice?.competitors ?? [],
  content_strategy: voice?.content_strategy ?? voice?.content_pillar ?? [],
  formality_level: voice?.formality_level ?? "",
  point_of_view: voice?.point_of_view ?? "",
  cta_style: voice?.cta_style ?? "",
  banned_terms: voice?.banned_terms ?? [],
  preferred_terms: voice?.preferred_terms ?? [],
});

export function EditableBrandVoiceCard({
  workspace,
  readOnly = false,
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
        brand_name: data.brand_name,
        about: data.about,
        customer_profile: data.customer_profile,
        selling_position: data.selling_position,
        target_audience: data.target_audience,
        brand_voice: data.brand_voice,
        competitors: data.competitors,
        content_strategy: data.content_strategy,
        formality_level: data.formality_level || null,
        point_of_view: data.point_of_view || null,
        cta_style: data.cta_style || null,
        banned_terms: data.banned_terms,
        preferred_terms: data.preferred_terms,
      });
    },
    onSuccess: (response) => {
      const updated = response.brand_voice;
      setFormData(toFormData(updated));
      // Invalidate both ID and slug based queries to ensure UI updates regardless of which was used as the key
      queryClient.invalidateQueries({ queryKey: ["workspace", workspace.id] });
      queryClient.invalidateQueries({
        queryKey: ["workspace", workspace.slug],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspaces", "brand-voice", workspace.id],
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

  const handlePreferredTermAdd = () => {
    const termInput = document.getElementById(
      "preferred_term-input",
    ) as HTMLInputElement | null;
    const substituteInput = document.getElementById(
      "preferred_term_substitute-input",
    ) as HTMLInputElement | null;
    const term = termInput?.value.trim();
    const use_instead_of = substituteInput?.value.trim();
    if (term && use_instead_of) {
      setFormData((prev) => ({
        ...prev,
        preferred_terms: [...prev.preferred_terms, { term, use_instead_of }],
      }));
      if (termInput) termInput.value = "";
      if (substituteInput) substituteInput.value = "";
    }
  };

  const handlePreferredTermRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      preferred_terms: prev.preferred_terms.filter((_, i) => i !== index),
    }));
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
            <p className="mt-4 text-sm text-destructive">
              {brandVoiceRefresh.refreshError}
            </p>
          )}
        </div>
      </DetailCard>
    );
  }

  return (
    <DetailCard variant="highlight">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <SectionHeader
          title="Brand Voice Profile"
          icon={<Brain className="w-5 h-5" />}
          variant="spacious"
          description="AI-extracted brand characteristics and positioning"
          className="mb-0"
        />
        {!readOnly && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto"
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
                <BrandVoiceRefreshControl
                  workspaceId={workspace.id}
                  buttonVariant="outline"
                  buttonSize="sm"
                  buttonClassName="w-full sm:w-auto"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </span>
                </BrandVoiceRefreshControl>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {brandVoiceRefresh.refreshError && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {brandVoiceRefresh.refreshError}
        </div>
      )}

      <div className="space-y-6">
        {/* Brand Name */}
        <div className="space-y-2">
          <Label htmlFor="brand_name" className="text-sm font-semibold">
            Brand Name
          </Label>
          {isEditing ? (
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) =>
                setFormData({ ...formData, brand_name: e.target.value })
              }
              placeholder="The actual brand/product name (not the workspace name)"
            />
          ) : (
            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap word-break max-w-full">
              {brandVoice.brand_name || <span className="italic">Not set</span>}
            </p>
          )}
        </div>

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
            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap word-break max-w-full">
              {brandVoice.about}
            </p>
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
            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap word-break max-w-full">
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
            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap word-break max-w-full">
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
                  className="!w-10 !h-11 p-0"
                  onClick={() => handleArrayItemAdd("target_audience")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
                {formData.target_audience.map((item, index) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-sm px-3 py-1 break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
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
            <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
              {brandVoice.target_audience?.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="text-sm break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
                >
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
                  className="!w-10 !h-11 p-0"
                  onClick={() => handleArrayItemAdd("brand_voice")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
                {formData.brand_voice.map((item, index) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="text-sm px-3 py-1 break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
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
            <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
              {brandVoice.brand_voice?.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="text-sm break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
                >
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
                  className="!w-10 !h-11 p-0"
                  onClick={() => handleArrayItemAdd("content_strategy")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
                {formData.content_strategy.map((item, index) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-sm px-3 py-1 break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
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
            <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
              {brandVoice.content_strategy?.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="text-sm break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
                >
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
                  className="!w-10 !h-11 p-0"
                  onClick={() => handleArrayItemAdd("competitors")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
                {formData.competitors.map((item, index) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-sm px-3 py-1 break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
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
            <div className="text-sm text-muted-foreground break-words whitespace-pre-wrap word-break max-w-full">
              {brandVoice.competitors?.join(" • ")}
            </div>
          )}
        </div>

        {/* Formality Level & Point of View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formality_level" className="text-sm font-semibold">
              Formality Level
            </Label>
            {isEditing ? (
              <Input
                id="formality_level"
                value={formData.formality_level}
                onChange={(e) =>
                  setFormData({ ...formData, formality_level: e.target.value })
                }
                placeholder="very_casual, casual, neutral, formal, very_formal"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {brandVoice.formality_level?.replace(/_/g, " ") || (
                  <span className="italic">Not set</span>
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="point_of_view" className="text-sm font-semibold">
              Point of View
            </Label>
            {isEditing ? (
              <Input
                id="point_of_view"
                value={formData.point_of_view}
                onChange={(e) =>
                  setFormData({ ...formData, point_of_view: e.target.value })
                }
                placeholder="first_singular, first_plural, second, third"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {brandVoice.point_of_view?.replace(/_/g, " ") || (
                  <span className="italic">Not set</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* CTA Style */}
        <div className="space-y-2">
          <Label htmlFor="cta_style" className="text-sm font-semibold">
            Call-to-Action Style
          </Label>
          {isEditing ? (
            <Textarea
              id="cta_style"
              value={formData.cta_style}
              onChange={(e) =>
                setFormData({ ...formData, cta_style: e.target.value })
              }
              placeholder="How the brand phrases calls-to-action"
              className="min-h-[60px]"
            />
          ) : (
            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap word-break max-w-full">
              {brandVoice.cta_style || <span className="italic">Not set</span>}
            </p>
          )}
        </div>

        {/* Banned Terms */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Banned Words &amp; Phrases
          </Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="banned_terms-input"
                  placeholder="Add a word or phrase to avoid"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleArrayItemAdd("banned_terms");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="!w-10 !h-11 p-0"
                  onClick={() => handleArrayItemAdd("banned_terms")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
                {formData.banned_terms.map((item, index) => (
                  <Badge
                    key={item}
                    variant="destructive"
                    className="text-sm px-3 py-1 break-inside-avoid whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleArrayItemRemove("banned_terms", index)}
                      className="ml-2 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 overflow-x-hidden overflow-y-auto max-h-[300px] max-w-full pb-2">
              {brandVoice.banned_terms?.map((item) => (
                <Badge key={item} variant="destructive" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Terms */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Preferred Vocabulary</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input id="preferred_term-input" placeholder="Say this…" />
                <Input
                  id="preferred_term_substitute-input"
                  placeholder="…not this"
                />
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 !h-11 px-4"
                  onClick={handlePreferredTermAdd}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-w-full pb-2">
                {formData.preferred_terms.map((item, index) => (
                  <Badge
                    key={`${item.term}-${item.use_instead_of}`}
                    variant="secondary"
                    className="text-sm px-3 py-1 flex-shrink-0"
                  >
                    "{item.term}" not "{item.use_instead_of}"
                    <button
                      type="button"
                      onClick={() => handlePreferredTermRemove(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-w-full pb-2">
              {brandVoice.preferred_terms?.map((item) => (
                <Badge
                  key={`${item.term}-${item.use_instead_of}`}
                  variant="secondary"
                  className="text-sm"
                >
                  "{item.term}" not "{item.use_instead_of}"
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Website Type (read-only classification) */}
        {brandVoice.website_type && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Website Type</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm capitalize">
                {brandVoice.website_type.replace(/_/g, " ")}
              </Badge>
              {brandVoice.website_type_confidence != null && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(brandVoice.website_type_confidence * 100)}%
                  confidence
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </DetailCard>
  );
}
