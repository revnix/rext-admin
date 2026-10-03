"use client";

import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { useTheme } from "@/providers/theme-provider";

interface ThemeSelectorProps {
  showHeader?: boolean;
}

export function ThemeSelector({ showHeader = true }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="text-lg font-semibold">Appearance</h3>
            <p className="text-sm text-muted-foreground">
              Customize how REXT AI looks and feels for you
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="theme">Theme</Label>
        <RadioGroup
          options={[
            {
              value: "light",
              label: "Light",
              description: "Use light theme",
              icon: Sun,
            },
            {
              value: "dark",
              label: "Dark",
              description: "Use dark theme",
              icon: Moon,
            },
            {
              value: "system",
              label: "System",
              description: "Follow system preference",
              icon: Monitor,
            },
          ]}
          value={theme}
          onValueChange={(value) =>
            setTheme(value as "light" | "dark" | "system")
          }
          columns={3}
        />
      </div>
    </div>
  );
}
