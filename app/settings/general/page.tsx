"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";

const preferencesSchema = z.object({
  date_format: z.enum(["iso", "us", "eu", "relative"]),
  time_format: z.enum(["24h", "12h"]),
  items_per_page: z.number().min(10).max(100),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export default function GeneralSettingsPage() {
  const queryClient = useQueryClient();

  // Fetch preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => apiClient.preferences.get(),
  });

  // Initialize form with default values
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      date_format: "iso",
      time_format: "24h",
      items_per_page: 25,
    },
    values: preferences
      ? {
          date_format: preferences.date_format as
            | "iso"
            | "us"
            | "eu"
            | "relative",
          time_format: preferences.time_format as "24h" | "12h",
          items_per_page: preferences.items_per_page,
        }
      : undefined,
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (data: PreferencesFormValues) =>
      apiClient.preferences.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      toast.success("Preferences saved successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to save preferences", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: PreferencesFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            General Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure your preferences, appearance, and display options
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            General Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure your preferences, appearance, and display options
          </p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load preferences. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure your preferences, appearance, and display options
        </p>
      </div>

      {/* Theme Selector - Not part of backend form, saves directly to localStorage/theme provider */}
      <Card>
        <CardContent className="p-6">
          <ThemeSelector />
        </CardContent>
      </Card>

      <Separator />

      {/* Backend Preferences Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-semibold">Display Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize how information is displayed
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="date_format"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 gap-6 items-center space-y-0">
                      <FormLabel>Date Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl className="col-span-2">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="iso">
                            YYYY-MM-DD (ISO 8601)
                          </SelectItem>
                          <SelectItem value="us">
                            MM/DD/YYYY (US Format)
                          </SelectItem>
                          <SelectItem value="eu">
                            DD/MM/YYYY (European Format)
                          </SelectItem>
                          <SelectItem value="relative">
                            Relative (2 days ago)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time_format"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 gap-6 items-center space-y-0">
                      <FormLabel>Time Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl className="col-span-2">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="24h">24-hour</SelectItem>
                          <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="items_per_page"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 gap-6 items-center space-y-0">
                      <FormLabel>Items Per Page</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value, 10))
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl className="col-span-2">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="col-span-3 col-start-2 !mt-0">
                        Default number of items to display in lists
                      </FormDescription>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
