"use client";

import { Sparkles, Library } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

interface SelectionViewProps {
  onStartFresh: () => void;
  onPickFromLibrary: () => void;
}

export function SelectionView({
  onStartFresh,
  onPickFromLibrary,
}: SelectionViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl font-serif font-semibold text-slate-900">
          How would you like to start?
        </h1>
        <p className="text-muted-foreground text-lg">
          Choose your starting point for building content authority.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Start Fresh Card */}
        <Card
          className="group relative overflow-hidden border-2 hover:border-sidebar-primary/50 transition-all duration-300 cursor-pointer shadow-none hover:shadow-lg hover:shadow-sidebar-primary/5"
          onClick={onStartFresh}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} />
          </div>
          <CardHeader className="pt-8 px-8">
            <div className="h-12 w-12 rounded-lg bg-green-50 text-green-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <CardTitle className="text-xl mb-2">Start Fresh</CardTitle>
            <CardDescription className="text-base">
              Analyze a new keyword and explore the SERP landscape.
            </CardDescription>
          </CardHeader>
          <CardFooter className="px-8 pb-8 pt-4">
            <span className="text-sidebar-primary font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Begin Research →
            </span>
          </CardFooter>
        </Card>

        {/* Pick from Library Card */}
        <Card
          className="group relative overflow-hidden border-2 hover:border-sidebar-primary/50 transition-all duration-300 cursor-pointer shadow-none hover:shadow-lg hover:shadow-sidebar-primary/5"
          onClick={onPickFromLibrary}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Library size={120} />
          </div>
          <CardHeader className="pt-8 px-8">
            <div className="h-12 w-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Library size={24} />
            </div>
            <CardTitle className="text-xl mb-2">Pick from Library</CardTitle>
            <CardDescription className="text-base">
              Use a previously analyzed keyword to skip the research phase.
            </CardDescription>
          </CardHeader>
          <CardFooter className="px-8 pb-8 pt-4">
            <span className="text-amber-600 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Browse saved keywords →
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
