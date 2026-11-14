type BrandLogoProps = {
  variant?: "full" | "mark";
  className?: string;
};

/** Sperger-Logo (eigenes Asset, getrennt von WOG). */
export function BrandLogo({ variant = "full", className }: BrandLogoProps) {
  const isMark = variant === "mark";
  return (
    <img
      src="/sperger-logo.png"
      alt="Spedition Sperger"
      width={400}
      height={152}
      className={className || (isMark ? "brand-logo-mark" : "brand-logo")}
      decoding="async"
    />
  );
}
