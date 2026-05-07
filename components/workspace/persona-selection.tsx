/**
 * Persona Selection Component
 *
 * Allows users to select a persona from available options
 * Used in the workspace creation wizard
 */

"use client";

import { Check, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Persona } from "@/types/workspace";

/** Safely parse areas_of_expertise whether it's an array, JSON string, or CSV string. */
function parseAreas(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const clean = (s: string) =>
    s
      .trim()
      .replace(/^[["'\s]+|[\]"'\s]+$/g, "")
      .trim();
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  const t = value.trim();
  if (t.startsWith("[")) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed))
        return parsed.map((s: unknown) => clean(String(s))).filter(Boolean);
    } catch {
      return t
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map(clean)
        .filter(Boolean);
    }
  }
  return t.split(",").map(clean).filter(Boolean);
}

interface PersonaSelectionProps {
  personas: Persona[];
  selectedPersonaId?: string | null;
  onSelect: (personaId: string) => void;
  isLoading?: boolean;
}

/**
 * Persona Selection Component
 *
 * Displays a grid of persona cards that can be selected
 */
export function PersonaSelection({
  personas,
  selectedPersonaId,
  onSelect,
  isLoading = false,
}: PersonaSelectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No personas available</h3>
        <p className="text-sm text-muted-foreground">
          Personas will be automatically extracted from your website during
          workspace creation.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {personas.map((persona) => (
        <PersonaCard
          key={persona.id || persona.name}
          persona={persona}
          isSelected={selectedPersonaId === persona.id}
          onSelect={() => onSelect(persona.id || "")}
        />
      ))}
    </div>
  );
}

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Individual Persona Card
 *
 * Displays a single persona with selection state
 */
function PersonaCard({ persona, isSelected, onSelect }: PersonaCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md relative",
        isSelected && "ring-2 ring-primary shadow-md",
      )}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>

          {/* Name and Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {persona.full_name || persona.name}
            </h3>
            {persona.professional_title && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {persona.professional_title}
              </p>
            )}
          </div>
        </div>

        {/* Areas of Expertise */}
        {persona.areas_of_expertise && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {parseAreas(persona.areas_of_expertise)
                .slice(0, 3)
                .map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              {parseAreas(persona.areas_of_expertise).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{parseAreas(persona.areas_of_expertise).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Tone of Voice */}
        {persona.tone_of_voice && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {persona.tone_of_voice}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
