"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Sparkles,
  Swords,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PersonasGrid } from "@/components/workspace/persona-card";
import { PersonaSelection } from "@/components/workspace/persona-selection";
import { usePersonas } from "@/hooks/use-personas";
import type { BrandVoice, Persona } from "@/types/workspace";

/**
 * Validation schema for brand voice form
 */
const brandVoiceSchema = z.object({
  about: z.string().optional(),
  customer_profile: z.string().optional(),
  selling_position: z.string().optional(),
  target_audience: z.array(z.string()).optional(),
  brand_voice: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  content_strategy: z.array(z.string()).optional(),
});

/**
 * Form tabs order
 */
const TABS = [
  "info",
  "voice",
  "strategy",
  "competitors",
  "audience",
  "personas",
] as const;
type TabValue = (typeof TABS)[number];

type BrandVoiceFormData = z.infer<typeof brandVoiceSchema>;

interface WorkspaceBrandVoiceFormProps {
  workspaceId?: string | null;
  data: Partial<BrandVoice>;
  onSave: (
    data: BrandVoiceFormData & {
      selectedPersonaId?: string;
      selectedPersona?: Persona; // Persona from workspace types
    },
  ) => Promise<void>;
  isLoading?: boolean;
  selectedPersonaId?: string | null;
  onPersonaSelect?: (personaId: string) => void;
}

/**
 * Workspace Brand Voice Edit Form
 *
 * Allows users to review and edit AI-extracted brand voice data
 * after workspace creation completes.
 *
 * Features:
 * - Editable text fields for about, customer_profile, selling_position
 * - Tag-based input for arrays (target_audience, brand_voice, competitors, content_strategy)
 * - Form validation with Zod
 * - Loading states during save
 * - Dynamic persona selection from database
 */
export function WorkspaceBrandVoiceForm({
  workspaceId,
  data,
  onSave,
  isLoading = false,
  selectedPersonaId,
  onPersonaSelect,
}: WorkspaceBrandVoiceFormProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("info");

  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabsListRef.current) {
      const activeTrigger = tabsListRef.current.querySelector(
        '[data-state="active"]',
      ) as HTMLElement;
      if (activeTrigger) {
        activeTrigger.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab]);

  const form = useForm<BrandVoiceFormData>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      about: data.about || "",
      customer_profile: data.customer_profile || "",
      selling_position: data.selling_position || "",
      target_audience: data.target_audience || [],
      brand_voice: data.brand_voice || [],
      competitors: data.competitors || [],
      content_strategy: data.content_strategy || data.content_pillar || [],
    },
  });

  // Fetch personas dynamically from database
  const { data: personasData, isLoading: isLoadingPersonas } = usePersonas(
    workspaceId || null,
  );
  const personas = personasData?.personas || [];

  // Tag input states
  const [targetAudienceInput, setTargetAudienceInput] = useState("");
  const [brandVoiceInput, setBrandVoiceInput] = useState("");
  const [competitorsInput, setCompetitorsInput] = useState("");
  const [contentStrategyInput, setContentStrategyInput] = useState("");

  // Handle form submission
  const handleSubmit = async (formData: BrandVoiceFormData) => {
    const selectedPersona = personas.find((p) => p.id === selectedPersonaId);
    await onSave({
      ...formData,
      selectedPersonaId: selectedPersonaId || undefined,
      selectedPersona: selectedPersona || undefined,
    });
  };

  // Array field helpers
  const addItem = (field: keyof BrandVoiceFormData, value: string) => {
    if (!value.trim()) return;

    const currentArray = form.getValues(field) as string[];
    if (!currentArray.includes(value.trim())) {
      form.setValue(field, [...currentArray, value.trim()]);
    }
  };

  const removeItem = (field: keyof BrandVoiceFormData, index: number) => {
    const currentArray = form.getValues(field) as string[];
    form.setValue(
      field,
      currentArray.filter((_, i) => i !== index),
    );
  };

  const handleNext = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Voice Form Card */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="w-full"
          >
            <TabsList className="mb-8 w-full border-b justify-start overflow-x-auto">
              <TabsTrigger value="info">
                <Building2 className="w-4 h-4" />
                Brand Information
              </TabsTrigger>
              <TabsTrigger value="voice">
                <MessageSquare className="w-4 h-4" />
                Brand Voice
              </TabsTrigger>
              <TabsTrigger value="strategy">
                <BookOpen className="w-4 h-4" />
                Content Strategy
              </TabsTrigger>
              <TabsTrigger value="competitors">
                <Swords className="w-4 h-4" />
                Competitors
              </TabsTrigger>
              <TabsTrigger value="audience">
                <Target className="w-4 h-4" />
                Target Audience
              </TabsTrigger>
              <TabsTrigger value="personas">
                <Users className="w-4 h-4" />
                Personas
              </TabsTrigger>
            </TabsList>

            {/* Brand Information Tab */}
            <TabsContent value="info" className="space-y-6">
              {/* About Field */}
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Your Brand</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of your company or brand"
                        rows={3}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      A concise overview of what your brand does
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Profile Field */}
              <FormField
                control={form.control}
                name="customer_profile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Profile (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your ideal customer"
                        rows={2}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      Details about your target customer demographics and
                      characteristics
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selling Position Field */}
              <FormField
                control={form.control}
                name="selling_position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Position</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Your unique value proposition"
                        rows={2}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      What makes your brand unique in the market
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Brand Voice Tab */}
            <TabsContent value="voice" className="space-y-6">
              <FormField
                control={form.control}
                name="brand_voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Voice Characteristics</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1 min-w-0">
                            <Input
                              value={brandVoiceInput}
                              onChange={(e) =>
                                setBrandVoiceInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addItem("brand_voice", brandVoiceInput);
                                  setBrandVoiceInput("");
                                }
                              }}
                              placeholder="e.g., Professional"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              addItem("brand_voice", brandVoiceInput);
                              setBrandVoiceInput("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((item, index) => (
                            <Badge
                              key={item}
                              variant="default"
                              className="gap-1"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => removeItem("brand_voice", index)}
                                className="ml-1 hover:text-destructive-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Words that describe your communication style
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Content Strategy Tab */}
            <TabsContent value="strategy" className="space-y-6">
              <FormField
                control={form.control}
                name="content_strategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Strategy (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={contentStrategyInput}
                            onChange={(e) =>
                              setContentStrategyInput(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addItem(
                                  "content_strategy",
                                  contentStrategyInput,
                                );
                                setContentStrategyInput("");
                              }
                            }}
                            placeholder="e.g., Educational"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              addItem("content_strategy", contentStrategyInput);
                              setContentStrategyInput("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((item, index) => (
                            <Badge
                              key={item}
                              variant="secondary"
                              className="gap-1"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem("content_strategy", index)
                                }
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Key themes or pillars for your content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="space-y-6">
              <FormField
                control={form.control}
                name="competitors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitors (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={competitorsInput}
                            onChange={(e) =>
                              setCompetitorsInput(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addItem("competitors", competitorsInput);
                                setCompetitorsInput("");
                              }
                            }}
                            placeholder="e.g., Competitor Name"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              addItem("competitors", competitorsInput);
                              setCompetitorsInput("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((item, index) => (
                            <Badge
                              key={item}
                              variant="outline"
                              className="gap-1"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => removeItem("competitors", index)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      List your main competitors
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Target Audience Tab */}
            <TabsContent value="audience" className="space-y-6">
              <FormField
                control={form.control}
                name="target_audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={targetAudienceInput}
                            onChange={(e) =>
                              setTargetAudienceInput(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addItem("target_audience", targetAudienceInput);
                                setTargetAudienceInput("");
                              }
                            }}
                            placeholder="e.g., Small Business Owners"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              addItem("target_audience", targetAudienceInput);
                              setTargetAudienceInput("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value?.map((item, index) => (
                            <Badge
                              key={item}
                              variant="secondary"
                              className="gap-1"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem("target_audience", index)
                                }
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Add one or more audience segments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Personas Tab */}
            <TabsContent value="personas" className="space-y-6">
              {workspaceId && onPersonaSelect && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Select Persona (Optional)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Choose a persona to represent your brand voice
                    </p>
                  </div>
                  <PersonaSelection
                    personas={personas}
                    selectedPersonaId={selectedPersonaId}
                    onSelect={onPersonaSelect}
                    isLoading={isLoadingPersonas}
                  />
                </div>
              )}

              {data.personas && data.personas.length > 0 && (
                <div className="pt-4 border-t">
                  <PersonasGrid personas={data.personas} />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-4 border-t">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handlePrev}
                disabled={activeTab === TABS[0]}
                className="flex-1 sm:flex-none gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleNext}
                disabled={activeTab === TABS[TABS.length - 1]}
                className="flex-1 sm:flex-none gap-2 hover:bg-secondary/80 transition-all font-medium"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto min-w-[180px] gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] bg-primary text-primary-foreground font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  Save & Finish
                  <Sparkles className="h-4 w-4 fill-primary-foreground/20" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
