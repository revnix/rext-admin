import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";
import { CountryDropdown } from "../ui/country-dropdown";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    setValue(userKeyword);
  }, [userKeyword]);

  const handleChange = (val: string) => {
    setValue(val);
    onKeywordChange(val);
  };

  return (
    <div className="relative group">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="relative flex flex-col sm:flex-row gap-3 py-2 bg-card/80 border border-border rounded-xl"
      >
        <div className="flex-1 flex items-center px-4">
          <Search className="w-6 h-6 text-muted-foreground mr-4" />
          <Input
            type="text"
            placeholder="Enter a keyword or topic to write about..."
            className="flex-1 h-10 border-none shadow-none text-[15px] placeholder:text-muted-foreground/30 focus-visible:ring-0 bg-transparent px-4 font-medium"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 group/actions">
          <div className="w-[24%] md:w-auto">
            <CountryDropdown
              slim={true}
              value={country}
              onChange={(c) => onCountryChange(c.alpha2)}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="h-10 px-4 rounded-md font-semibold gap-1.5 text-sm shrink-0"
          >
            Analyze
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </form>
    </div>
  );
}
