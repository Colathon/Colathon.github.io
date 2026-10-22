export default function AuroraBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-background pointer-events-none">
      {/* Soft tinted light blobs */}
      <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-rose-300/20 blur-[120px] animate-aurora-1" />
      <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-sky-300/20 blur-[120px] animate-aurora-2" />
      <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-amber-200/25 blur-[120px] animate-aurora-3" />

      {/* Texture Overlay (Noise) */}
      <div className="absolute inset-0 opacity-[0.025] mix-blend-multiply pointer-events-none"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
}
