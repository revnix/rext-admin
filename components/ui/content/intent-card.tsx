import { FileText, Lightbulb, ShoppingCart, MapPin } from "lucide-react";

// Intent type configuration with colors and icons
const INTENT_CONFIG = {
  commercial: {
    label: "Commercial",
    description: "Researching options and ready to buy.",
    icon: FileText,
    color: "#E67E22", // Orange
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  informational: {
    label: "Informational",
    description: "Seeking knowledge or answers.",
    icon: Lightbulb,
    color: "#8E44AD", // Purple
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  transactional: {
    label: "Transactional",
    description: "Ready to buy something specific.",
    icon: ShoppingCart,
    color: "#1ABC9C", // Teal
    bgColor: "bg-teal-50",
    textColor: "text-teal-600",
  },
  navigational: {
    label: "Navigational",
    description: "Finding a website or location.",
    icon: MapPin,
    color: "#F1C40F", // Yellow
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-600",
  },
} as const;

type IntentType = keyof typeof INTENT_CONFIG;

interface SearchIntentCardProps {
  intent?: IntentType;
  className?: string;
}

export function SearchIntentCard({
  intent = "informational",
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
        <h3 className="text-lg font-bold text-gray-900 truncate uppercase">
          {intent}
        </h3>
        <p className={`text-[10px] leading-tight ${config.textColor}`}>
          {config.description}
        </p>
      </div>
    </>
  );
}
