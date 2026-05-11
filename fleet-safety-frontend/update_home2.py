import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

if 'cdn.tailwindcss.com' not in index_html:
    tailwind_script = '''
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script>
      tailwind.config = {
        corePlugins: {
          preflight: false,
        }
      }
    </script>
'''
    index_html = index_html.replace('</head>', tailwind_script + '</head>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(index_html)

# 2. Add custom animation to styles.css
with open('src/styles.css', 'r', encoding='utf-8') as f:
    styles_css = f.read()

custom_css = '''
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
.animate-float {
  animation: float 4s ease-in-out infinite;
}
.text-balance {
  text-wrap: balance;
}
'''
if '@keyframes float' not in styles_css:
    with open('src/styles.css', 'a', encoding='utf-8') as f:
        f.write(custom_css)

# 3. Rewrite HomePage.jsx
jsx_content = """import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="bg-slate-50 text-slate-900 overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* BEGIN: Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200" data-purpose="main-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">Vigilant Driver</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors" href="#features">Features</a>
              <a className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors" href="#how-it-works">How it Works</a>
              <a className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors" href="#security">Security</a>
            </div>
            <div className="flex items-center gap-3">
              <Link className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-all" to="/login">Login</Link>
              <a className="hidden sm:block px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all" href="#contact">Contact Sales</a>
            </div>
          </div>
        </div>
      </nav>
      {/* END: Navigation */}
      
      {/* BEGIN: Hero Section */}
      <header className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden" data-purpose="hero-section">
        {/* Decorative Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Next-Gen Fleet Intelligence
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 text-balance">
                Turn Every Drive Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Safer Decision</span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Vigilant provides edge-AI driver monitoring and real-time safety assurance. Detect fatigue patterns, prevent distractions, and protect your fleet with trusted risk analytics.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2" to="/login">
                  Login to Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </Link>
                <a className="px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center" href="#contact">
                  Contact Sales
                </a>
              </div>
            </div>
            {/* Mockup Visual */}
            <div className="relative lg:ml-4 animate-float" data-purpose="hero-dashboard-mockup">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 m-0">Live Fleet Risk Snapshot</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fleet Risk Score</span>
                    <span className="text-2xl font-extrabold text-slate-900">42.8</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Sessions</span>
                    <span className="text-2xl font-extrabold text-slate-900">26</span>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">Critical Alerts</span>
                    <span className="text-2xl font-extrabold text-red-600">03</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status</span>
                    <div className="mt-1">
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">MEDIUM RISK</span>
                    </div>
                  </div>
                </div>
                {/* Mock Chart */}
                <div className="h-32 w-full bg-slate-100 rounded-lg flex items-end justify-between px-4 pb-2">
                  <div className="w-4 bg-blue-500 rounded-t h-1/2"></div>
                  <div className="w-4 bg-blue-600 rounded-t h-3/4"></div>
                  <div className="w-4 bg-blue-400 rounded-t h-1/3"></div>
                  <div className="w-4 bg-blue-500 rounded-t h-2/3"></div>
                  <div className="w-4 bg-blue-700 rounded-t h-full"></div>
                  <div className="w-4 bg-blue-500 rounded-t h-3/5"></div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold opacity-80 uppercase leading-none mb-1">Safety Up</p>
                    <p className="text-xl font-bold leading-none m-0">+22%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* END: Hero Section */}
      
      {/* BEGIN: Social Proof */}
      <section className="py-12 bg-white border-y border-slate-100" data-purpose="social-proof">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by leading logistics fleets</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
            <span className="text-2xl font-black italic tracking-tighter">TRANS-LNK</span>
            <span className="text-2xl font-black italic tracking-tighter">GLOBALWAY</span>
            <span className="text-2xl font-black italic tracking-tighter">ROUTEMASTER</span>
            <span className="text-2xl font-black italic tracking-tighter">FLEETCORE</span>
            <span className="text-2xl font-black italic tracking-tighter">CARGOX</span>
          </div>
        </div>
      </section>
      {/* END: Social Proof */}
      
      {/* BEGIN: Features Grid */}
      <section className="py-24 bg-slate-50" data-purpose="features-section" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Platform Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 mt-0">Built for Safety Operations</h3>
            <p className="text-slate-600">A high-performance toolkit designed for fleet managers and safety teams to mitigate risks before they escalate.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 mt-0">Drowsiness Detection</h4>
              <p className="text-slate-500 text-sm leading-relaxed m-0">Continuous eye and face monitoring to detect fatigue patterns in real-time.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 mt-0">Distraction Alerts</h4>
              <p className="text-slate-500 text-sm leading-relaxed m-0">Instant audio-visual alerts to drivers and push notifications to dispatchers.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 mt-0">Risk Score Engine</h4>
              <p className="text-slate-500 text-sm leading-relaxed m-0">Deterministic safety scoring to prioritize interventions and improve driver accountability.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 mt-0">Analytics Insights</h4>
              <p className="text-slate-500 text-sm leading-relaxed m-0">Clear, period-based metrics for sessions, events, and overall fleet health.</p>
            </div>
          </div>
        </div>
      </section>
      {/* END: Features Grid */}
      
      {/* BEGIN: How It Works */}
      <section className="py-24 bg-white" data-purpose="process-section" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-slate-900 m-0">Seamless Integration in 3 Steps</h3>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
            <div className="grid lg:grid-cols-3 gap-12 relative z-10">
              <div className="bg-white flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-xl shadow-blue-600/30">1</div>
                <h5 className="text-xl font-bold text-slate-900 mb-3 mt-0">Install Hardware</h5>
                <p className="text-slate-600 text-sm max-w-xs m-0">Easily mount our plug-and-play AI cameras in any fleet vehicle within minutes.</p>
              </div>
              <div className="bg-white flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-xl shadow-blue-600/30">2</div>
                <h5 className="text-xl font-bold text-slate-900 mb-3 mt-0">Monitor Real-time</h5>
                <p className="text-slate-600 text-sm max-w-xs m-0">Data is streamed to our cloud engine for instant threat detection and analysis.</p>
              </div>
              <div className="bg-white flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-xl shadow-blue-600/30">3</div>
                <h5 className="text-xl font-bold text-slate-900 mb-3 mt-0">Take Action</h5>
                <p className="text-slate-600 text-sm max-w-xs m-0">Receive alerts and use the dashboard to intervene or coach drivers effectively.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: How It Works */}
      
      {/* BEGIN: Security Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden" data-purpose="security-section" id="security">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="p-8 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-8">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                </div>
                <h3 className="text-3xl font-bold mb-6 mt-0">Enterprise-Grade Security</h3>
                <ul className="space-y-4 m-0 p-0 list-none">
                  <li className="flex gap-4">
                    <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    <span>End-to-end encrypted data transmission</span>
                  </li>
                  <li className="flex gap-4">
                    <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    <span>99.9% Uptime SLA for critical safety monitoring</span>
                  </li>
                  <li className="flex gap-4">
                    <svg className="w-6 h-6 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                    <span>GDPR &amp; Fleet Privacy Compliant storage</span>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h2 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-3 mt-0">Reliability First</h2>
              <h3 className="text-4xl font-bold mb-6 mt-0">Data protection you can trust.</h3>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                We understand that fleet safety involves sensitive data. Vigilant is built with a security-first architecture, ensuring that your company and driver information is protected by industry-leading standards.
              </p>
              <a className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors" href="#compliance">
                View Compliance Documentation
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* END: Security Section */}
      
      {/* BEGIN: CTA Section */}
      <section className="py-24 bg-white" data-purpose="cta-section">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10 mt-0">Ready to secure your fleet?</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">Join hundreds of companies reducing accidents and insurance premiums with Vigilant AI.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link className="px-10 py-5 bg-white text-blue-700 font-extrabold rounded-xl hover:bg-slate-100 transition-all shadow-lg text-center" to="/login">
                Get Started Now
              </Link>
              <a className="px-10 py-5 bg-blue-500/20 backdrop-blur-md border border-white/30 text-white font-extrabold rounded-xl hover:bg-white/10 transition-all text-center" href="#contact">
                Schedule a Demo
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* END: CTA Section */}
      
      {/* BEGIN: Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12" data-purpose="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
              </div>
              <span className="font-bold text-slate-900">Vigilant Driver</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-500">
              <a className="hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-blue-600 transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-blue-600 transition-colors" href="#">Support</a>
            </div>
            <p className="text-sm text-slate-400 font-medium m-0">© 2025 Vigilant Fleet Systems. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* END: Footer */}
    </div>
  );
}

export default HomePage;
"""

with open('src/pages/HomePage.jsx', 'w', encoding='utf-8') as f:
    f.write(jsx_content)

print("HomePage refactored and Tailwind injected")
