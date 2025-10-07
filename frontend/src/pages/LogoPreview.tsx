export default function LogoPreview() {
  const logos = [
    {
      name: "Option 1: Geometric Play",
      description: "Clean, instantly recognizable, timeless",
      svg: (
        <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <path d="M12 9L23 16L12 23V9Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      name: "Option 2: Streaming Waves",
      description: "Represents audio/video, modern aesthetic",
      svg: (
        <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
          <path d="M8 16h2M14 12v8M20 10v12M26 14v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="4" cy="16" r="2" fill="currentColor"/>
        </svg>
      )
    },
    {
      name: "Option 3: Layered Play Stack",
      description: "Conveys HLS variants, professional depth",
      svg: (
        <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
          <rect x="6" y="6" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
          <rect x="8" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.15"/>
          <path d="M14 10L20 14L14 18V10Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      name: "Option 4: Orbital Play",
      description: "Dynamic, suggests streaming motion",
      svg: (
        <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="10" fill="currentColor" opacity="0.15"/>
          <path d="M13 11L21 16L13 21V11Z" fill="currentColor"/>
          <path d="M16 2C8.3 2 2 8.3 2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          <path d="M30 16c0 7.7-6.3 14-14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        </svg>
      )
    },
    {
      name: "Option 5: Hexagonal Badge",
      description: "Unique brand identity, memorable, professional",
      svg: (
        <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
          <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <path d="M16 6L24 10.5V21.5L16 26L8 21.5V10.5L16 6Z" fill="currentColor" opacity="0.1"/>
          <path d="M13 11L20 16L13 21V11Z" fill="currentColor"/>
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen theme-bg py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold theme-text-primary mb-8">Logo Options Preview</h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="theme-card rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-center h-32 theme-bg rounded-lg">
                <div className="theme-icon-accent">
                  {logo.svg}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg theme-text-primary">{logo.name}</h3>
                <p className="theme-text-secondary text-sm">{logo.description}</p>
              </div>

              {/* Preview in navbar context */}
              <div className="theme-nav rounded-lg p-3">
                <div className="flex items-center space-x-2 theme-text-primary font-bold">
                  <div className="theme-icon-accent">
                    {logo.svg}
                  </div>
                  <span>OnPlay</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Logo for Comparison */}
        <div className="mt-12 theme-card rounded-xl p-6">
          <h2 className="text-xl font-bold theme-text-primary mb-4">Current Logo (for comparison)</h2>
          <div className="theme-nav rounded-lg p-3 inline-flex">
            <div className="flex items-center space-x-2 theme-text-primary font-bold">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/>
                <path d="m16 10-4-4-4 4"/>
                <path d="M12 6v8"/>
                <path d="M8 18h8"/>
              </svg>
              <span>OnPlay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
