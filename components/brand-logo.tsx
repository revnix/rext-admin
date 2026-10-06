import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** "white" for a dark background; the black mark otherwise (the dashboard is light only). */
  variant?: "white" | "black";
}

export function BrandLogo({
  className = "",
  width = 120,
  height = 40,
  priority = false,
  variant,
}: BrandLogoProps) {
  // rext_logo_dark.svg is the white mark (for dark backgrounds); rext_logo_light.svg the black one.
  const logoSrc =
    variant === "white"
      ? "/logos/rext_logo_dark.svg"
      : "/logos/rext_logo_light.svg";

  return (
    <Image
      src={logoSrc}
      alt="Rext Logo"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={priority}
    />
  );
}
