"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import type { BrandVoice } from "@/types/workspace";

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

type BrandVoiceFormData = z.infer<typeof brandVoiceSchema>;

interface WorkspaceBrandVoiceFormProps {
  data: Partial<BrandVoice>;
  onSave: (data: BrandVoiceFormData) => Promise<void>;
  isLoading?: boolean;
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
 */
export function WorkspaceBrandVoiceForm({
  data,
  onSave,
  isLoading = false,
}: WorkspaceBrandVoiceFormProps) {
  const form = useForm<BrandVoiceFormData>({
    resolver: zodResolver(brandVoiceSchema),
    defaultValues: {
      about: data.about || "",
      customer_profile: data.customer_profile || "",
      selling_position: data.selling_position || "",
      target_audience: data.target_audience || [],
      brand_voice: data.brand_voice || [],
      competitors: data.competitors || [],
      content_strategy: data.content_strategy || [],
    },
  });

  // Tag input states
  const [targetAudienceInput, setTargetAudienceInput] = useState("");
  const [brandVoiceInput, setBrandVoiceInput] = useState("");
  const [competitorsInput, setCompetitorsInput] = useState("");
  const [contentStrategyInput, setContentStrategyInput] = useState("");

  // Handle form submission
  const handleSubmit = async (formData: BrandVoiceFormData) => {
    await onSave(formData);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Brand Voice</CardTitle>
        <CardDescription>
          We've analyzed your website and extracted brand information. Review
          and edit as needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
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

            {/* Target Audience Field (Array) */}
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
                    Add one or more audience segments (press Enter or click Add)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Brand Voice Field (Array) */}
            <FormField
              control={form.control}
              name="brand_voice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Voice Characteristics</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={brandVoiceInput}
                          onChange={(e) => setBrandVoiceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addItem("brand_voice", brandVoiceInput);
                              setBrandVoiceInput("");
                            }
                          }}
                          placeholder="e.g., Professional, Innovative"
                        />
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
                          <Badge key={item} variant="default" className="gap-1">
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

            {/* Competitors Field (Array) */}
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
                          onChange={(e) => setCompetitorsInput(e.target.value)}
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
                          <Badge key={item} variant="outline" className="gap-1">
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
                  <FormDescription>List your main competitors</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Strategy Field (Array) */}
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
                              addItem("content_strategy", contentStrategyInput);
                              setContentStrategyInput("");
                            }
                          }}
                          placeholder="e.g., Educational, Thought Leadership"
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
