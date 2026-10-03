import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TopicBuilderFormData } from "@/types/topic-builder";

interface GenerationStepProps {
  formData: TopicBuilderFormData;
  onGenerate: () => void;
}

export function GenerationStep({ formData, onGenerate }: GenerationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-foreground" />
        <h3 className="text-lg font-semibold mb-2">Ready to Generate!</h3>
        <p className="text-muted-foreground mb-4">
          We'll create {formData.num_topics} targeted topics based on your
          selections.
        </p>
        <Button onClick={onGenerate} size="lg" className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Topics
        </Button>
      </div>
    </div>
  );
}
