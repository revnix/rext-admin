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
    <Card className="bg-amber-50/50 border-amber-200 shadow-none relative overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="absolute top-4 right-4">
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
            SUGGESTED
          </Badge>
        </div>

        <div className="mb-6">
          <h3 className="font-serif font-bold text-xl text-amber-900 mb-1">
            Dr. Wrext Expert
          </h3>
          <p className="text-amber-700/80 font-medium">
            Lead Content Strategist
          </p>
        </div>

        <p className="text-amber-800/90 mb-6 max-w-2xl leading-relaxed">
          With over a decade of experience in the industry, Dr. Wrext Expert
          leads the brand's commitment to high-quality, trustworthy content.
          specializing in authoritative, data-driven narratives.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Badge className="bg-white/80 text-amber-900 hover:bg-white border-amber-200">
            PRODUCT DESIGN
          </Badge>
          <Badge className="bg-white/80 text-amber-900 hover:bg-white border-amber-200">
            MARKET RESEARCH
          </Badge>
          <Badge className="bg-white/80 text-amber-900 hover:bg-white border-amber-200">
            CONSUMER PSYCHOLOGY
          </Badge>
        </div>

        <Button
          onClick={onImport}
          variant="outline"
          className="w-full md:w-auto bg-white border-amber-200 text-amber-900 hover:bg-amber-50 hover:text-amber-950 min-w-[200px]"
        >
          <Plus size={16} className="mr-2" />
          Import to Forge
        </Button>
      </CardContent>
    </Card>
  );
}
