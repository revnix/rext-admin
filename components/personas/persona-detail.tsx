"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, Target, AlertCircle, TrendingUp, Activity } from "lucide-react";
import type { Persona } from "@/types/workspace";

interface PersonaDetailProps {
  persona: Persona;
}

export function PersonaDetail({ persona }: PersonaDetailProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <User size={18} className="text-primary" />
                Profile Details
              </h3>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Professional Title */}
              {persona.professional_title && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Professional Title
                  </p>
                  <p className="text-base font-medium">
                    {persona.professional_title}
                  </p>
                </div>
              )}

              {/* Bio */}
              {persona.bio && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Bio
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {persona.bio}
                  </p>
                </div>
              )}

              {/* LinkedIn */}
              {persona.linkedin_url && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    LinkedIn
                  </p>
                  <a
                    href={persona.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {persona.linkedin_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demographics */}
          {persona.demographics && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Demographics
                </h3>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {persona.demographics}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Expertise & Tone */}
          {(persona.areas_of_expertise || persona.tone_of_voice) && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Capabilities
                </h3>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {persona.areas_of_expertise && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Areas of Expertise
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {persona.areas_of_expertise.split(",").map((area) => (
                        <Badge
                          key={area.trim()}
                          variant="secondary"
                          className="px-3 py-1 text-sm"
                        >
                          {area.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {persona.tone_of_voice && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} />
                      Tone of Voice
                    </p>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm italic text-muted-foreground">
                        "{persona.tone_of_voice}"
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Goals & Pain Points */}
          {(persona.goals || persona.pain_points) && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target size={18} className="text-primary" />
                  Objectives & Challenges
                </h3>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {persona.goals && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Goals
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {persona.goals}
                    </p>
                  </div>
                )}

                {persona.pain_points && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-destructive" />
                      Pain Points
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {persona.pain_points}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Behaviors */}
          {persona.behaviors && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  Behaviors
                </h3>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {persona.behaviors}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
