"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Save,
  Swords,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { PersonaSelection } from "@/components/workspace";
import { usePersonas } from "@/hooks/use-personas";
import {
  validateBrandName,
  validateBrandVoiceItems,
  validateBrandVoiceText,
} from "@/lib/validation/brand-voice-validation";
import type { BrandVoice, Persona } from "@/types/workspace";
import { useSubscriptionStore } from "@/stores/subscription-store";

/**
 * Validation schema for brand voice form
 */
const brandVoiceSchema = z.object({
  brand_name: z
    .string()
    .refine((value) => !validateBrandName(value), {
      message: "Brand name must contain at least one letter",
    })
    .optional(),
  about: z
    .string()
    .refine((value) => !validateBrandVoiceText(value, "About"), {
      message: "About must contain at least one letter",
    })
    .optional(),
  customer_profile: z
    .string()
    .refine((value) => !validateBrandVoiceText(value, "Customer profile"), {
      message: "Customer profile must contain at least one letter",
    })
    .optional(),
  selling_position: z
    .string()
    .refine(
      (value) => !validateBrandVoiceText(value, "Unique selling position"),
      {
        message: "Unique selling position must contain at least one letter",
      },
    )
    .optional(),
  target_audience: z
    .array(z.string())
    .refine((items) => !validateBrandVoiceItems(items, "Target audience"), {
      message: "Target audience entries must each contain at least one letter",
    })
    .optional(),
  brand_voice: z
    .array(z.string())
    .refine(
      (items) => !validateBrandVoiceItems(items, "Voice characteristics"),
      {
        message:
          "Voice characteristics entries must each contain at least one letter",
      },
    )
    .optional(),
  competitors: z
    .array(z.string())
    .refine((items) => !validateBrandVoiceItems(items, "Competitors"), {
      message: "Competitors entries must each contain at least one letter",
    })
    .optional(),
  content_strategy: z
    .array(z.string())
    .refine((items) => !validateBrandVoiceItems(items, "Content strategy"), {
      message: "Content strategy entries must each contain at least one letter",
    })
    .optional(),
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
      selectedPersonaIds?: string[];
      selectedPersonas?: Persona[];
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: activeTab triggers scroll-into-view on tab change
  useEffect(() => {
    const list = tabsListRef.current;
    if (!list) return;
    const activeTrigger = list.querySelector(
      '[data-state="active"]',
    ) as HTMLElement | null;
    if (!activeTrigger) return;
    const scrollLeft =
      activeTrigger.offsetLeft -
      (list.offsetWidth - activeTrigger.offsetWidth) / 2;
    list.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [activeTab]);

  const form = useForm<BrandVoiceFormData>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      brand_name: data.brand_name || "",
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
  // Multi-select state for personas (local only)
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(
    selectedPersonaId ? [selectedPersonaId] : [],
  );
  // Tracks whether the user has manually toggled any persona checkbox, so the
  // single-persona pre-check below never overrides an explicit choice.
  const userTouchedPersonasRef = useRef(false);

  // When the workspace has exactly one persona, the save flow keeps it even if
  // the user never touches the checkbox (sending no selection keeps all
  // personas). Pre-check the box so the display matches what will be saved.
  useEffect(() => {
    if (userTouchedPersonasRef.current) return;
    if (
      personas.length === 1 &&
      personas[0].id &&
      selectedPersonaIds.length === 0
    ) {
      setSelectedPersonaIds([personas[0].id]);
    }
  }, [personas, selectedPersonaIds]);

  // Handle form submission
  const handleSubmit = async (formData: BrandVoiceFormData) => {
    const selectedPersona = personas.find((p) => p.id === selectedPersonaId);
    const selectedPersonasList = personas.filter((p) =>
      (selectedPersonaIds || []).includes(p.id || ""),
    );

    await onSave({
      ...formData,
      selectedPersonaId: selectedPersonaId || undefined,
      selectedPersona: selectedPersona || undefined,
      selectedPersonaIds: selectedPersonaIds?.length
        ? selectedPersonaIds
        : undefined,
      selectedPersonas: selectedPersonasList.length
        ? selectedPersonasList
        : undefined,
    });

    await useSubscriptionStore.getState().fetchSubscription();
  };

  // Array field helpers
  const addItem = (field: keyof BrandVoiceFormData, value: string) => {
    if (!value.trim()) return false;

    const fieldLabels: Partial<Record<keyof BrandVoiceFormData, string>> = {
      target_audience: "Target audience",
      brand_voice: "Voice characteristics",
      content_strategy: "Content strategy",
      competitors: "Competitors",
    };
    const error = validateBrandVoiceItems(
      [value.trim()],
      fieldLabels[field] ?? "This field",
    );
    if (error) {
      toast.error(error);
      return false;
    }

    const currentArray = form.getValues(field) as string[];
    if (!currentArray.includes(value.trim())) {
      form.setValue(field, [...currentArray, value.trim()]);
    }
    return true;
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
    <div className="w-full space-y-8 overflow-x-hidden">
      {/* Brand Voice Form Card */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 w-full overflow-x-hidden"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="w-full"
          >
            {/* Improved Tabs List */}
            <TabsList
              ref={tabsListRef}
              className="w-full bg-input justify-between overflow-x-auto scrollbar-none"
            >
              <TabsTrigger
                value="info"
                className="bg-card flex-1 shrink-0 ml-0 gap-1.5 px-2 sm:px-4 justify-center border border-input disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:border-l-border data-[state=active]:border-t-border data-[state=active]:border-r-border"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Brand Information</span>
              </TabsTrigger>
              <TabsTrigger
                value="voice"
                className="bg-card flex-1 shrink-0 ml-0 gap-1.5 px-2 sm:px-4 justify-center border border-input disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:border-l-border data-[state=active]:border-t-border data-[state=active]:border-r-border"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Brand Voice</span>
              </TabsTrigger>
              <TabsTrigger
                value="strategy"
                className="bg-card flex-1 shrink-0 ml-0 gap-1.5 px-2 sm:px-4 justify-center border border-input disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:border-l-border data-[state=active]:border-t-border data-[state=active]:border-r-border"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Content Strategy</span>
              </TabsTrigger>
              <TabsTrigger
                value="competitors"
                className="bg-card flex-1 shrink-0 ml-0 gap-1.5 px-2 sm:px-4 justify-center border border-input disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:border-l-border data-[state=active]:border-t-border data-[state=active]:border-r-border"
              >
                <Swords className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Competitors</span>
              </TabsTrigger>
              <TabsTrigger
                value="audience"
                className="bg-card flex-1 shrink-0 ml-0 gap-1.5 px-2 sm:px-4 justify-center border border-input disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:border-l-border data-[state=active]:border-t-border data-[state=active]:border-r-border"
              >
                <Target className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Target Audience</span>
              </TabsTrigger>
              <TabsTrigger
                value="personas"
                className="bg-card flex-1 shrink-0 ml-0 gap-1.5 px-2 sm:px-4 justify-center border border-input disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:border-l-border data-[state=active]:border-t-border data-[state=active]:border-r-border"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Personas</span>
              </TabsTrigger>
            </TabsList>
            {/* Brand Information Tab */}
            <TabsContent value="info" className="space-y-6 py-6">
              {/* Brand Name Field */}
              <FormField
                control={form.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Brand Name
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        The actual name of your brand or product, exactly as it
                        should appear in generated content. This is not the same
                        as your workspace name.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Everlane"
                        maxLength={255}
                        className="bg-background/50 border-border focus:bg-background transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* About Field */}
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        About Your Brand
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        A concise overview of what your brand does
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Brief description of your company or brand. Example: We provide enterprise software solutions for data management..."
                        rows={3}
                        maxLength={255}
                        className="resize-none bg-background/50 border-border focus:bg-background transition-colors break-words whitespace-pre-wrap word-break"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer Profile Field */}
              <FormField
                control={form.control}
                name="customer_profile"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Customer Profile{" "}
                        <span className="text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        Details about your target customer demographics and
                        characteristics
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your ideal customer. Example: Mid-size businesses with 50-500 employees..."
                        rows={2}
                        className="resize-none bg-background/50 border-border focus:bg-background transition-colors break-words whitespace-pre-wrap word-break"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selling Position Field */}
              <FormField
                control={form.control}
                name="selling_position"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Unique Selling Position
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        What makes your brand unique in the market
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Your unique value proposition. Example: We offer the fastest deployment time with 99.9% uptime guarantee..."
                        rows={2}
                        className="resize-none bg-background/50 border-border focus:bg-background transition-colors break-words whitespace-pre-wrap word-break"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Brand Voice Tab */}
            <TabsContent value="voice" className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="brand_voice"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Brand Voice Characteristics
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        Words that describe your communication style (e.g.,
                        Professional, Friendly, Technical)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Input Section */}
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
                                  if (addItem("brand_voice", brandVoiceInput)) {
                                    setBrandVoiceInput("");
                                  }
                                }
                              }}
                              placeholder="Type a characteristic and press Enter or click Add"
                              className="bg-background/50 border-border focus:bg-background transition-colors"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (addItem("brand_voice", brandVoiceInput)) {
                                setBrandVoiceInput("");
                              }
                            }}
                            className="font-medium"
                          >
                            Add
                          </Button>
                        </div>

                        {/* Badges Container */}
                        <div className="w-full bg-background/30 border border-border/50 rounded-md p-4 min-h-15 flex flex-wrap items-start gap-2 overflow-y-auto overflow-x-hidden max-h-50">
                          {field.value && field.value.length > 0 ? (
                            field.value.map((item, index) => (
                              <Badge
                                key={item}
                                variant="default"
                                className="gap-2 px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground break-words max-w-full"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem("brand_voice", index)
                                  }
                                  className="ml-0.5 hover:opacity-70 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No characteristics added yet
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Content Strategy Tab */}
            <TabsContent value="strategy" className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="content_strategy"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Content Strategy{" "}
                        <span className="text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        Key themes or pillars for your content (e.g.,
                        Educational, Thought Leadership)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Input Section */}
                        <div className="flex gap-2">
                          <div className="flex-1 min-w-0">
                            <Input
                              value={contentStrategyInput}
                              onChange={(e) =>
                                setContentStrategyInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (
                                    addItem(
                                      "content_strategy",
                                      contentStrategyInput,
                                    )
                                  ) {
                                    setContentStrategyInput("");
                                  }
                                }
                              }}
                              placeholder="Type a content pillar and press Enter or click Add"
                              className="bg-background/50 border-border focus:bg-background transition-colors"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (
                                addItem(
                                  "content_strategy",
                                  contentStrategyInput,
                                )
                              ) {
                                setContentStrategyInput("");
                              }
                            }}
                            className="font-medium"
                          >
                            Add
                          </Button>
                        </div>

                        {/* Badges Container */}
                        <div className="w-full bg-background/30 border border-border/50 rounded-md p-4 min-h-15 flex flex-wrap items-start gap-2 overflow-y-auto overflow-x-hidden max-h-50">
                          {field.value && field.value.length > 0 ? (
                            field.value.map((item, index) => (
                              <Badge
                                key={item}
                                variant="default"
                                className="gap-2 px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground break-words max-w-full"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem("content_strategy", index)
                                  }
                                  className="ml-0.5 hover:opacity-70 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No content pillars added yet
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="competitors"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Competitors{" "}
                        <span className="text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        List your main competitors to help define your market
                        position
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Input Section */}
                        <div className="flex gap-2">
                          <div className="flex-1 min-w-0">
                            <Input
                              value={competitorsInput}
                              onChange={(e) =>
                                setCompetitorsInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (
                                    addItem("competitors", competitorsInput)
                                  ) {
                                    setCompetitorsInput("");
                                  }
                                }
                              }}
                              placeholder="Enter competitor name and press Enter or click Add"
                              className="bg-background/50 border-border focus:bg-background transition-colors"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (addItem("competitors", competitorsInput)) {
                                setCompetitorsInput("");
                              }
                            }}
                            className="font-medium"
                          >
                            Add
                          </Button>
                        </div>

                        {/* Badges Container */}
                        <div className="w-full bg-background/30 border border-border/50 rounded-md p-4 min-h-15 flex flex-wrap items-start gap-2 overflow-y-auto overflow-x-hidden max-h-50">
                          {field.value && field.value.length > 0 ? (
                            field.value.map((item, index) => (
                              <Badge
                                key={item}
                                variant="default"
                                className="gap-2 px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground break-words max-w-full"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem("competitors", index)
                                  }
                                  className="ml-0.5 hover:opacity-70 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No competitors added yet
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Target Audience Tab */}
            <TabsContent value="audience" className="space-y-6 py-6">
              <FormField
                control={form.control}
                name="target_audience"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div>
                      <FormLabel className="text-base font-semibold">
                        Target Audience
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground mt-1">
                        Add one or more audience segments you want to reach
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Input Section */}
                        <div className="flex gap-2">
                          <div className="flex-1 min-w-0">
                            <Input
                              value={targetAudienceInput}
                              onChange={(e) =>
                                setTargetAudienceInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (
                                    addItem(
                                      "target_audience",
                                      targetAudienceInput,
                                    )
                                  ) {
                                    setTargetAudienceInput("");
                                  }
                                }
                              }}
                              placeholder="e.g., Small Business Owners, Startups, Enterprises"
                              className="bg-background/50 border-border focus:bg-background transition-colors"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (
                                addItem("target_audience", targetAudienceInput)
                              ) {
                                setTargetAudienceInput("");
                              }
                            }}
                            className="font-medium"
                          >
                            Add
                          </Button>
                        </div>

                        {/* Badges Container */}
                        <div className="w-full bg-background/30 border border-border/50 rounded-md p-4 min-h-15 flex flex-wrap items-start gap-2 overflow-y-auto overflow-x-hidden max-h-50">
                          {field.value && field.value.length > 0 ? (
                            field.value.map((item, index) => (
                              <Badge
                                key={item}
                                variant="default"
                                className="gap-2 px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground break-words max-w-full"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem("target_audience", index)
                                  }
                                  className="ml-0.5 hover:opacity-70 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No audience segments added yet
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            {/* Personas Tab */}
            <TabsContent value="personas" className="space-y-6 py-6">
              {workspaceId && onPersonaSelect && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/10 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Select Personas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Choose one or more personas to represent your brand voice.
                      Multiple selections are supported.
                    </p>
                  </div>
                  <PersonaSelection
                    personas={personas}
                    selectedPersonaId={selectedPersonaId}
                    selectedPersonaIds={selectedPersonaIds}
                    onSelect={(val) => {
                      userTouchedPersonasRef.current = true;
                      if (Array.isArray(val)) {
                        setSelectedPersonaIds(val);
                        // keep existing single-select callback compatible by
                        // reporting the last selected id
                        const last = val[val.length - 1] || "";
                        onPersonaSelect?.(last);
                      } else {
                        setSelectedPersonaIds(val ? [val] : []);
                        onPersonaSelect?.(val);
                      }
                    }}
                    isLoading={isLoadingPersonas}
                    multiSelect
                  />
                </div>
              )}

              {/* {data.personas && data.personas.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <PersonasGrid personas={data.personas} />
                </div>
              )} */}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-center justify-between pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-border/50 py-4 sm:py-6">
            {/* Navigation Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handlePrev}
                disabled={activeTab === TABS[0]}
                className="flex-1 sm:flex-none gap-2 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleNext}
                disabled={activeTab === TABS[TABS.length - 1]}
                className="flex-1 sm:flex-none gap-2 font-medium transition-all disabled:opacity-50"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Save Button */}
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto min-w-[200px] gap-2 transition-colors bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save & Finish</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
