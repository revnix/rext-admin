import { LockedFeatureTooltip } from "@/components/permission/locked-feature-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspacePermission } from "@/hooks/use-permission";
import { CONTENT_PERMISSIONS } from "@/lib/permissions";
import { useWorkspace } from "@/providers/workspace-provider";
import { useGeneratePreferencesStore } from "@/stores/generate-preferences-store";
import { ArrowRight, Search } from "lucide-react";
import { CountryDropdown } from "../ui/country-dropdown";
import { RunCostTooltip } from "./run-cost";
import { useEffect, useRef, useState } from "react";

/** The role lock's words, on Analyze and on each recent keyword's Use. */
export const GENERATE_LOCKED_MESSAGE =
  "Content generation requires Editor role or above";

export function KeywordForm({
  userKeyword,
  country,
  disabled = false,
  readOnly = false,
  run = "analyze",
  restoreCountry = false,
  onSubmit,
  onKeywordChange,
  onCountryChange,
}: {
  userKeyword: string;
  country: string;
  /** Blocks re-submission while a generation is already running */
  disabled?: boolean;
  /**
   * While this search's analysis fills its step in: the keyword and the country show what was
   * searched and can't be changed, since what is on screen belongs to them.
   */
  readOnly?: boolean;
  /** The run the button starts: a new analysis, a new keyword on a paused run, or none (the same keyword goes on unbilled). */
  run?: "analyze" | "change_keyword" | null;
  /** A new search (no run to restore): start in the country this workspace searched in last. */
  restoreCountry?: boolean;
  onSubmit: () => void;
  onKeywordChange: (val: string) => void;
  onCountryChange: (val: string) => void;
}) {
  const [value, setValue] = useState(userKeyword);
  // The workspace's id, not the address's slug in `workspaceId`, as the library and its permissions use.
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id ?? "";
  const { hasPermission: canGenerate, isLoading: isPermissionLoading } =
    useWorkspacePermission(CONTENT_PERMISSIONS.CREATE, workspaceId);
  const locked = !isPermissionLoading && !canGenerate;
  const rememberedCountry = useGeneratePreferencesStore((state) =>
    workspaceId ? state.countryByWorkspace[workspaceId] : undefined,
  );
  const rememberCountry = useGeneratePreferencesStore(
    (state) => state.setCountry,
  );

  // Once, when the form first has the workspace's last country: a run being restored keeps its own.
  const restored = useRef(false);
  useEffect(() => {
    if (!restoreCountry || restored.current || !rememberedCountry) return;
    restored.current = true;
    if (rememberedCountry !== country) onCountryChange(rememberedCountry);
  }, [restoreCountry, rememberedCountry, country, onCountryChange]);

  useEffect(() => {
    setValue(userKeyword);
  }, [userKeyword]);

  const handleChange = (val: string) => {
    setValue(val);
    onKeywordChange(val);
  };

  const analyze = (
    <Button
      type="submit"
      size="sm"
      disabled={disabled}
      className="h-10 px-4 rounded-md font-semibold gap-1.5 text-sm shrink-0"
    >
      Analyze
      <ArrowRight className="w-3 h-3" />
    </Button>
  );

  return (
    <div className="relative group pt-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (disabled || locked) return;
          onSubmit();
        }}
        // The field draws no box of its own, so the form shows its focus, as an Input does.
        className="relative flex flex-col sm:flex-row gap-3 py-2 bg-card/80 border border-border rounded-md has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-(length:--focus-ring-width) has-[input:focus-visible]:ring-ring/20"
      >
        <div className="flex-1 flex items-center px-4">
          <Search className="w-6 h-6 text-muted-foreground mr-4" />
          <Input
            type="text"
            placeholder="Enter a keyword..."
            aria-label="Keyword"
            className="flex-1 h-10 border-none shadow-none text-section placeholder:text-muted-foreground/30 focus-visible:ring-0 bg-transparent px-4 font-medium"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            readOnly={readOnly}
            required
          />
        </div>

        <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0">
          <div className="min-w-0 flex-1 sm:flex-none">
            <CountryDropdown
              value={country}
              disabled={readOnly}
              onChange={(c) => {
                onCountryChange(c.alpha2);
                if (workspaceId) rememberCountry(workspaceId, c.alpha2);
              }}
            />
          </div>

          {locked ? (
            <div className="shrink-0">
              <LockedFeatureTooltip
                permission={CONTENT_PERMISSIONS.CREATE}
                message={GENERATE_LOCKED_MESSAGE}
              >
                {analyze}
              </LockedFeatureTooltip>
            </div>
          ) : (
            <RunCostTooltip run={run}>{analyze}</RunCostTooltip>
          )}
        </div>
      </form>
    </div>
  );
}
