import { BrandLogo } from "@/components/brand-logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* Left Panel - Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-primary text-primary-foreground p-12">
        {/* Background Pattern - Top Left Grid (Mixed Filled/Transparent) */}
        <div
          className="absolute top-0 left-0 z-0 grid grid-cols-6 w-[300px] h-[300px]"
          style={{
            maskImage: "linear-gradient(135deg, black 0%, transparent 70%)",
            WebkitMaskImage:
              "linear-gradient(135deg, black 0%, transparent 70%)",
          }}
        >
          {/* Row 1 */}
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-b border-white/10"></div>

          {/* Row 2 */}
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10 bg-white/5"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-b border-white/10"></div>

          {/* Row 3 */}
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10 bg-white/10"></div>
          <div className="border-r border-b border-white/10 bg-white/5"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-b border-white/10"></div>

          {/* Row 4 */}
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10 bg-white/5"></div>
          <div className="border-b border-white/10"></div>

          {/* Row 5 */}
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10 bg-white/5"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-r border-b border-white/10"></div>
          <div className="border-b border-white/10"></div>

          {/* Row 6 */}
          <div className="border-r border-white/10"></div>
          <div className="border-r border-white/10"></div>
          <div className="border-r border-white/10"></div>
          <div className="border-r border-white/10"></div>
          <div className="border-r border-white/10"></div>
          <div className=""></div>
        </div>

        {/* Background Pattern - Bottom Right Grid */}
        <div
          className="absolute bottom-0 right-0 z-0 grid grid-cols-3 w-[150px] h-[150px]"
          style={{
            maskImage: "linear-gradient(315deg, black 20%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(315deg, black 20%, transparent 100%)",
          }}
        >
          {/* Row 1 */}
          <div className="border-l border-t border-white/10"></div>
          <div className="border-l border-t border-white/10"></div>
          <div className="border-l border-t border-white/10"></div>

          {/* Row 2 */}
          <div className="border-l border-t border-white/10"></div>
          <div className="border-l border-t border-white/10 bg-white/5"></div>
          <div className="border-l border-t border-white/10"></div>

          {/* Row 3 */}
          <div className="border-l border-t border-white/10"></div>
          <div className="border-l border-t border-white/10"></div>
          <div className="border-l border-t border-white/10 bg-white/10"></div>
        </div>

        {/* Centered Content: Logo & Marketing Copy */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 max-w-lg">
          {/* Logo - Centered and Transparent */}
          <div className="flex items-center justify-center p-8">
            <BrandLogo
              width={150}
              height={50}
              className="object-contain"
              variant="white"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight-title font-outfit">
              Speedy, Easy and Fast Content Generation.
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed font-inter">
              Rext AI helps you set content goals, earn organic traffic, and scale
              your publishing workflow up to 10x faster.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center pt-24 sm:pt-8 p-8 bg-background relative">
        {/* Mobile Header (visible only on small screens) */}
        <div className="absolute top-6 left-6 lg:hidden">
          <BrandLogo width={90} height={28} />
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
