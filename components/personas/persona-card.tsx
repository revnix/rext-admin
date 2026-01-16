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
    <Card className="hover:border-primary/50 transition-colors shadow-none">
      <CardHeader className="flex flex-row items-center gap-4 pb-2 space-y-0">
        <div
          className={`h-12 w-12 rounded-lg ${persona.avatarColor} flex items-center justify-center text-white font-bold text-lg`}
        >
          {persona.initials}
        </div>
        <div>
          <h3 className="font-serif font-semibold text-lg leading-tight">
            {persona.name}
          </h3>
          <p className="text-sm text-muted-foreground">{persona.title}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Expertise
          </p>
          <div className="flex flex-wrap gap-1.5">
            {persona.expertise.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-normal"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tone of Voice
          </p>
          <p className="text-sm text-slate-700 line-clamp-2">
            {persona.toneOfVoice}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-muted-foreground">
          <User size={12} />
          <span>{persona.articlesWritten} articles written</span>
        </div>
      </CardContent>
    </Card>
  );
}
