'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const router    = useRouter();
  const canvasRef = useRef(null);

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
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 60;
    const MAX_DIST = 130;
    const colors = ['#60a5fa', '#f97316', '#93c5fd', '#fbbf24', '#a78bfa'];

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.55,
      vy:    (Math.random() - 0.5) * 0.55,
      r:     Math.random() * 2 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96,165,250,${0.18 * (1 - dist / MAX_DIST)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        login(res.user, res.token);
        router.push('/dashboard');
      } else {
        setError(res.error || 'Login failed');
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e, em, pw) => {
    e.preventDefault();
    setEmail(em); setPassword(pw); setError('');
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1e3a] flex-col justify-between p-8 relative overflow-hidden">

        {/* Particle network canvas */}
        <style>{`@keyframes spinY{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}`}</style>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-5">
            <div style={{perspective:'600px'}}>
              <img src="/wellserve-logo.svg" alt="WellServe" width={180}
                   style={{animation:'spinY 10s linear infinite'}} />
            </div>
            <p className="text-white font-semibold text-sm mt-2 leading-tight">WellServe Oilfield Services</p>
            <p className="text-blue-300 text-xs">(Pvt) Ltd, Islamabad</p>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-2">
            HR Payroll<br />Management<br />System
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Comprehensive payroll processing for 190+ employees across 15 departments.
          </p>
        </div>

        <div className="relative z-10 space-y-2">
          {[
            ['Payroll Processing',    'Monthly salary with full deductions'],
            ['CFO Approval Workflow', 'Multi-level approval before disbursement'],
            ['PDF Payslips',          'Auto-generated for every employee'],
            ['Bank Transfer Lists',   'FBL, HMB & Cash payment reports'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-blue-300 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-blue-400 text-xs">Plot 5-J & 5-K, Street 1, I-10/3, Islamabad</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex justify-center mb-8">
            <img src="/wellserve-logo.svg" alt="WellServe" width={100} />
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the payroll system</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  autoComplete="email" placeholder="you@wellserve.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    autoComplete="current-password" placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 pr-11 transition" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass
                      ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                {loading
                  ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Signing in...</>
                  : 'Sign in'
                }
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3 text-center">Quick access (demo)</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={e => fillDemo(e, 'admin@wellserve.com', 'Admin@123')}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition text-left">
                  <p className="font-medium text-blue-600">Admin</p>
                  <p className="text-gray-400 truncate">admin@wellserve.com</p>
                </button>
                <button onClick={e => fillDemo(e, 'faizan@wellserve.com', 'Admin@123')}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 hover:border-purple-300 transition text-left">
                  <p className="font-medium text-purple-600">CFO</p>
                  <p className="text-gray-400 truncate">faizan@wellserve.com</p>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            WellServe HR Payroll System — Developed by Zulfiqar Ali Mir<br />
            Black Iron Quantum AI (Pvt) Ltd
          </p>
        </div>
      </div>
    </div>
  );
}
