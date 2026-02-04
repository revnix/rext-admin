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
          <div className="p-2 rounded-lg bg-muted">
            <ListChecks className="w-5 h-5 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
          {outline.title}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {outline.brief}
        </p>
      </motion.div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border"
        >
          <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
            <Mic2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
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
          className="flex items-center gap-4 p-5 rounded-2xl bg-muted/50 border border-border"
        >
          <div className="p-3 rounded-xl bg-card shadow-sm ring-1 ring-border">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
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
                  className="h-7 w-7 text-primary hover:text-primary hover:bg-muted"
                  onClick={handleAudienceSave}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
                <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                  {outline.target_audience?.join(", ")}
                </p>
                {onUpdate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 transition-opacity text-muted-foreground hover:text-primary"
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
            <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center rounded-full bg-card border-2 border-border group-hover:border-primary transition-colors z-10">
              <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {idx + 1}
              </span>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-colored-sm transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {section.heading}
                </h3>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-muted-foreground">
                    ~{section.suggested_word_count} words
                  </span>
                </div>
              </div>

              <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
                {section.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.key_points.map((point: string) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-card border border-transparent hover:border-border transition-all duration-200"
                  >
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-muted-foreground">
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
      <div className="p-8 rounded-3xl bg-card border border-border">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-muted">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground leading-tight">
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
          className="w-full min-h-[160px] p-5 rounded-2xl border-border focus:border-primary focus:ring-primary/10 text-foreground bg-muted/50 transition-all text-base leading-relaxed"
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
