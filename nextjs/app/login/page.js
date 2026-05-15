'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

const SLIDES = [
  {
    label: 'Payroll Processing',
    title: 'Automated Monthly\nPayroll Engine',
    desc: 'Process salaries for 190+ employees across 15 departments in minutes.',
  },
  {
    label: 'CFO Approval',
    title: 'Built-In Approval\nWorkflow',
    desc: 'CFO reviews and approves payroll runs before bank transfers are generated.',
  },
  {
    label: 'PDF Payslips',
    title: 'Professional\nPayslip Generation',
    desc: 'Branded PDF payslips delivered instantly for every employee.',
  },
  {
    label: 'Compliance',
    title: 'EOBI, Tax &\nProvident Fund',
    desc: 'Full FBR tax slab compliance with automated EOBI and PF deductions.',
  },
];

const TICKER_ITEMS = [
  '190+ Employees',
  '15 Departments',
  'Admin & Direct Staff',
  'Automated Tax Calculation',
  'EOBI & Provident Fund',
  'CFO Approval Workflow',
  'PDF Payslip Generation',
  'Bank Transfer Lists',
  'FBL · HMB · Cash',
  'WellServe Oilfield Services (Pvt) Ltd',
];

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [paused,   setPaused]   = useState(false);

  const { login } = useAuth();
  const router    = useRouter();
  const canvasRef = useRef(null);

  const total = SLIDES.length;
  const next  = useCallback(() => setCurrent(c => (c + 1) % total), [total]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    const COUNT = 60, MAX_DIST = 160;
    const particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r:  Math.random() * 1.8 + 1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(251,191,36,${0.18 * (1 - dist / MAX_DIST)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251,191,36,0.55)';
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) { login(res.user, res.token); router.push('/dashboard'); }
      else setError(res.error || 'Login failed');
    } catch { setError('Unable to connect to server'); }
    finally { setLoading(false); }
  };

  const fillDemo = (e, em, pw) => { e.preventDefault(); setEmail(em); setPassword(pw); setError(''); };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Scrolling ticker — same as MarketTicker */}
      <div className="bg-zinc-100 border-b border-zinc-200 py-2 overflow-hidden shrink-0">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-zinc-800 tracking-wide">{item}</span>
              <span className="text-zinc-300 ml-2">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Body: left hero + right form */}
      <div className="flex flex-1 min-h-0">

        {/* Left panel — ArticleCarousel style */}
        <div
          className="flex-1 relative overflow-hidden bg-zinc-900 hidden lg:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Dark background */}
          <div className="absolute inset-0 bg-zinc-900" />
          {/* Particle network canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />

          {/* Slides */}
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className="shrink-0 w-full h-full flex flex-col justify-between px-16 py-14"
                style={{ minWidth: '100%' }}
              >
                <div>
                  {/* 3D rotating logo */}
                  <div className="mb-14" style={{ perspective: '600px' }}>
                    <div className="animate-spin-y" style={{ width: 130, position: 'relative', transformStyle: 'preserve-3d' }}>
                      <div style={{ backfaceVisibility: 'hidden' }}>
                        <img src="/wellserve-logo-white.svg" alt="WellServe" width={130} draggable={false} />
                      </div>
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <img src="/wellserve-logo-orange.svg" alt="WellServe" width={130} draggable={false} />
                      </div>
                    </div>
                  </div>
                  <span className="inline-block text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">
                    {slide.label}
                  </span>
                  <h2 className="text-4xl font-bold text-white leading-snug mb-4 whitespace-pre-line">
                    {slide.title}
                  </h2>
                  <p className="text-zinc-400 text-base leading-relaxed max-w-md">
                    {slide.desc}
                  </p>
                </div>

                <div>
                  {/* Dot indicators */}
                  <div className="flex gap-2 mb-5">
                    {SLIDES.map((_, j) => (
                      <button
                        key={j}
                        onClick={() => setCurrent(j)}
                        aria-label={`Go to slide ${j + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          j === current
                            ? 'w-8 bg-amber-400'
                            : 'w-2 bg-white/30 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600">
                    Plot 5-J &amp; 5-K, Street 1, I-10/3, Islamabad
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div
              key={current}
              className="absolute bottom-0 left-0 h-0.5 bg-amber-400 z-10 animate-progress"
            />
          )}
        </div>

        {/* Right panel — login form */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col justify-center px-10 py-12 lg:px-14 border-l border-zinc-200">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src="/wellserve-logo-orange.svg" alt="WellServe" width={100} draggable={false} />
          </div>

          <div className="mb-8">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Secure Access</p>
            <h1 className="text-2xl font-bold text-zinc-900">Sign in</h1>
            <p className="text-zinc-500 text-sm mt-1">HR Payroll Management System</p>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2 mb-5 flex items-center gap-2">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-zinc-600 font-medium mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@wellserve.com"
                className="w-full h-10 px-3 border border-zinc-200 bg-white text-zinc-900 text-sm outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-600 font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  className="w-full h-10 px-3 pr-9 border border-zinc-200 bg-white text-zinc-900 text-sm outline-none focus:border-zinc-900 transition-colors"
                />
                <button
                  type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  {showPass
                    ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-10 bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {loading
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          {/* Quick access */}
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Quick access</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={e => fillDemo(e, 'admin@wellserve.com', 'Admin@123')}
                className="border border-zinc-200 px-3 py-2.5 text-left hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
              >
                <p className="text-xs font-semibold text-zinc-900">Admin</p>
                <p className="text-xs text-zinc-400 truncate">admin@wellserve.com</p>
              </button>
              <button
                onClick={e => fillDemo(e, 'faizan@wellserve.com', 'Admin@123')}
                className="border border-zinc-200 px-3 py-2.5 text-left hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
              >
                <p className="text-xs font-semibold text-zinc-900">CFO</p>
                <p className="text-xs text-zinc-400 truncate">faizan@wellserve.com</p>
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-400 text-center mt-6 leading-relaxed">
            Developed by Zulfiqar Ali Mir<br />
            Black Iron Quantum AI (Pvt) Ltd
          </p>
        </div>

      </div>
    </div>
  );
}
