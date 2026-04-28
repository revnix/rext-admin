"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Persona } from "@/types/workspace";
import { User } from "lucide-react";

interface PersonaCardProps {
  persona: Persona;
}

/**
 * Persona Card Component
 *
 * Displays a single persona with their details in a card format
 * similar to the author/expert card design.
 */
export function PersonaCard({ persona }: PersonaCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>

          {/* Name and Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">
              {persona.full_name || persona.name}
            </h3>
            {persona.professional_title && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {persona.professional_title}
              </p>
            )}
            {!persona.professional_title && persona.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {persona.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Areas of Expertise */}
        {persona.areas_of_expertise && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Expertise
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(persona.areas_of_expertise)
                ? persona.areas_of_expertise
                : persona.areas_of_expertise.split(",")
              ).map((area) => (
                <Badge
                  key={area.trim()}
                  variant="secondary"
                  className="text-xs"
                >
                  {area.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tone of Voice */}
        {persona.tone_of_voice && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Tone of Voice
            </h4>
            <p className="text-sm">{persona.tone_of_voice}</p>
          </div>
        )}

        {/* Bio */}
        {persona.bio && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Bio
            </h4>
            <p className="text-sm text-muted-foreground">{persona.bio}</p>
          </div>
        )}

        {/* Demographics */}
        {persona.demographics && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Demographics
            </h4>
            <p className="text-sm text-muted-foreground">
              {persona.demographics}
            </p>
          </div>
        )}

        {/* Pain Points */}
        {persona.pain_points && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Pain Points
            </h4>
            <p className="text-sm text-muted-foreground">
              {persona.pain_points}
            </p>
          </div>
        )}

        {/* Goals */}
        {persona.goals && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Goals
            </h4>
            <p className="text-sm text-muted-foreground">{persona.goals}</p>
          </div>
        )}

        {/* Behaviors */}
        {persona.behaviors && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Behaviors
            </h4>
            <p className="text-sm text-muted-foreground">{persona.behaviors}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PersonasGridProps {
  personas: Persona[];
}

/**
 * Personas Grid Component
 *
 * Displays a grid of persona cards
 */
export function PersonasGrid({ personas }: PersonasGridProps) {
  if (!personas || personas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Target Personas</h3>
      <div className="flex flex-col gap-4">
        {personas.map((persona) => (
          <PersonaCard key={persona.name} persona={persona} />
        ))}
      </div>
    </div>
  );
}
