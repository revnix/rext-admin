"use client";

import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure global application settings, preferences, and system-wide
          options
        </p>
      </div>

      <div className="space-y-8">
        {/* Organization Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Organization</h3>
            <p className="text-sm text-muted-foreground">
              Basic information about your organization.
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-3 gap-6 items-center">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="Enter organization name"
                    defaultValue="WREXT Inc."
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-6 items-start">
                  <Label htmlFor="org-description" className="pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="org-description"
                    placeholder="Brief description of your organization"
                    defaultValue="AI-powered content creation and workflow automation platform"
                    rows={3}
                    className="col-span-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Preferences Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">System Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Configure global system behavior and default settings.
            </p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-3 gap-6 items-center">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger className="col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">
                        UTC (Coordinated Universal Time)
                      </SelectItem>
                      <SelectItem value="est">
                        EST (Eastern Standard Time)
                      </SelectItem>
                      <SelectItem value="pst">
                        PST (Pacific Standard Time)
                      </SelectItem>
                      <SelectItem value="cet">
                        CET (Central European Time)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-6 items-center">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select defaultValue="iso">
                    <SelectTrigger className="col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso">YYYY-MM-DD (ISO 8601)</SelectItem>
                      <SelectItem value="us">MM/DD/YYYY (US Format)</SelectItem>
                      <SelectItem value="eu">
                        DD/MM/YYYY (European Format)
                      </SelectItem>
                      <SelectItem value="relative">
                        Relative (2 days ago)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button size="lg">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
