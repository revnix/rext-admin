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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={`relative flex flex-col sm:flex-row items-stretch bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
          focused
            ? "border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
            : "border-border hover:border-border/80"
        }`}
      >
        {/* Search icon + input */}
        <div className="flex-1 flex items-center px-4 py-1">
          <Search
            className={`w-4 h-4 mr-3 shrink-0 transition-colors duration-200 ${
              focused ? "text-primary" : "text-muted-foreground/50"
            }`}
          />
          <Input
            type="text"
            placeholder="Enter a keyword or topic..."
            className="h-12 w-full border-none shadow-none text-[15px] placeholder:text-muted-foreground/40 focus-visible:ring-0 bg-transparent px-0 font-medium"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required
          />
        </div>

        {/* Divider + actions */}
        <div className="flex items-center gap-2 px-3 py-2 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/30">
          <CountryDropdown
            slim={true}
            value={country}
            onChange={(c) => onCountryChange(c.alpha2)}
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 px-4 rounded-xl font-semibold gap-1.5 text-[13px]"
          >
            Analyze
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
