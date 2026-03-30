"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { CountryDropdown } from "../ui/country-dropdown";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function KeywordForm({
  userKeyword,
  country,
  onSubmit,
  onKeywordChange,
  onCountryChange,
}: {
  userKeyword: string;
  country: string;
  onSubmit: () => void;
  onKeywordChange: (val: string) => void;
  onCountryChange: (val: string) => void;
}) {
  const [value, setValue] = useState(userKeyword);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setValue(userKeyword);
  }, [userKeyword]);

  const handleChange = (val: string) => {
    setValue(val);
    onKeywordChange(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* Main search bar */}
        <div
          className={`relative flex items-center bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
            focused
              ? "border-primary/50 shadow-[0_0_0_4px_hsl(var(--primary)/0.06)]"
              : "border-border/60 hover:border-border"
          }`}
        >
          <div
            className={`flex items-center justify-center w-12 h-14 shrink-0 transition-colors duration-200 ${
              focused ? "text-primary" : "text-muted-foreground/35"
            }`}
          >
            <Search className="w-4 h-4" />
          </div>

          <Input
            type="text"
            placeholder="Enter a keyword or topic to write about..."
            className="flex-1 h-14 border-none shadow-none text-[15px] placeholder:text-muted-foreground/30 focus-visible:ring-0 bg-transparent px-0 font-medium"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required
          />

          {/* Actions — always visible, right side */}
          <div className="flex items-center gap-2 pr-3 pl-2">
            <div className="h-8 w-px bg-border/50 mr-1" />
            <CountryDropdown
              slim={true}
              value={country}
              onChange={(c) => onCountryChange(c.alpha2)}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 px-4 rounded-xl font-semibold gap-1.5 text-[13px] shrink-0"
            >
              Analyze
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Hint line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] text-muted-foreground/40 mt-3 pl-1 tracking-wide"
        >
          Try: &ldquo;best project management tools&rdquo; · &ldquo;how to start
          a podcast&rdquo; · &ldquo;AI in healthcare&rdquo;
        </motion.p>
      </form>
    </motion.div>
  );
}
