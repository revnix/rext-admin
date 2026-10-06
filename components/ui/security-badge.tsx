import { CheckCircle2, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Security Badge Component
 *
 * Displays security indicators to build trust with users during payment flows.
 *
 * Variants:
 * - ssl: SSL/HTTPS security badge
 * - secure-payment: Secure payment indicator
 * - lemonsqueezy: LemonSqueezy trust badge
 * - pci-compliant: PCI compliance badge
 *
 * Sizes:
 * - sm: Compact for headers/footers
 * - md: Standard size for inline content
 * - lg: Large for prominent placement
 */

export type SecurityBadgeVariant =
  | "ssl"
  | "secure-payment"
  | "lemonsqueezy"
  | "pci-compliant";

export type SecurityBadgeSize = "sm" | "md" | "lg";

export interface SecurityBadgeProps {
  variant: SecurityBadgeVariant;
  size?: SecurityBadgeSize;
  showText?: boolean;
  className?: string;
}

export function SecurityBadge({
  variant,
  size = "md",
  showText = true,
  className,
}: SecurityBadgeProps) {
  const config = getConfig(variant);

  const sizeClasses = {
    sm: "text-xs gap-1.5",
    md: "text-sm gap-2",
    lg: "text-base gap-2.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label={config.ariaLabel}
    >
      <Icon className={cn(iconSizes[size], config.iconColor)} />
      {showText && <span>{config.text}</span>}
    </div>
  );
}

/**
 * Security Banner Component
 *
 * Full-width security message banner for prominent display.
 * Use above checkout forms or payment sections.
 */

export interface SecurityBannerProps {
  variant?: "default" | "prominent";
  className?: string;
}

export function SecurityBanner({
  variant = "default",
  className,
}: SecurityBannerProps) {
  const isProminent = variant === "prominent";

  return (
    <div
      className={cn(
        "rounded-md border",
        isProminent
          ? "bg-green-50 border-green-200"
          : "bg-muted/50 border-border",
        className,
      )}
    >
      <div className="p-4 flex items-center gap-3">
        <Shield
          className={cn(
            "flex-shrink-0",
            isProminent
              ? "h-5 w-5 text-green-600"
              : "h-5 w-5 text-muted-foreground",
          )}
        />
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-semibold text-sm",
              isProminent ? "text-green-900" : "text-foreground",
            )}
          >
            Secure Payment Processing
          </p>
          <p
            className={cn(
              "text-xs mt-0.5",
              isProminent ? "text-green-700" : "text-muted-foreground",
            )}
          >
            Your payment information is encrypted and processed securely by
            LemonSqueezy. We never store your card details.
          </p>
        </div>
        <CheckCircle2
          className={cn(
            "flex-shrink-0 h-5 w-5",
            isProminent ? "text-green-600" : "text-muted-foreground",
          )}
        />
      </div>
    </div>
  );
}

/**
 * Compact Security Indicators
 *
 * Small inline security badges that can be grouped together.
 * Useful for footers or subtle placements.
 */

export interface SecurityIndicatorsProps {
  className?: string;
}

export function SecurityIndicators({ className }: SecurityIndicatorsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 text-xs text-muted-foreground",
        className,
      )}
    >
      <SecurityBadge variant="ssl" size="sm" />
      <span className="text-muted-foreground/50">•</span>
      <SecurityBadge variant="pci-compliant" size="sm" />
      <span className="text-muted-foreground/50">•</span>
      <SecurityBadge variant="lemonsqueezy" size="sm" />
    </div>
  );
}

/**
 * LemonSqueezy Trust Badge
 *
 * Branded component showing LemonSqueezy as the payment processor.
 * Includes custom styling for brand consistency.
 */

export interface LemonSqueezyBadgeProps {
  size?: "sm" | "md" | "lg";
  showLogo?: boolean;
  className?: string;
}

export function LemonSqueezyBadge({
  size = "md",
  showLogo = true,
  className,
}: LemonSqueezyBadgeProps) {
  const sizeClasses = {
    sm: "text-xs gap-2",
    md: "text-sm gap-2.5",
    lg: "text-base gap-3",
  };

  const logoSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center text-muted-foreground",
        sizeClasses[size],
        className,
      )}
    >
      <span className="font-normal">Powered by</span>
      {showLogo ? (
        <svg
          className={cn(logoSizes[size], "w-auto")}
          viewBox="0 0 120 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="LemonSqueezy"
        >
          <title>LemonSqueezy</title>
          <path
            d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6S6.698 2.4 12 2.4s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"
            fill="currentColor"
          />
          <path
            d="M12 6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 9.6c-1.988 0-3.6-1.612-3.6-3.6S10.012 8.4 12 8.4s3.6 1.612 3.6 3.6-1.612 3.6-3.6 3.6z"
            fill="currentColor"
            opacity="0.6"
          />
          <text
            x="28"
            y="17"
            fontSize="14"
            fontWeight="600"
            fill="currentColor"
          >
            LemonSqueezy
          </text>
        </svg>
      ) : (
        <span className="font-semibold">LemonSqueezy</span>
      )}
    </div>
  );
}

/**
 * Payment Security Message
 *
 * Full security message component for display near payment actions.
 * Combines multiple trust signals.
 */

export interface PaymentSecurityMessageProps {
  variant?: "default" | "compact";
  className?: string;
}

export function PaymentSecurityMessage({
  variant = "default",
  className,
}: PaymentSecurityMessageProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <Lock className="h-3 w-3" />
        <span>Secure SSL encrypted payment</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="font-medium">Your payment is secure</span>
      </div>
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
          <span>256-bit SSL encryption protects your payment information</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
          <span>PCI DSS compliant payment processing</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
          <span>We never store your card details on our servers</span>
        </li>
      </ul>
      <div className="pt-2">
        <LemonSqueezyBadge size="sm" showLogo={false} />
      </div>
    </div>
  );
}

// Helper function to get badge configuration
function getConfig(variant: SecurityBadgeVariant) {
  const configs = {
    ssl: {
      icon: Lock,
      text: "Secure SSL",
      iconColor: "text-green-600",
      ariaLabel: "SSL secured connection",
    },
    "secure-payment": {
      icon: Shield,
      text: "Secure Payment",
      iconColor: "text-green-600",
      ariaLabel: "Secure payment processing",
    },
    lemonsqueezy: {
      icon: CheckCircle2,
      text: "Powered by LemonSqueezy",
      iconColor: "text-primary",
      ariaLabel: "Powered by LemonSqueezy payment processor",
    },
    "pci-compliant": {
      icon: Shield,
      text: "PCI Compliant",
      iconColor: "text-blue-600",
      ariaLabel: "PCI DSS compliant",
    },
  };

  return configs[variant];
}
