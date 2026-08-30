export function LogoIcon({ size = 24, color = '#5990ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="9" rx="1" />
      <rect x="15" y="3" width="7" height="5" rx="1" />
      <rect x="15" y="12" width="7" height="9" rx="1" />
      <rect x="2" y="16" width="7" height="5" rx="1" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="19" x2="15" y2="19" />
    </svg>
  );
}

function MachineBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(89,144,255,0.22) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 520 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {/* ════════════════════════════════════════
            MACHINE PROCESS FLOW — centre panel
            Represents: Sales → Engineering → Procurement → Build
        ════════════════════════════════════════ */}
        <g opacity="0.22" stroke="#4a7ae0" fill="none">
          {/* Column 1 — Sales / Machine Inquiry */}
          <rect x="40" y="290" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="84" y="317" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            OPPORTUNITY
          </text>

          {/* Column 2 — Engineering */}
          <rect x="216" y="248" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="260" y="275" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            ENGINEERING
          </text>

          <rect x="216" y="336" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="260" y="363" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            TASKS
          </text>

          {/* Column 3 — Procurement */}
          <rect x="392" y="290" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="436" y="317" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            PROCUREMENT
          </text>

          {/* Column 4 — Build / Delivery */}
          <rect x="392" y="400" width="88" height="44" rx="5" strokeWidth="1.5" fill="rgba(26,79,255,0.05)" />
          <text x="436" y="427" textAnchor="middle" fill="#6b9dff" fontSize="9" fontFamily="monospace" opacity="0.7">
            BUILD
          </text>

          {/* Flow arrows — horizontal */}
          <line x1="128" y1="312" x2="216" y2="270" strokeWidth="1.2" />
          <line x1="128" y1="312" x2="216" y2="358" strokeWidth="1.2" />
          <line x1="304" y1="270" x2="392" y2="312" strokeWidth="1.2" />
          <line x1="304" y1="358" x2="392" y2="422" strokeWidth="1.2" />
          <line x1="480" y1="312" x2="520" y2="312" strokeWidth="1.2" />

          {/* Arrow heads */}
          <polygon points="216,266 208,274 224,274" fill="#4a7ae0" opacity="0.5" />
          <polygon points="216,354 208,362 224,362" fill="#4a7ae0" opacity="0.5" />
          <polygon points="392,308 384,316 400,316" fill="#4a7ae0" opacity="0.5" />
          <polygon points="392,418 384,426 400,426" fill="#4a7ae0" opacity="0.5" />

          {/* Node dots at joins */}
          <circle cx="128" cy="312" r="4" fill="#4a7ae0" opacity="0.6" />
          <circle cx="304" cy="270" r="4" fill="#4a7ae0" opacity="0.6" />
          <circle cx="304" cy="358" r="4" fill="#4a7ae0" opacity="0.6" />
          <circle cx="480" cy="312" r="4" fill="#4a7ae0" opacity="0.6" />

          {/* Vertical connector between engineering rows */}
          <line x1="260" y1="292" x2="260" y2="336" strokeWidth="1" strokeDasharray="4 3" />
        </g>

        {/* ════════════════════════════
            TOP-RIGHT: compact module layout
        ════════════════════════════ */}
        <g opacity="0.28" stroke="#5990ff" strokeWidth="1.4" fill="none">
          <rect x="358" y="22" width="72" height="50" rx="4" fill="rgba(26,79,255,0.04)" />
          <rect x="442" y="22" width="44" height="28" rx="4" fill="rgba(26,79,255,0.04)" />
          <rect x="442" y="60" width="44" height="42" rx="4" fill="rgba(26,79,255,0.04)" />
          <rect x="358" y="82" width="72" height="28" rx="4" fill="rgba(26,79,255,0.04)" />
          <line x1="430" y1="43" x2="442" y2="43" />
          <line x1="430" y1="93" x2="442" y2="93" />
          <circle cx="430" cy="43" r="2.5" fill="#5990ff" />
          <circle cx="430" cy="93" r="2.5" fill="#5990ff" />
          <circle cx="442" cy="43" r="2.5" fill="#5990ff" />
          <circle cx="442" cy="93" r="2.5" fill="#5990ff" />
        </g>

        {/* ════════════════════════════
            BOTTOM-LEFT: circuit trace
        ════════════════════════════ */}
        <g opacity="0.3" stroke="#4a7ae0" strokeWidth="1.2" fill="none">
          <path d="M0 800 L42 800 L42 748 L95 748 L95 698" />
          <path d="M0 750 L22 750 L22 700 L65 700" />
          <circle cx="42" cy="800" r="3" fill="#5990ff" />
          <circle cx="95" cy="748" r="3" fill="#5990ff" />
          <circle cx="22" cy="750" r="3" fill="#5990ff" />
          <circle cx="65" cy="700" r="3" fill="#5990ff" />
          <circle cx="95" cy="698" r="3" fill="#5990ff" />
        </g>

        {/* ════════════════════════════
            Dimension ticks — right edge
        ════════════════════════════ */}
        <g opacity="0.2" stroke="#5990ff" strokeWidth="1">
          <line x1="500" y1="480" x2="520" y2="480" />
          <line x1="506" y1="494" x2="520" y2="494" />
          <line x1="510" y1="508" x2="520" y2="508" />
          <line x1="506" y1="522" x2="520" y2="522" />
          <line x1="500" y1="536" x2="520" y2="536" />
        </g>
      </svg>

      {/* Gradient — darkens top & bottom, clear in the middle */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(11,17,32,0.7) 0%, rgba(11,17,32,0.08) 22%, rgba(11,17,32,0.08) 78%, rgba(11,17,32,0.75) 100%)',
        }}
      />
    </div>
  );
}

const features = [
  'One connected flow from enquiry to commissioning',
  'Engineering, procurement and production built around the machine',
  'Real-time visibility into progress, cost, materials and bottlenecks',
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[38%] xl:w-[36%] flex-shrink-0 flex-col bg-[#0b1120] border-r border-[#1a2744] overflow-hidden">
      <MachineBg />

      {/* Logo pinned top */}
      <div className="relative z-10 px-12 pt-12">
        <div className="flex items-center gap-3.5">
          <LogoIcon size={34} color="#5990ff" />
          <span className="text-[26px] font-semibold tracking-tight text-white">
            Machine<span className="font-bold text-brand-400">IQ</span>
          </span>
        </div>
      </div>

      {/* Centred content */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-12 py-16">
        <p className="mb-5 text-[15px] font-bold uppercase tracking-[0.18em] text-brand-500">ERP for Machine Builders</p>

        <h2 className="text-[3.2rem] font-bold leading-[1.1] tracking-tight text-white">
          Run your entire machine-building business in one connected platform.
        </h2>

        <p className="mt-7 text-[17px] leading-relaxed text-slate-400">From sales and engineering to procurement, inventory, production, quality and finance — MachineIQ connects the complete machine lifecycle with the people, costs and decisions behind it.</p>

        <ul className="mt-9 space-y-5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <span className="text-[16px] text-slate-300">{f}</span>
            </li>
          ))}
        </ul>

        {/* Stats row */}
        <div className="mt-12 flex gap-10 border-t border-[#1a2744] pt-9">
          <div>
            <p className="text-[2rem] font-bold text-white">12+</p>
            <p className="mt-1 text-[16px] text-slate-500">Core Modules</p>
          </div>
          <div>
            <p className="text-[2rem] font-bold text-white">100%</p>
            <p className="mt-1 text-[16px] text-slate-500">Visibility</p>
          </div>
          <div>
            <p className="text-[2rem] font-bold text-white">Live</p>
            <p className="mt-1 text-[16px] text-slate-500">Collaboration</p>
          </div>
        </div>
      </div>

      {/* Copyright pinned bottom */}
      <div className="relative z-10 px-12 pb-8">
        <p className="text-[16px] text-slate-600">
          &copy; {new Date().getFullYear()} MachineIQ Platform
        </p>
      </div>
    </div>
  );
}
