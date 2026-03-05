import { FileText, Lightbulb, ShoppingCart, MapPin } from "lucide-react";

// Intent type configuration with colors and icons
const INTENT_CONFIG = {
  commercial: {
    label: "Commercial",
    description: "Researching options and ready to buy.",
    icon: FileText,
    color: "var(--color-warning-600)",
    textColor: "text-warning-600",
  },
  informational: {
    label: "Informational",
    description: "Seeking knowledge or answers.",
    icon: Lightbulb,
    color: "var(--color-purple-600)",
    textColor: "text-purple-600",
  },
  transactional: {
    label: "Transactional",
    description: "Ready to buy something specific.",
    icon: ShoppingCart,
    color: "var(--color-success-600)",
    textColor: "text-success-600",
  },
  navigational: {
    label: "Navigational",
    description: "Finding a website or location.",
    icon: MapPin,
    color: "var(--color-warning-500)",
    textColor: "text-warning-600",
  },
} as const;

type IntentType = keyof typeof INTENT_CONFIG;

interface SearchIntentCardProps {
  intent?: IntentType;
  className?: string;
}

export function SearchIntentCard({
  intent = "transactional",
}: SearchIntentCardProps) {
  const config = INTENT_CONFIG[intent] || INTENT_CONFIG.informational;
  const Icon = config.icon;

  return (
    <>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.color }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-foreground truncate uppercase">
          {intent}
        </h3>
        <p className={`text-[10px] leading-tight ${config.textColor}`}>
          {config.description}
        </p>
      </div>
    </>
  );
}
