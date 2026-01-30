import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
        className="relative flex flex-col sm:flex-row gap-3 py-2 bg-white/80 border border-slate-200 rounded-xl"
      >
        <div className="flex-1 flex items-center px-4">
          <Search className="w-6 h-6 text-slate-300 mr-4" />
          <Input
            type="text"
            placeholder="Enter a keyword or topic..."
            className="h-12 w-full border-none shadow-none !text-lg !placeholder:text-slate-300 focus-visible:ring-0 bg-transparent px-0"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 group/actions">
          <CountryDropdown
            slim={true}
            value={country}
            onChange={(c) => onCountryChange(c.alpha2)}
          />
          <Button
            type="submit"
            className="h-12 px-4 text-lg"
          >
            Generate
          </Button>
        </div>
      </form>
    </div>
  );
}
