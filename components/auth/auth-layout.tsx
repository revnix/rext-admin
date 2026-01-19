import { Circle, Plus } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* Left Panel - Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-blue-600 text-white p-12">
        {/* Background Patterns - Geometric/Dotted (Ref 2 Inspiration) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Dotted Pattern - Bottom Left */}
          <div
            className="absolute bottom-0 left-0 w-64 h-64 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 2px, transparent 2.5px)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          {/* Dotted Pattern - Top Right */}
          <div
            className="absolute top-0 right-0 w-96 h-96 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 2px, transparent 2.5px)",
              backgroundSize: "32px 32px",
            }}
          ></div>

          {/* Geometric Shapes - "X" and Circles */}
          <Plus className="absolute top-24 right-24 text-blue-400/30 w-12 h-12 rotate-12" />
          <Circle className="absolute bottom-1/3 left-12 text-blue-400/20 w-8 h-8 fill-blue-400/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-500/30 rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-blue-500/20 rounded-full opacity-30" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
            Rext
          </div>
        </div>

        {/* Main Visual / Content Middle (Abstract) */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          {/* Abstract Representation of "Content/Dashboard" */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
            {/* We won't put specific UI screenshots like Ref 2 to avoid "generic template" look, instead using typography/shape focus */}
          </div>
        </div>

        {/* Bottom Text Marketing Copy */}
        <div className="relative z-10 max-w-lg space-y-4 mb-8">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Speedy, Easy and Fast Content Generation.
          </h2>
          <p className="text-blue-100/80 text-lg leading-relaxed">
            Rext helps you set content goals, earn organic traffic, and scale
            your publishing workflow up to 10x faster.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex items-center justify-center p-8 bg-background relative">
        {/* Mobile Header (visible only on small screens) */}
        <div className="absolute top-6 left-6 lg:hidden">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            Rext
          </div>
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
