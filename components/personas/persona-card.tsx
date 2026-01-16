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
    <Card className="group hover:border-slate-300 transition-all duration-300 border-slate-200 rounded-2xl bg-white overflow-hidden shadow-none">
      <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-slate-100 bg-slate-50/50">
        <div
          className={`h-12 w-12 rounded-xl ${persona.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
        >
          {persona.initials}
        </div>
        <div className="space-y-0.5">
          <h3 className="font-bold text-lg leading-tight text-slate-900 group-hover:text-primary transition-colors">
            {persona.name}
          </h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {persona.title}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5 p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-300" /> Expertise
          </p>
          <div className="flex flex-wrap gap-2">
            {persona.expertise.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-2.5 py-0.5 rounded-lg border border-slate-200"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-300" /> Voice
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {persona.toneOfVoice}
          </p>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <User size={14} className="text-slate-400" />
            <span>{persona.articlesWritten} articles generated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
