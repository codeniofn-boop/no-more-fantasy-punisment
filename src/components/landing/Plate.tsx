/**
 * Photographic placeholder. Each plate is a procedurally lit surface rendered
 * with SVG filters (fractal relief, directional light, film grain), so it
 * stays crisp at any resolution and reads as macro photography of concrete,
 * brushed steel, plaster or a corrugated facade rather than an illustration.
 */

export type PlateVariant = "concrete" | "steel" | "louver" | "plaster";
export type PlateRatio = "16/10" | "4/5" | "1/1" | "3/2" | "21/9";

interface PlateProps {
  index: string;
  caption: string;
  variant?: PlateVariant;
  ratio?: PlateRatio;
  className?: string;
  dark?: boolean;
}

const RATIO_CLASS: Record<PlateRatio, string> = {
  "16/10": "aspect-[16/10]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "3/2": "aspect-[3/2]",
  "21/9": "aspect-[21/9]",
};

interface SurfaceSpec {
  type: "fractalNoise" | "turbulence";
  baseFrequency: string;
  numOctaves: number;
  seed: number;
  surfaceScale: number;
  azimuth: number;
  elevation: number;
  /** Output luminance range after lighting, 0-1. */
  tone: [number, number];
  grain: number;
}

const SURFACES: Record<PlateVariant, SurfaceSpec> = {
  concrete: { type: "fractalNoise", baseFrequency: "0.008", numOctaves: 6, seed: 11, surfaceScale: 3.4, azimuth: 230, elevation: 42, tone: [0.13, 0.6], grain: 0.3 },
  steel: { type: "turbulence", baseFrequency: "0.002 0.6", numOctaves: 3, seed: 5, surfaceScale: 2.2, azimuth: 0, elevation: 58, tone: [0.2, 0.72], grain: 0.18 },
  louver: { type: "fractalNoise", baseFrequency: "0.02 0.0015", numOctaves: 3, seed: 2, surfaceScale: 4.2, azimuth: 180, elevation: 38, tone: [0.1, 0.5], grain: 0.22 },
  plaster: { type: "fractalNoise", baseFrequency: "0.006", numOctaves: 6, seed: 19, surfaceScale: 5, azimuth: 300, elevation: 55, tone: [0.7, 0.96], grain: 0.14 },
};

export function Plate({ index, caption, variant = "concrete", ratio = "16/10", className = "", dark = false }: PlateProps) {
  const spec = SURFACES[variant];
  const filterId = `plate-${variant}-${index}`;
  const toneTable = `${spec.tone[0]} ${spec.tone[1]}`;
  const grainIntercept = (1 - spec.grain).toFixed(2);

  return (
    <figure className={className}>
      <div className={`relative overflow-hidden rounded-[2px] bg-[#8a8a8a] ${RATIO_CLASS[ratio]}`}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type={spec.type} baseFrequency={spec.baseFrequency} numOctaves={spec.numOctaves} seed={spec.seed} result="relief" />
              <feDiffuseLighting in="relief" lightingColor="#ffffff" surfaceScale={spec.surfaceScale} diffuseConstant="1" result="lit">
                <feDistantLight azimuth={spec.azimuth} elevation={spec.elevation} />
              </feDiffuseLighting>
              <feComponentTransfer in="lit" result="toned">
                <feFuncR type="table" tableValues={toneTable} />
                <feFuncG type="table" tableValues={toneTable} />
                <feFuncB type="table" tableValues={toneTable} />
                <feFuncA type="table" tableValues="1 1" />
              </feComponentTransfer>
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={spec.seed + 3} result="grain" />
              <feColorMatrix in="grain" type="saturate" values="0" result="grainGray" />
              <feComponentTransfer in="grainGray" result="grainLight">
                <feFuncR type="linear" slope={spec.grain} intercept={grainIntercept} />
                <feFuncG type="linear" slope={spec.grain} intercept={grainIntercept} />
                <feFuncB type="linear" slope={spec.grain} intercept={grainIntercept} />
                <feFuncA type="table" tableValues="1 1" />
              </feComponentTransfer>
              <feBlend in="toned" in2="grainLight" mode="multiply" />
            </filter>
          </defs>
          <rect width="1200" height="800" fill="#8a8a8a" filter={`url(#${filterId})`} />
        </svg>
      </div>
      <figcaption className={`mt-3 flex items-baseline justify-between gap-6 font-mono text-[11px] uppercase tracking-[0.12em] ${dark ? "text-paper/55" : "text-ash"}`}>
        <span>
          <span className={dark ? "text-paper" : "text-ink"}>Fig. {index}</span> — {caption}
        </span>
        <span className="shrink-0">{ratio}</span>
      </figcaption>
    </figure>
  );
}
