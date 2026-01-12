import type { Outline } from "@/types/generate-content";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function OutlineDisplay({
  outline,
  isLoading,
  onApprove,
  onReject,
}: {
  outline: Outline;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="animate-in fade-in duration-500 mt-8 w-full">
      <div className="space-y-2">
        <div className="space-y-2">
          <h2 className="text-xl font-bold leading-tight">{outline.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {outline.brief}
          </p>
        </div>

        <div className="pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Tone:
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {outline.tone}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Audience:
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {outline.target_audience?.join(", ")}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {outline.sections.map((section, idx) => (
          <div key={section.heading} className="relative">
            <div className="flex items-baseline gap-4">
              <h3 className="text-sm font-bold">
                <span className="mr-4 font-mono">{idx + 1}.</span>
                {section.heading}
              </h3>
              <div className="text-xs bg-slate-100 rounded-full px-1 py-px font-medium text-slate-400">
                ~{section.suggested_word_count} words
              </div>
            </div>
            <div className="pl-10">
              <p className="leading-relaxed">{section.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-1">
                  {section.key_points.map((point: string) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm text-slate-600 pl-2"
                    >
                      <span className="mt-2 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto ms-auto">
          <Button onClick={onApprove} disabled={isLoading}>
            Approve & Generate
          </Button>
          <Button onClick={onReject} disabled={isLoading} variant="outline">
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OutlineRejectSection({
  instruction,
  rejectedReason,
  onChange,
  onSubmit,
}: {
  instruction: string;
  rejectedReason: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="animate-in fade-in duration-700 bg-white flex flex-col w-full">
      <label htmlFor="rejectedReason" className="text-base font-medium">
        {instruction}
      </label>
      <Textarea
        name="rejectedReason"
        id="rejectedReason"
        value={rejectedReason}
        onChange={(e) => onChange(e.target.value)}
        placeholder={instruction}
        className="w-full mt-2"
      />
      <div className="flex justify-end mt-2">
        <Button onClick={onSubmit}>Submit</Button>
      </div>
    </div>
  );
}
