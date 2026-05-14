"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UserPreferences } from "@/lib/api-client/settings";
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
import { preferencesQueries } from "@/lib/query-keys";

const preferencesSchema = z.object({
  date_format: z.enum(["iso", "us", "eu", "relative"]),
  time_format: z.enum(["24h", "12h"]),
  items_per_page: z.number().min(10).max(100),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

/**
 * DisplayPreferencesSection Component (Container)
 *
 * Handles data fetching and loading states for display preferences.
 */
export function DisplayPreferencesSection() {
  // Fetch preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    ...preferencesQueries.detail(),
    throwOnError: true,
    select: (data: UserPreferences) => {
      // API client already returns a clean preferences object.
      const raw = data || {};

      // Strict mapping to form values with defaults
      return {
        date_format:
          raw.date_format === "us" ||
          raw.date_format === "eu" ||
          raw.date_format === "iso" ||
          raw.date_format === "relative"
            ? (raw.date_format as PreferencesFormValues["date_format"])
            : "iso",
        time_format:
          raw.time_format === "24h" || raw.time_format === "12h"
            ? (raw.time_format as PreferencesFormValues["time_format"])
            : "24h",
        items_per_page:
          typeof raw.items_per_page === "number" && raw.items_per_page > 0
            ? raw.items_per_page
            : 25,
      };
    },
  });

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize how information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load preferences. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Pass loaded preferences to the form component.
  // This ensures the form is initialized with actual data on its very first mount.
  return <DisplayPreferencesForm initialPreferences={preferences} />;
}

/**
 * DisplayPreferencesForm Component (Presenter)
 *
 * Handles form state and submission for display preferences.
 */
function DisplayPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: PreferencesFormValues;
}) {
  const queryClient = useQueryClient();

  // Initialize form with API data as defaultValues.
  // Since this component only mounts when data is ready, the form is perfectly initialized.
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: initialPreferences,
    // Keep values sync in case of background refetches
    values: initialPreferences,
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (data: PreferencesFormValues) =>
      apiClient.preferences.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: preferencesQueries.detail().queryKey,
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Preferences</CardTitle>
        <CardDescription>
          Customize how information is displayed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selector - Saves directly to localStorage/theme provider */}
        <ThemeSelector />

        <Separator />

        {/* Backend Preferences Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6 max-w-2xl">
              <FormField
                control={form.control}
                name="date_format"
                render={({ field }) => (
                  <FormItem className="grid xl:grid-cols-3 gap-6 items-center space-y-0">
                    <FormLabel>Date Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="col-span-2">
                        <SelectTrigger>
                          <SelectValue placeholder="Select date format" />
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
                  <FormItem className="grid xl:grid-cols-3 gap-6 items-center space-y-0">
                    <FormLabel>Time Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="col-span-2">
                        <SelectTrigger>
                          <SelectValue placeholder="Select time format" />
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
                  <FormItem className="grid xl:grid-cols-3 gap-6 items-center space-y-0">
                    <FormLabel>Items Per Page</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(parseInt(value, 10))
                      }
                      value={field.value?.toString()}
                    >
                      <FormControl className="col-span-3 justify-self-end">
                        <SelectTrigger>
                          <SelectValue placeholder="Select item count" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="col-span-3 col-start-1 ms-auto -mt-4">
                      Default number of items to display in lists
                    </FormDescription>
                    <FormMessage className="col-span-3 col-start-2" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={updateMutation.isPending}
              >
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
      </CardContent>
    </Card>
  );
}
