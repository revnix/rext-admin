"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User } from "lucide-react";

export interface Persona {
  id: string;
  name: string;
  title: string;
  initials: string;
  avatarColor: string; // Tailwind class
  expertise: string[];
  toneOfVoice: string;
  articlesWritten: number;
}

interface PersonaCardProps {
  persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  return (
    <Card className="group hover:border-foreground/20 transition-all duration-300 border-border rounded-2xl bg-card overflow-hidden shadow-none">
      <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-border bg-muted/20">
        <div
          className={`h-12 w-12 rounded-xl ${persona.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
        >
          {persona.initials}
        </div>
        <div className="space-y-0.5">
          <h3 className="font-bold text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors">
            {persona.name}
          </h3>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {persona.title}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5 p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" /> Expertise
          </p>
          <div className="flex flex-wrap gap-2">
            {persona.expertise.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-muted hover:bg-muted/80 text-muted-foreground font-medium px-2.5 py-0.5 rounded-lg border border-border"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" /> Voice
          </p>
          <p className="text-sm text-foreground leading-relaxed font-medium">
            {persona.toneOfVoice}
          </p>
        </div>

        <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <User size={14} className="text-muted-foreground" />
            <span>{persona.articlesWritten} articles generated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
