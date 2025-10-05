"use client";

interface QualityScoreDashboardProps {
  score: number;
}

/**
 * SVG dashboard visualization for quality score
 * Displays a semicircular gauge with color-coded segments and animated needle
 */
export function QualityScoreDashboard({ score }: QualityScoreDashboardProps) {
  // Arc length for semicircle (π * radius)
  const arcLength = 226.19;

  return (
    <div className="text-center mb-6">
      <div className="relative inline-flex items-center justify-center mb-2">
        {/* Dashboard Segments - Perfect Rounded Arc */}
        <svg
          className="w-48 h-32"
          viewBox="0 0 192 128"
          aria-label="Quality score dashboard indicator"
        >
          <title>Quality Score Dashboard</title>
          {/* Background Arc - Perfect Semicircle */}
          <path
            d="M 24 104 A 72 72 0 0 1 168 104"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-muted/20"
          />

          {/* Colored Segments using multiple overlaid arcs */}
          {/* Red Zone (0-25) */}
          <path
            d="M 24 104 A 72 72 0 0 1 168 104"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength * 0.25} ${arcLength * 0.75}`}
            strokeDashoffset="0"
            className={`transition-all duration-1000 ease-out ${
              score >= 0 && score < 25
                ? "text-red-500"
                : score >= 25
                  ? "text-red-300/40"
                  : "text-red-200/20"
            }`}
          />

          {/* Yellow Zone (25-50) */}
          <path
            d="M 24 104 A 72 72 0 0 1 168 104"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength * 0.25} ${arcLength * 0.75}`}
            strokeDashoffset={`-${arcLength * 0.25}`}
            className={`transition-all duration-1000 ease-out ${
              score >= 25 && score < 50
                ? "text-yellow-500"
                : score >= 50
                  ? "text-yellow-300/40"
                  : "text-yellow-200/20"
            }`}
          />

          {/* Blue Zone (50-75) */}
          <path
            d="M 24 104 A 72 72 0 0 1 168 104"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength * 0.25} ${arcLength * 0.75}`}
            strokeDashoffset={`-${arcLength * 0.5}`}
            className={`transition-all duration-1000 ease-out ${
              score >= 50 && score < 75
                ? "text-blue-500"
                : score >= 75
                  ? "text-blue-300/40"
                  : "text-blue-200/20"
            }`}
          />

          {/* Green Zone (75-100) */}
          <path
            d="M 24 104 A 72 72 0 0 1 168 104"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength * 0.25} ${arcLength * 0.75}`}
            strokeDashoffset={`-${arcLength * 0.75}`}
            className={`transition-all duration-1000 ease-out ${
              score >= 75 ? "text-green-500" : "text-green-200/20"
            }`}
          />

          {/* Score Indicator Needle with Gap */}
          <g
            className="transition-transform duration-1000 ease-out"
            style={{
              transformOrigin: "96px 104px",
              transform: `rotate(${-90 + (score / 100) * 180}deg)`,
            }}
          >
            {/* Needle starts with gap from center and doesn't touch the arc */}
            <line
              x1="96"
              y1="88"
              x2="96"
              y2="50"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-foreground drop-shadow-lg"
            />
            <circle
              cx="96"
              cy="104"
              r="7"
              fill="currentColor"
              className="text-foreground"
            />
            {/* Inner circle for better visual */}
            <circle
              cx="96"
              cy="104"
              r="3"
              fill="currentColor"
              className="text-background"
            />
          </g>
        </svg>
      </div>

      {/* Score Display Below Dashboard */}
      <div className="text-center">
        <div className="text-4xl font-bold text-foreground leading-none mb-1">
          {score}
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          out of 100 points
        </div>
      </div>
    </div>
  );
}
