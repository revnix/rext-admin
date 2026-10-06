import { BrandLogo } from "@/components/brand-logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* Left Panel - Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary text-primary-foreground p-12">
        {/* Centered Content: Logo & Marketing Copy */}
        <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-lg">
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
            <h2 className="text-4xl font-semibold leading-tight tracking-tight-title font-display">
              Speedy, Easy and Fast Content Generation.
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Rext AI helps you set content goals, earn organic traffic, and
              scale your publishing workflow up to 10x faster.
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
