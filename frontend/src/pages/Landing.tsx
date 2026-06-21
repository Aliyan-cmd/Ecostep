import { Link } from 'react-router-dom';
import {
  Leaf, ArrowRight, BarChart3, Camera, Banknote,
  Bell, Shield, Activity, Smartphone, Cloud, Zap, Cpu,
  Microscope, Coins, Trees, ArrowDown, ChevronRight, ExternalLink
} from 'lucide-react';

function FloatingLeaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute text-emerald-400/20 animate-float ${className}`} style={style}>
      <Leaf className="w-full h-full" />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 p-8 hover:shadow-[0_8px_40px_-12px_rgba(5,150,105,0.15)] hover:border-emerald-200/50 transition-all duration-500 hover:-translate-y-1">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-500 border border-emerald-100/50">
        <Icon className="w-7 h-7 text-emerald-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
          {number}
        </div>
        <div className="w-0.5 h-full bg-emerald-200 mt-3" />
      </div>
      <div className="pb-12">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* ========== NAV ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">EcoStep.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:scale-105 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-200/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent" />

        <div className="absolute top-1/4 left-10 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <FloatingLeaf className="w-16 h-16 top-24 left-[15%]" />
        <FloatingLeaf className="w-10 h-10 top-40 right-[20%]" style={{ animationDelay: '1.5s' }} />
        <FloatingLeaf className="w-12 h-12 bottom-32 left-[10%]" style={{ animationDelay: '3s' }} />
        <FloatingLeaf className="w-8 h-8 bottom-48 right-[15%]" style={{ animationDelay: '4.5s' }} />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-100/70 backdrop-blur-sm border border-emerald-200/50 rounded-full px-5 py-2 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800">Real-time Carbon Intelligence</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.08] tracking-tight mb-8 animate-slide-up">
              Track. Reduce.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">Offset.</span>
              {' '}Your Footprint.
            </h1>

            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              EcoStep combines high-fidelity carbon accounting, AI-powered nudges, smart receipt scanning,
              and automated fintech roundups to make sustainable living effortless.
            </p>

            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/register" className="group inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-base px-8 py-4 rounded-full hover:bg-slate-800 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 bg-white text-slate-700 font-bold text-base px-8 py-4 rounded-full border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm">
                Explore Features
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-slate-200/50 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              {[
                { value: '99.9%', label: 'Calculation Accuracy' },
                { value: '5x', label: 'Faster Insights' },
                { value: '10k+', label: 'Active Users' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900">{s.value}</div>
                  <div className="text-sm font-medium text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-emerald-50/30" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-6">
              Platform Capabilities
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Enterprise-grade tools to measure, reduce, and offset your carbon footprint.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={BarChart3}
              title="Carbon Accounting Engine"
              description="High-accuracy calculators for transportation, home utilities with grid-aware emission factors, and dietary footprints. Get precise CO₂e measurements."
            />
            <FeatureCard
              icon={Activity}
              title="Webhook Ingestion"
              description="Streamline automated data tracking by receiving async payloads from smart home meters and mobility trackers via a secure API gateway."
            />
            <FeatureCard
              icon={Bell}
              title="AI Nudge Engine"
              description="Context-aware micro-actions evaluated against real-time weather, grid carbon intensity, and your historical data for maximum impact."
            />
            <FeatureCard
              icon={Camera}
              title="Smart Receipt Scanner"
              description="Built-in computer vision (OCR) to scan paper receipts, extract purchase items, and automatically categorize their carbon impact."
            />
            <FeatureCard
              icon={Coins}
              title="Fintech Eco-Roundups"
              description="Integrates with banking transactions to round up purchases to the nearest dollar, funding verified carbon offsets with your spare change."
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="AES-256-GCM encryption for sensitive data, JWT authentication, and hardened Nginx security headers protecting the entire platform."
            />
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-6">
                Architecture
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
                How EcoStep Works
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-10">
                From data ingestion to actionable insights — a seamless pipeline
                that turns your everyday activities into measurable climate impact.
              </p>
              <div className="space-y-0">
                <StepCard
                  number="01"
                  title="Ingest Data"
                  description="Connect smart home meters, mobility trackers, or scan receipts. Our webhook gateway and OCR engine capture every data point."
                />
                <StepCard
                  number="02"
                  title="Calculate Footprint"
                  description="The carbon engine processes your data against scientific emission factors — grid-aware utilities, transport modes, and dietary profiles."
                />
                <StepCard
                  number="03"
                  title="Get Smart Nudges"
                  description="AI evaluates weather, grid intensity, and your patterns to recommend high-impact micro-actions tailored to your life."
                />
                <StepCard
                  number="04"
                  title="Offset Automatically"
                  description="Eco-roundups quietly sweep spare change from everyday purchases into verified carbon offset projects. No effort required."
                />
              </div>
            </div>

            {/* Architecture Visual */}
            <div className="relative">
              <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-500 ml-2">system.arch</span>
                </div>

                <div className="space-y-4 text-sm">
                  {/* User */}
                  <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-2xl p-4 text-center">
                    <Smartphone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <div className="font-bold text-emerald-300">User App / Browser</div>
                    <div className="text-[10px] text-emerald-500/70 mt-0.5">HTTPS</div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown className="w-4 h-4 text-slate-600 animate-bounce" />
                  </div>

                  {/* Nginx */}
                  <div className="bg-indigo-900/40 border border-indigo-700/30 rounded-2xl p-4 text-center">
                    <Cpu className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                    <div className="font-bold text-indigo-300">Nginx Reverse Proxy</div>
                    <div className="text-[10px] text-indigo-500/70 mt-0.5">SPA Router + Security Headers</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <ArrowDown className="w-4 h-4 text-slate-600 mx-auto" />
                    </div>
                    <div className="text-center">
                      <ArrowDown className="w-4 h-4 text-slate-600 mx-auto" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-900/40 border border-blue-700/30 rounded-2xl p-4 text-center">
                      <Leaf className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="font-bold text-blue-300 text-xs">React SPA</div>
                      <div className="text-[10px] text-blue-500/70">Frontend</div>
                    </div>
                    <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-2xl p-4 text-center">
                      <Cloud className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <div className="font-bold text-emerald-300 text-xs">FastAPI Backend</div>
                      <div className="text-[10px] text-emerald-500/70">Carbon Engine</div>
                    </div>
                  </div>

                  {/* Backend modules */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-3 text-center">
                      <Microscope className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <div className="font-bold text-amber-300 text-[10px]">OCR Scanner</div>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-3 text-center">
                      <Banknote className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                      <div className="font-bold text-rose-300 text-[10px]">Roundups</div>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-3 text-center">
                      <Bell className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <div className="font-bold text-purple-300 text-[10px]">Nudges</div>
                    </div>
                  </div>

                  {/* Prometheus */}
                  <div className="bg-orange-900/40 border border-orange-700/30 rounded-2xl p-3 text-center">
                    <Activity className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <div className="font-bold text-orange-300 text-[10px]">Prometheus Monitoring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TECH STACK ========== */}
      <section className="relative py-24 sm:py-32 bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 to-white" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 mb-6">
              Technology
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Built With Modern Stack
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Production-grade tools and frameworks powering every layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Leaf, title: 'Frontend', items: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Router'] },
              { icon: Cloud, title: 'Backend', items: ['FastAPI', 'Python 3.12', 'Pydantic v2', 'Uvicorn', 'JWT Auth'] },
              { icon: Shield, title: 'Infrastructure', items: ['Docker', 'Nginx', 'Prometheus', 'Cloud Run', 'SQLite/PostgreSQL'] },
              { icon: Trees, title: 'AI & Fintech', items: ['OCR Engine', 'Nudge AI', 'Plaid Integration', 'AES-256-GCM', 'Eco-Roundups'] },
            ].map((cat) => (
              <div key={cat.title} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-500">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100/50">
                  <cat.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{cat.title}</h3>
                <ul className="space-y-2.5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="relative py-24 sm:py-32 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-emerald-100/80 max-w-2xl mx-auto mb-12 leading-relaxed">
            Join thousands of users taking control of their carbon footprint.
            Start measuring, reducing, and offsetting today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="group inline-flex items-center gap-2 bg-white text-emerald-800 font-bold text-base px-10 py-4 rounded-full hover:bg-emerald-50 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-500/20 text-white font-bold text-base px-10 py-4 rounded-full border border-emerald-400/30 hover:bg-emerald-500/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300">
              <ExternalLink className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">EcoStep.</span>
            </div>
            <p className="text-sm text-slate-500">
              Built with care for the planet. Open source and community driven.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
