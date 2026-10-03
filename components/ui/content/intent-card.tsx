import { FileText, Lightbulb, ShoppingCart, MapPin } from "lucide-react";

// Intent type configuration with colors and icons
const INTENT_CONFIG = {
  commercial: {
    label: "Commercial",
    description: "Researching options and ready to buy.",
    icon: FileText,
    color: "var(--foreground)",
    textColor: "text-muted-foreground",
  },
  informational: {
    label: "Informational",
    description: "Seeking knowledge or answers.",
    icon: Lightbulb,
    color: "var(--foreground)",
    textColor: "text-muted-foreground",
  },
  transactional: {
    label: "Transactional",
    description: "Ready to buy something specific.",
    icon: ShoppingCart,
    color: "var(--foreground)",
    textColor: "text-muted-foreground",
  },
  navigational: {
    label: "Navigational",
    description: "Finding a website or location.",
    icon: MapPin,
    color: "var(--foreground)",
    textColor: "text-muted-foreground",
  },
} as const;

type IntentType = keyof typeof INTENT_CONFIG;

/**
 * Props for rendering a compact search-intent visual card.
 */
interface SearchIntentCardProps {
  /** Intent category key used to resolve icon/color/description. */
  intent?: IntentType;
  /** Optional source label shown above the intent (e.g. "SEO Data", "AI Suggested"). */
  label?: string;
  /** Optional class override for container-level composition. */
  className?: string;
}

/**
 * Renders icon + label + description for the selected search-intent category.
 */
export function SearchIntentCard({
  intent = "transactional",
  label,
}: SearchIntentCardProps) {
  const config = INTENT_CONFIG[intent] || INTENT_CONFIG.informational;
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.color }}
        >
          <Icon className="w-3.5 h-3.5 text-background" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate capitalize">
            {intent}
          </h3>
          <p className={`text-xs leading-tight ${config.textColor}`}>
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}

SearchIntentCard.displayName = "SearchIntentCard";
