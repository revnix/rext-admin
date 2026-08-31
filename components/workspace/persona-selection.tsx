/**
 * Persona Selection Component
 *
 * Allows users to select a persona from available options
 * Used in the workspace creation wizard
 */

"use client";

import { Check, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  /** Single-selected persona id (when `multiSelect` is false) */
  selectedPersonaId?: string | null;
  /** Multi-selected persona ids (when `multiSelect` is true) */
  selectedPersonaIds?: string[];
  /** Called when selection changes. When `multiSelect` is true, an array of ids is passed. Otherwise a single id string is passed. */
  onSelect: (personaIdOrIds: string | string[]) => void;
  isLoading?: boolean;
  /** Enable selecting multiple personas */
  multiSelect?: boolean;
}

/**
 * Persona Selection Component
 *
 * Displays a grid of persona cards that can be selected
 */
export function PersonaSelection({
  personas,
  selectedPersonaId,
  selectedPersonaIds,
  onSelect,
  isLoading = false,
  multiSelect = false,
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
      {personas.map((persona) => {
        const id = persona.id || persona.name || "";
        const isSelected = multiSelect
          ? (selectedPersonaIds || []).includes(id)
          : selectedPersonaId === id;

        const handleSelect = () => {
          if (multiSelect) {
            const current = new Set(selectedPersonaIds || []);
            if (current.has(id)) current.delete(id);
            else current.add(id);
            onSelect(Array.from(current));
          } else {
            onSelect(id);
          }
        };

        return (
          <PersonaCard
            key={id}
            persona={persona}
            isSelected={isSelected}
            onSelect={handleSelect}
            multiSelect={multiSelect}
          />
        );
      })}
    </div>
  );
}

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onSelect: () => void;
  multiSelect?: boolean;
}

/**
 * Individual Persona Card
 *
 * Displays a single persona with selection state
 */
function PersonaCard({
  persona,
  isSelected,
  onSelect,
  multiSelect = false,
}: PersonaCardProps) {
  const displayName = persona.full_name || persona.name;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md relative",
        isSelected && "ring-2 ring-primary shadow-md",
      )}
      onClick={onSelect}
    >
      {multiSelect ? (
        <div className="absolute right-3 top-3 z-10 flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            aria-label={`Select ${displayName}`}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={() => onSelect()}
            className="h-5 w-5 rounded-md border shadow-none"
          />
        </div>
      ) : isSelected ? (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      ) : null}

      <CardContent className={cn("p-4", multiSelect && "pt-10")}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>

          {/* Name and Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {displayName}
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
