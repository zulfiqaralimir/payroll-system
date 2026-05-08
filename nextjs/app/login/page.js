'use client';

import { useState } from 'react';
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1e3a] flex-col justify-between p-12 relative overflow-hidden">

        {/* Animated background circles */}
        <style>{`
          @keyframes fl0  { 0%,100%{transform:translate(0px,0px)}  25%{transform:translate(15px,20px)}  60%{transform:translate(-8px,10px)}  75%{transform:translate(6px,-18px)} }
          @keyframes fl1  { 0%,100%{transform:translate(0px,0px)}  30%{transform:translate(-10px,25px)} 55%{transform:translate(8px,-12px)}  80%{transform:translate(-5px,15px)} }
          @keyframes fl2  { 0%,100%{transform:translate(0px,0px)}  20%{transform:translate(20px,-15px)} 50%{transform:translate(-10px,8px)}  70%{transform:translate(12px,20px)} }
          @keyframes fl3  { 0%,100%{transform:translate(0px,0px)}  35%{transform:translate(-15px,30px)} 60%{transform:translate(10px,-10px)} 80%{transform:translate(-8px,18px)} }
          @keyframes fl4  { 0%,100%{transform:translate(0px,0px)}  25%{transform:translate(10px,-20px)} 55%{transform:translate(-6px,14px)}  75%{transform:translate(8px,-8px)} }
          @keyframes fl5  { 0%,100%{transform:translate(0px,0px)}  30%{transform:translate(-20px,15px)} 60%{transform:translate(12px,-6px)}  85%{transform:translate(-10px,22px)} }
          @keyframes fl6  { 0%,100%{transform:translate(0px,0px)}  20%{transform:translate(18px,22px)}  50%{transform:translate(-9px,-12px)} 75%{transform:translate(5px,16px)} }
          @keyframes fl7  { 0%,100%{transform:translate(0px,0px)}  40%{transform:translate(-12px,-18px)} 65%{transform:translate(8px,10px)} 85%{transform:translate(-6px,-8px)} }
          @keyframes fl8  { 0%,100%{transform:translate(0px,0px)}  25%{transform:translate(8px,28px)}   55%{transform:translate(-5px,-14px)} 80%{transform:translate(10px,10px)} }
          @keyframes fl9  { 0%,100%{transform:translate(0px,0px)}  30%{transform:translate(-25px,12px)} 60%{transform:translate(14px,-8px)}  80%{transform:translate(-8px,20px)} }
          @keyframes fl10 { 0%,100%{transform:translate(0px,0px)}  35%{transform:translate(15px,-25px)} 60%{transform:translate(-10px,10px)} 85%{transform:translate(8px,-15px)} }
          @keyframes fl11 { 0%,100%{transform:translate(0px,0px)}  20%{transform:translate(-18px,20px)} 55%{transform:translate(10px,-10px)} 75%{transform:translate(-6px,14px)} }
          @keyframes fl12 { 0%,100%{transform:translate(0px,0px)}  30%{transform:translate(12px,-15px)} 60%{transform:translate(-8px,8px)}   80%{transform:translate(6px,20px)} }
          @keyframes fl13 { 0%,100%{transform:translate(0px,0px)}  25%{transform:translate(-8px,30px)}  55%{transform:translate(6px,-16px)}  80%{transform:translate(-12px,8px)} }
          @keyframes fl14 { 0%,100%{transform:translate(0px,0px)}  35%{transform:translate(20px,-20px)} 60%{transform:translate(-12px,12px)} 85%{transform:translate(8px,-6px)} }
          @keyframes fl15 { 0%,100%{transform:translate(0px,0px)}  20%{transform:translate(-15px,18px)} 50%{transform:translate(10px,-10px)} 75%{transform:translate(-6px,22px)} }
          @keyframes fl16 { 0%,100%{transform:translate(0px,0px)}  30%{transform:translate(10px,25px)}  60%{transform:translate(-8px,-14px)} 85%{transform:translate(12px,8px)} }
          @keyframes fl17 { 0%,100%{transform:translate(0px,0px)}  25%{transform:translate(-20px,-10px)} 55%{transform:translate(12px,6px)} 80%{transform:translate(-8px,-18px)} }
        `}</style>

        {[
          { s:80,  t:'7%',  l:'14%', c:'#f97316', o:0.15, d:'12s', dl:'0s'   },
          { s:45,  t:'18%', l:'70%', c:'#fbbf24', o:0.20, d:'18s', dl:'2s'   },
          { s:120, t:'32%', l:'4%',  c:'#06b6d4', o:0.12, d:'15s', dl:'4s'   },
          { s:60,  t:'52%', l:'78%', c:'#8b5cf6', o:0.18, d:'10s', dl:'1s'   },
          { s:35,  t:'68%', l:'38%', c:'#ec4899', o:0.25, d:'20s', dl:'6s'   },
          { s:90,  t:'12%', l:'53%', c:'#10b981', o:0.13, d:'14s', dl:'3s'   },
          { s:50,  t:'78%', l:'18%', c:'#ef4444', o:0.20, d:'16s', dl:'5s'   },
          { s:70,  t:'43%', l:'58%', c:'#f97316', o:0.15, d:'11s', dl:'7s'   },
          { s:40,  t:'22%', l:'28%', c:'#fbbf24', o:0.22, d:'19s', dl:'2.5s' },
          { s:100, t:'58%', l:'48%', c:'#06b6d4', o:0.10, d:'13s', dl:'1.5s' },
          { s:55,  t:'88%', l:'72%', c:'#8b5cf6', o:0.18, d:'17s', dl:'4.5s' },
          { s:85,  t:'4%',  l:'83%', c:'#ec4899', o:0.14, d:'9s',  dl:'8s'   },
          { s:32,  t:'38%', l:'22%', c:'#10b981', o:0.28, d:'22s', dl:'0.5s' },
          { s:65,  t:'72%', l:'8%',  c:'#ef4444', o:0.16, d:'14s', dl:'3.5s' },
          { s:110, t:'48%', l:'88%', c:'#f97316', o:0.11, d:'16s', dl:'6.5s' },
          { s:42,  t:'9%',  l:'42%', c:'#fbbf24', o:0.24, d:'12s', dl:'9s'   },
          { s:78,  t:'28%', l:'63%', c:'#06b6d4', o:0.17, d:'20s', dl:'2s'   },
          { s:95,  t:'63%', l:'33%', c:'#8b5cf6', o:0.13, d:'11s', dl:'7.5s' },
        ].map((c, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            width: c.s, height: c.s,
            top: c.t, left: c.l,
            backgroundColor: c.c,
            opacity: c.o,
            animation: `fl${i} ${c.d} ${c.dl} ease-in-out infinite`,
          }} />
        ))}

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">WellServe</p>
              <p className="text-blue-300 text-xs">Oilfield Services (Pvt) Ltd</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            HR Payroll<br />Management<br />System
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-xs">
            Comprehensive payroll processing for 190+ employees across 15 departments.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
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

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">WellServe Oilfield Services</p>
              <p className="text-gray-400 text-xs">HR Payroll System</p>
            </div>
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
