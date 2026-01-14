import type { Outline } from "@/types/generate-content";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  Users,
  Mic,
  CheckCircle2,
  XCircle,
  BookOpen,
  AlignLeft,
} from "lucide-react";

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
  const [expandedSections, setExpandedSections] = useState<number[]>(
    outline.sections.map((_, idx) => idx)
  );

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const totalWords = outline.sections.reduce(
    (sum, section) => sum + (section.suggested_word_count || 0),
    0
  );
  const readingTime = Math.ceil(totalWords / 200);

  return (
    <div className="animate-in fade-in duration-500 mt-8 w-full max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex gap-5">
        <div className="flex-shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <BookOpen className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold leading-tight text-gray-900">
            {outline.title}
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            {outline.brief}
          </p>
        </div>
      </div>

      {/* Meta Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-100 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Tone
            </p>
            <p className="font-semibold text-gray-900">{outline.tone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-100 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Audience
            </p>
            <p className="font-semibold text-gray-900 truncate max-w-[100px]" title={outline.target_audience?.join(", ")}>
              {outline.target_audience?.[0] || "General"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-100 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <AlignLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Length
            </p>
            <p className="font-semibold text-gray-900">~{totalWords} words</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-blue-100 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Read Time
            </p>
            <p className="font-semibold text-gray-900">{readingTime} min</p>
          </div>
        </div>
      </div>

      {/* Timeline Sections */}
      <div className="relative pl-8 space-y-6">
        {/* Timeline Line */}
        <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-blue-100" />

        {outline.sections.map((section, idx) => {
          const isExpanded = expandedSections.includes(idx);

          return (
            <motion.div
              key={section.heading}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              {/* Timeline Dot */}
              <div className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-sm z-10" />

              <div
                className={`overflow-hidden rounded-xl border bg-white transition-all duration-300 ${isExpanded
                    ? "border-blue-200 shadow-md ring-1 ring-blue-100"
                    : "border-gray-200 shadow-sm hover:border-blue-200"
                  }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {section.heading}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      ~{section.suggested_word_count}w
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-4">
                        <p className="text-gray-600 leading-relaxed">
                          {section.description}
                        </p>

                        <div className="space-y-2">
                          {section.key_points.map((point: string) => (
                            <div
                              key={point}
                              className="flex items-start gap-3 text-sm text-gray-700"
                            >
                              <div className="mt-1 flex-shrink-0 rounded-full bg-blue-100 p-0.5">
                                <Check className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="leading-relaxed">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100"
      >
        <Button
          onClick={onReject}
          disabled={isLoading}
          variant="outline"
          className="gap-2 h-11 px-6 text-base"
        >
          <XCircle className="h-5 w-5" />
          Reject
        </Button>
        <Button
          onClick={onApprove}
          disabled={isLoading}
          className="gap-2 h-11 px-6 text-base bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
        >
          <CheckCircle2 className="h-5 w-5" />
          Approve & Generate
        </Button>
      </motion.div>
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
