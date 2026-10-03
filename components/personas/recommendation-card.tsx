"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface RecommendationCardProps {
  onImport: () => void;
}

export function RecommendationCard({ onImport }: RecommendationCardProps) {
  return (
    <Card className="bg-muted/40 border-border relative overflow-hidden rounded-md group">
      <CardContent className="p-6 md:p-8 relative">
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/80 dark:bg-background/80 text-muted-foreground hover:bg-white dark:hover:bg-background border-border backdrop-blur-sm rounded-md shadow-none font-semibold tracking-wide">
            RECOMMENDED
          </Badge>
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center border border-border text-2xl shadow-none shrink-0">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-xl text-foreground mb-1">
              Dr. Rext AI Expert
            </h3>
            <p className="text-muted-foreground font-medium">
              Lead Content Strategist
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed text-base">
          With over a decade of experience in the industry, Dr. Rext Expert
          leads the brand's commitment to high-quality, trustworthy content,
          specializing in authoritative, data-driven narratives.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Badge className="bg-background text-foreground hover:bg-accent border-border rounded-md px-3 py-1 font-medium shadow-none">
            Product Design
          </Badge>
          <Badge className="bg-background text-foreground hover:bg-accent border-border rounded-md px-3 py-1 font-medium shadow-none">
            Market Research
          </Badge>
          <Badge className="bg-background text-foreground hover:bg-accent border-border rounded-md px-3 py-1 font-medium shadow-none">
            Consumer Psychology
          </Badge>
        </div>

        <Button
          onClick={onImport}
          className="w-full md:w-auto h-11 px-6 font-medium"
        >
          <Plus size={18} className="mr-2" />
          Import Persona
        </Button>
      </CardContent>
    </Card>
  );
}
