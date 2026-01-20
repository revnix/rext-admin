"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Target, AlertCircle, TrendingUp, Activity } from "lucide-react";
import type { Persona } from "@/types/workspace";

interface PersonaCardProps {
  persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  // Generate initials from name
  const initials = persona.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Generate a consistent color based on persona name
  const colors = [
    "bg-slate-800",
    "bg-blue-600",
    "bg-amber-500",
    "bg-emerald-600",
    "bg-purple-600",
    "bg-rose-600",
  ];
  const colorIndex = persona.name.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <Card className="group hover:border-foreground/20 transition-all duration-300 border-border rounded-2xl bg-card overflow-hidden shadow-none">
      <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-border bg-muted/20">
        <div
          className={`h-12 w-12 rounded-xl ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
        >
          {initials}
        </div>
        <div className="space-y-0.5 flex-1">
          <h3 className="font-bold text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors">
            {persona.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {persona.description}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5 p-6">
        {/* Professional Title (Author Personas) */}
        {persona.professional_title && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-muted-foreground" />
              Professional Title
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.professional_title}
            </p>
          </div>
        )}

        {/* Areas of Expertise (Author Personas) */}
        {persona.areas_of_expertise && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={12} className="text-muted-foreground" />
              Expertise
            </p>
            <div className="flex flex-wrap gap-1.5">
              {persona.areas_of_expertise.split(",").map((area) => (
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

        {/* Tone of Voice (Author Personas) */}
        {persona.tone_of_voice && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} className="text-muted-foreground" />
              Tone of Voice
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.tone_of_voice}
            </p>
          </div>
        )}

        {/* Bio (Author Personas) */}
        {persona.bio && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-muted-foreground" />
              Bio
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.bio}
            </p>
          </div>
        )}

        {/* LinkedIn URL (Author Personas) */}
        {persona.linkedin_url && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-muted-foreground" />
              LinkedIn
            </p>
            <a
              href={persona.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {persona.linkedin_url}
            </a>
          </div>
        )}

        {/* Demographics (Audience Personas) */}
        {persona.demographics && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-muted-foreground" />
              Demographics
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.demographics}
            </p>
          </div>
        )}

        {/* Pain Points (Audience Personas) */}
        {persona.pain_points && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={12} className="text-muted-foreground" />
              Pain Points
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.pain_points}
            </p>
          </div>
        )}

        {/* Goals (Audience Personas) */}
        {persona.goals && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target size={12} className="text-muted-foreground" />
              Goals
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.goals}
            </p>
          </div>
        )}

        {/* Behaviors (Audience Personas) */}
        {persona.behaviors && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} className="text-muted-foreground" />
              Behaviors
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {persona.behaviors}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
