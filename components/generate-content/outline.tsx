import type { Outline } from "@/types/generate-content";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Target,
  Mic2,
  Clock,
  ChevronRight,
  ListChecks,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "../ui/input";

export function OutlineDisplay({
  outline,
  isLoading,
  onApprove,
  onReject,
  onUpdate,
}: {
  outline: Outline;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUpdate?: (outline: Outline) => void;
}) {
  const [editingTone, setEditingTone] = useState(false);
  const [editingAudience, setEditingAudience] = useState(false);
  const [tone, setTone] = useState(outline.tone);
  const [audience, setAudience] = useState(
    outline.target_audience?.join(", ") || "",
  );

  useEffect(() => {
    setTone(outline.tone);
    setAudience(outline.target_audience?.join(", ") || "");
  }, [outline]);

  const handleToneSave = () => {
    if (onUpdate) {
      onUpdate({ ...outline, tone });
    }
    setEditingTone(false);
  };

  const handleAudienceSave = () => {
    if (onUpdate) {
      onUpdate({
        ...outline,
        target_audience: audience
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }
    setEditingAudience(false);
  };
  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 space-y-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <ListChecks className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
          {outline.title}
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          {outline.brief}
        </p>
      </motion.div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100"
        >
          <div className="p-3 rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
            <Mic2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Tone
            </p>
            {editingTone ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="h-7 text-sm min-w-[120px]"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={handleToneSave}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    setTone(outline.tone);
                    setEditingTone(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/edit">
                <p className="text-sm font-bold text-slate-700">
                  {outline.tone}
                </p>
                {onUpdate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 transition-opacity text-slate-400 hover:text-blue-500"
                    onClick={() => setEditingTone(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100"
        >
          <div className="p-3 rounded-xl bg-white shadow-sm ring-1 ring-slate-200/50">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Audience
            </p>
            {editingAudience ? (
              <div className="flex items-center gap-2">
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="h-7 text-sm min-w-[200px]"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={handleAudienceSave}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-slate-600"
                  onClick={() => {
                    setAudience(outline.target_audience?.join(", ") || "");
                    setEditingAudience(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/edit">
                <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">
                  {outline.target_audience?.join(", ")}
                </p>
                {onUpdate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 transition-opacity text-slate-400 hover:text-blue-500"
                    onClick={() => setEditingAudience(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sections List */}
      <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
        {outline.sections.map((section, idx) => (
          <motion.div
            key={section.heading}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="relative pl-12 group"
          >
            {/* Timeline Node */}
            <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-500 transition-colors z-10">
              <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                {idx + 1}
              </span>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {section.heading}
                </h3>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500">
                    ~{section.suggested_word_count} words
                  </span>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                {section.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.key_points.map((point: string) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-blue-100 transition-all duration-200"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-600">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 flex items-center justify-end gap-3"
      >
        <Button
          onClick={onReject}
          disabled={isLoading}
          variant="outline"
          className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <Button
          onClick={onApprove}
          disabled={isLoading}
          className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/20"
        >
          <Check className="w-4 h-4 mr-2" />
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
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto py-12"
    >
      <div className="p-8 rounded-3xl bg-white">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-blue-50">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">
              {instruction}
            </h3>
          </div>
        </div>

        <Textarea
          name="rejectedReason"
          id="rejectedReason"
          value={rejectedReason}
          onChange={(e) => onChange(e.target.value)}
          placeholder={instruction}
          className="w-full min-h-[160px] p-5 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 text-slate-700 bg-slate-50/50 transition-all text-base leading-relaxed"
        />

        <div className="flex items-center justify-end mt-8">
          <Button
            onClick={onSubmit}
            className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-none group"
          >
            Submit
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
