'use client';

import dynamic from "next/dynamic";

const SplineScene = dynamic(
  async () => {
    const mod = await import("@splinetool/react-spline");
    return { default: mod.default };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-slate-200">
        <span>Loading interactive preview…</span>
      </div>
    ),
  }
);

export function HeroSpline() {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 shadow-2xl md:h-[520px]">
      <SplineScene scene="https://prod.spline.design/Tnx3U0IgeluXFkdh/scene.splinecode" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-indigo-500/10" />
    </div>
  );
}
