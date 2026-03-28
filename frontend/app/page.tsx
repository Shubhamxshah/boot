"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogoMark, LogoLockup } from "@/components/Logo";

// ── Pricing data ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Starter",
    price: "₹500",
    credits: "2,000",
    badge: null,
    desc: "Get started and see what your browser can really do.",
    features: ["2,000 compute credits", "All apps included", "GPU-accelerated sessions", "Persistent storage"],
    cta: "Get started",
    href: "/app",
    dark: false,
    mail: false,
  },
  {
    name: "Pro",
    price: "₹2,000",
    credits: "10,000",
    badge: "Most popular",
    desc: "For power users who live inside Blender or VS Code.",
    features: ["10,000 compute credits", "Priority GPU allocation", "All apps included", "Priority support"],
    cta: "Go Pro",
    href: "/app",
    dark: true,
    mail: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    credits: "Unlimited",
    badge: null,
    desc: "For teams, labs, and institutions.",
    features: ["Unlimited credits", "Dedicated GPU nodes", "SSO & team management", "SLA + dedicated support"],
    cta: "Contact us",
    href: "mailto:shubham@bootx.in?subject=bootx%20Enterprise%20Inquiry",
    dark: false,
    mail: true,
  },
];

// ── Icons ──────────────────────────────────────────────────────────────────────

function IcBolt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IcGpu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <rect x="6" y="10" width="12" height="4" rx="1" />
      <line x1="6" y1="6" x2="6" y2="4" /><line x1="10" y1="6" x2="10" y2="4" />
      <line x1="14" y1="6" x2="14" y2="4" /><line x1="18" y1="6" x2="18" y2="4" />
      <line x1="6" y1="18" x2="6" y2="20" /><line x1="10" y1="18" x2="10" y2="20" />
      <line x1="14" y1="18" x2="14" y2="20" /><line x1="18" y1="18" x2="18" y2="20" />
    </svg>
  );
}
function IcDevices() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="14" height="11" rx="2" /><rect x="9" y="17" width="13" height="7" rx="2" />
      <line x1="9" y1="14" x2="9" y2="17" />
    </svg>
  );
}
function IcZap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IcCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IcArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Browser mockup ─────────────────────────────────────────────────────────────

function BrowserMockup() {
  return (
    <div style={{
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
      background: "#1a1b26",
      userSelect: "none",
    }}>
      {/* Chrome bar */}
      <div style={{
        background: "#22232f",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#FF5F57", "#FFBD2E", "#28C840"].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, maxWidth: 340, margin: "0 auto",
          background: "rgba(255,255,255,0.07)",
          borderRadius: 5, padding: "3px 10px",
          fontSize: 11, color: "rgba(255,255,255,0.38)",
          display: "flex", alignItems: "center", gap: 5, fontFamily: "monospace",
        }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="rgba(255,255,255,0.3)">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zM2.27 7.29A5 5 0 012 6c0-.45.07-.88.19-1.29h7.62A5 5 0 0110 6c0 .45-.07.88-.19 1.29H2.27z"/>
          </svg>
          app.bootx.in/session/blender-4.1
        </div>
        <div style={{ width: 44 }} />
      </div>

      {/* App viewport */}
      <div style={{ display: "flex", height: 360 }}>
        {/* Toolbar */}
        <div style={{
          width: 38,
          background: "#1e1f2b",
          borderRight: "1px solid rgba(255,255,255,0.04)",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 8, gap: 4,
        }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: 26, height: 26,
              borderRadius: 5,
              background: i === 1 ? "rgba(0,200,150,0.2)" : "transparent",
              border: i === 1 ? "1px solid rgba(0,200,150,0.4)" : "1px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: i === 0 ? 10 : i === 1 ? 8 : 9,
                height: i === 0 ? 10 : i === 1 ? 8 : 9,
                borderRadius: i === 2 ? "50%" : 2,
                background: i === 1 ? "#00C896" : "rgba(255,255,255,0.2)",
                transform: i === 3 ? "rotate(45deg)" : "none",
              }} />
            </div>
          ))}
        </div>

        {/* 3D viewport */}
        <div style={{ flex: 1, background: "#1a1b26", position: "relative", overflow: "hidden" }}>
          {/* Grid floor */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }} />
          {/* Center glow */}
          <div style={{
            position: "absolute",
            width: 300, height: 260,
            top: "50%", left: "50%",
            transform: "translate(-50%,-52%)",
            background: "radial-gradient(ellipse, rgba(0,200,150,0.09) 0%, transparent 68%)",
            pointerEvents: "none",
          }} />

          {/* SVG mesh — stylised 3D sphere */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 520 360" preserveAspectRatio="xMidYMid meet">
            {/* Shadow blob */}
            <ellipse cx="260" cy="300" rx="95" ry="14" fill="rgba(0,0,0,0.35)" />
            {/* Sphere outline */}
            <circle cx="260" cy="168" r="112" fill="none" stroke="rgba(0,200,150,0.28)" strokeWidth="1.2" />
            {/* Latitude lines */}
            {[60,100,138,176,212,250].map((cy, i) => (
              <ellipse key={cy} cx="260" cy={cy} rx={[24,60,95,108,90,48][i]} ry="8"
                fill="none" stroke="rgba(0,200,150,0.18)" strokeWidth="0.8" />
            ))}
            {/* Longitude lines */}
            <path d="M260 56 Q310 168 260 280" fill="none" stroke="rgba(0,200,150,0.15)" strokeWidth="0.8"/>
            <path d="M260 56 Q210 168 260 280" fill="none" stroke="rgba(0,200,150,0.15)" strokeWidth="0.8"/>
            <path d="M260 56 Q350 120 340 200 Q330 260 260 280" fill="none" stroke="rgba(0,200,150,0.12)" strokeWidth="0.8"/>
            <path d="M260 56 Q170 120 180 200 Q190 260 260 280" fill="none" stroke="rgba(0,200,150,0.12)" strokeWidth="0.8"/>
            {/* Highlighted selected face */}
            <path d="M260 56 L330 100 L340 168" fill="rgba(0,200,150,0.07)" stroke="#00C896" strokeWidth="1.5"/>
            <circle cx="260" cy="56" r="4" fill="#00C896" />
            <circle cx="330" cy="100" r="3" fill="#00C896" fillOpacity="0.8" />
            <circle cx="340" cy="168" r="3" fill="#00C896" fillOpacity="0.8" />
            {/* Axis gizmo */}
            <line x1="460" y1="320" x2="490" y2="320" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="460" y1="320" x2="460" y2="290" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="460" y1="320" x2="445" y2="335" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="494" y="323" fill="#ef4444" fontSize="8" fontFamily="monospace">X</text>
            <text x="458" y="287" fill="#22c55e" fontSize="8" fontFamily="monospace">Y</text>
            <text x="436" y="340" fill="#3b82f6" fontSize="8" fontFamily="monospace">Z</text>
          </svg>

          {/* Corner info */}
          <div style={{ position:"absolute", top:8, left:10, fontSize:9, color:"rgba(255,255,255,0.3)", fontFamily:"monospace" }}>
            Perspective · User
          </div>
          <div style={{ position:"absolute", bottom:10, right:12, textAlign:"right", fontFamily:"monospace", fontSize:9, color:"rgba(255,255,255,0.28)", lineHeight:1.7 }}>
            <div>NVIDIA RTX 4090 · 24 GB</div>
            <div style={{color:"#00C896"}}>● 0.4s/frame · GPU active</div>
          </div>
        </div>

        {/* Properties panel */}
        <div style={{
          width: 172,
          background: "#1e1f2b",
          borderLeft: "1px solid rgba(255,255,255,0.04)",
          padding: "10px 8px",
          fontSize: 10,
          fontFamily: "monospace",
        }}>
          <div style={{ color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontSize:9 }}>Scene</div>
          {["Sphere.001","Camera","Sun Light","Ground"].map((n, i) => (
            <div key={n} style={{
              padding:"4px 7px", borderRadius:4, marginBottom:2,
              background: i===0 ? "rgba(0,200,150,0.15)" : "transparent",
              color: i===0 ? "#00C896" : "rgba(255,255,255,0.38)",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <div style={{ width:6,height:6,borderRadius:i===2?"50%":1,background:i===0?"#00C896":"rgba(255,255,255,0.25)" }}/>
              {n}
            </div>
          ))}
          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 0" }}/>
          <div style={{ color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontSize:9 }}>Material</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <div style={{ width:24,height:24,borderRadius:6,background:"linear-gradient(135deg,#00C896,#0ea5e9)" }}/>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:9 }}>Glass · Metallic</div>
          </div>
          {[["Roughness","0.0"],["Metallic","1.0"],["IOR","1.45"]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ color:"rgba(255,255,255,0.3)" }}>{k}</span>
              <span style={{ color:"rgba(255,255,255,0.6)" }}>{v}</span>
            </div>
          ))}
          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"10px 0" }}/>
          <div style={{ color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, fontSize:9 }}>Render</div>
          <div style={{ background:"rgba(0,200,150,0.12)", borderRadius:5, padding:"4px 7px", color:"#00C896", fontSize:9, textAlign:"center" }}>
            Cycles · GPU Compute
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background:"#22232f",
        borderTop:"1px solid rgba(255,255,255,0.04)",
        padding:"5px 14px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.28)", fontFamily:"monospace" }}>
          Blender 4.1 · Verts: 2,048 · Faces: 960
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:5,height:5,borderRadius:"50%",background:"#00C896",boxShadow:"0 0 4px #00C896" }}/>
          <span style={{ fontSize:9, color:"#00C896", fontFamily:"monospace" }}>GPU session active</span>
        </div>
      </div>
    </div>
  );
}

// ── Scroll reveal ──────────────────────────────────────────────────────────────

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .lp, .lp * { box-sizing: border-box; }
        .lp { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .lp a { text-decoration: none; }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; background:#00C896; color:#0A1A14; padding:13px 26px; border-radius:12px; font-weight:700; font-size:0.95rem; transition:background 0.15s,transform 0.15s; }
        .btn-primary:hover { background:#00B585; transform:translateY(-1px); }
        .btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:13px 22px; border:1.5px solid #D1D5DB; border-radius:12px; font-weight:600; font-size:0.95rem; color:#374151; transition:border-color 0.15s,background 0.15s,transform 0.15s; }
        .btn-ghost:hover { border-color:#9CA3AF; background:#F9FAFB; transform:translateY(-1px); }
        .feature-card:hover { border-color:#A7F3D0 !important; background:#F0FDF9 !important; }
        .step-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,0.08) !important; }
        .usecase-card:hover { transform:translateY(-3px); }
        .plan-card-outline:hover { border-color:#A7F3D0 !important; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      <div className="lp" style={{ background:"#fff", color:"#0D1117", minHeight:"100vh", overflowX:"hidden" }}>

        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <header style={{
          position:"fixed", top:0, left:0, right:0, zIndex:100,
          height:60, display:"flex", alignItems:"center",
          padding:"0 max(20px, calc((100vw - 1100px)/2))",
          justifyContent:"space-between",
          transition:"all 0.25s",
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid #F3F4F6" : "1px solid transparent",
        }}>
          <LogoLockup size={26} textColor="#0D1117" />
          <nav style={{ display:"flex", alignItems:"center", gap:28, position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
            {[["Features","#features"],["How it works","#how"],["Pricing","#pricing"]].map(([l,h])=>(
              <a key={l} href={h} style={{ fontSize:"0.875rem", fontWeight:500, color:"#6B7280", transition:"color 0.15s" }}
                onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color="#0D1117")}
                onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color="#6B7280")}>
                {l}
              </a>
            ))}
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Link href="/app" style={{ fontSize:"0.875rem", fontWeight:600, color:"#374151", padding:"8px 16px" }}>
              Sign in
            </Link>
            <Link href="/app" className="btn-primary" style={{ padding:"9px 20px", borderRadius:10, fontSize:"0.875rem" }}>
              Start free
            </Link>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section style={{
          paddingTop:120,
          paddingBottom:0,
          paddingLeft:"max(20px, calc((100vw - 1100px)/2))",
          paddingRight:"max(20px, calc((100vw - 1100px)/2))",
          textAlign:"center",
          background:"linear-gradient(180deg, #ECFDF8 0%, #F0FDF9 30%, #FAFFFE 60%, #fff 100%)",
          position:"relative",
          overflow:"hidden",
        }}>
          {/* Subtle glow */}
          <div style={{
            position:"absolute", top:"-10%", left:"50%", transform:"translateX(-50%)",
            width:700, height:400, pointerEvents:"none",
            background:"radial-gradient(ellipse, rgba(0,200,150,0.12) 0%, transparent 68%)",
          }}/>

          <motion.div initial="hidden" animate="visible" variants={{ visible:{ transition:{ staggerChildren:0.1 }}}} >
            {/* Badge */}
            <motion.div variants={reveal} style={{ marginBottom:24 }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:7,
                fontSize:"0.8125rem", fontWeight:600,
                padding:"6px 14px 6px 8px",
                borderRadius:100,
                background:"rgba(0,200,150,0.1)",
                border:"1px solid rgba(0,200,150,0.25)",
                color:"#059669",
              }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  background:"#00C896", color:"#fff",
                  fontSize:"0.7rem", fontWeight:700,
                  padding:"2px 8px", borderRadius:100,
                }}>NEW</span>
                Blender + Gazebo now available
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={reveal} style={{
              fontSize:"clamp(2.8rem, 7vw, 5.25rem)",
              fontWeight:800,
              letterSpacing:"-0.035em",
              lineHeight:1.06,
              color:"#0D1117",
              marginBottom:20,
              maxWidth:820,
              margin:"0 auto 20px",
            }}>
              Run GPU apps.<br />
              <span style={{
                background:"linear-gradient(135deg, #00C896 0%, #00A878 100%)",
                WebkitBackgroundClip:"text",
                WebkitTextFillColor:"transparent",
                backgroundClip:"text",
              }}>In your browser.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p variants={reveal} style={{
              fontSize:"1.125rem", color:"#6B7280", maxWidth:480,
              margin:"0 auto 36px", lineHeight:1.7,
            }}>
              Blender, VS Code, Gazebo — fully GPU-accelerated,<br />
              running in a browser tab. No install. No expensive laptop.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={reveal} style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:64 }}>
              <Link href="/app" className="btn-primary">
                Start for free <IcArrow />
              </Link>
              <a href="#pricing" className="btn-ghost">
                Get credits
              </a>
            </motion.div>
          </motion.div>

          {/* Browser mockup */}
          <motion.div
            initial={{ opacity:0, y:40 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, delay:0.5, ease:"easeOut" }}
            style={{
              maxWidth:960,
              margin:"0 auto",
              position:"relative",
              animation:"float 6s ease-in-out infinite",
            }}
          >
            {/* Soft shadow beneath mockup */}
            <div style={{
              position:"absolute", bottom:-24, left:"10%", right:"10%",
              height:40,
              background:"radial-gradient(ellipse, rgba(0,200,150,0.18) 0%, transparent 70%)",
              filter:"blur(12px)",
            }}/>
            <BrowserMockup />
          </motion.div>
        </section>

        {/* ── App strip ──────────────────────────────────────────────────── */}
        <section style={{ background:"#fff", padding:"56px max(20px, calc((100vw - 1100px)/2)) 40px" }}>
          <p style={{ textAlign:"center", fontSize:"0.8125rem", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:24 }}>
            Run any of these — today, from your browser
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"10px 32px" }}>
            {["Blender", "VS Code", "Gazebo / ROS", "Ubuntu Desktop", "MATLAB", "Jupyter"].map(app => (
              <span key={app} style={{ fontSize:"1rem", fontWeight:700, color:"#D1D5DB", letterSpacing:"-0.01em" }}>
                {app}
              </span>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section id="features" style={{
          padding:"96px max(20px, calc((100vw - 1100px)/2))",
          background:"#F9FAFB",
          borderTop:"1px solid #F3F4F6",
        }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible:{ transition:{ staggerChildren:0.08 }}}}>
            <motion.div variants={reveal} style={{ textAlign:"center", marginBottom:64 }}>
              <h2 style={{ fontSize:"clamp(1.75rem, 4vw, 2.6rem)", fontWeight:800, letterSpacing:"-0.025em", color:"#0D1117", marginBottom:12 }}>
                Built different.
              </h2>
              <p style={{ fontSize:"1.05rem", color:"#6B7280" }}>
                Heavy apps. Lightweight requirements.
              </p>
            </motion.div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:20 }}>
              {[
                { Icon:IcBolt,     title:"Instant launch",      desc:"Your app is running in under 2 seconds. No install wizard, no driver hell, no reboot." },
                { Icon:IcGpu,      title:"Real GPU compute",     desc:"NVIDIA RTX 4090 under the hood. Render, train, simulate — at the speed you deserve." },
                { Icon:IcDevices,  title:"Runs on anything",     desc:"Old MacBook, iPad, Chromebook. If it has a browser, it runs bootx. Seriously." },
                { Icon:IcZap,      title:"Zero setup",           desc:"We handle the drivers, the RAM, the cooling. You just open a tab and get to work." },
              ].map(({ Icon, title, desc }, i) => (
                <motion.div key={title} custom={i} variants={reveal}
                  className="feature-card"
                  style={{
                    background:"#fff",
                    border:"1.5px solid #E5E7EB",
                    borderRadius:16,
                    padding:"28px 24px",
                    transition:"border-color 0.2s, background 0.2s",
                    cursor:"default",
                  }}
                >
                  <div style={{
                    width:44, height:44, borderRadius:12, marginBottom:18,
                    background:"#ECFDF8",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#00C896",
                  }}>
                    <Icon />
                  </div>
                  <h3 style={{ fontWeight:700, fontSize:"1.0625rem", color:"#0D1117", marginBottom:8 }}>{title}</h3>
                  <p style={{ fontSize:"0.9rem", color:"#6B7280", lineHeight:1.65 }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section id="how" style={{ padding:"96px max(20px, calc((100vw - 1100px)/2))", background:"#fff" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible:{ transition:{ staggerChildren:0.1 }}}}>
            <motion.div variants={reveal} style={{ textAlign:"center", marginBottom:72 }}>
              <h2 style={{ fontSize:"clamp(1.75rem, 4vw, 2.6rem)", fontWeight:800, letterSpacing:"-0.025em", color:"#0D1117", marginBottom:12 }}>
                Up in 30 seconds.
              </h2>
              <p style={{ fontSize:"1.05rem", color:"#6B7280" }}>
                Three steps. No more.
              </p>
            </motion.div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:20, position:"relative" }}>
              {[
                { num:"01", title:"Open bootx",        desc:"Visit app.bootx.in from any device. Sign in with Google. That's it." },
                { num:"02", title:"Pick your app",     desc:"Choose Blender, VS Code, Gazebo, or Ubuntu. Click launch." },
                { num:"03", title:"Start working",     desc:"Your GPU session is live. Stream it, use it, build things. Go." },
              ].map(({ num, title, desc }, i) => (
                <motion.div key={num} custom={i} variants={reveal}
                  className="step-card"
                  style={{
                    border:"1.5px solid #E5E7EB",
                    borderRadius:16, padding:"32px 28px",
                    background:"#fff",
                    transition:"transform 0.2s, box-shadow 0.2s",
                    boxShadow:"0 4px 16px rgba(0,0,0,0.04)",
                    cursor:"default",
                    position:"relative",
                  }}
                >
                  <div style={{
                    position:"absolute", top:28, right:28,
                    fontSize:"2.5rem", fontWeight:900,
                    color:"#F3F4F6",
                    letterSpacing:"-0.04em",
                    lineHeight:1,
                  }}>{num}</div>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:"linear-gradient(135deg, #00C896, #00A878)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    marginBottom:20,
                    color:"#fff", fontWeight:800, fontSize:"0.9rem",
                  }}>{i + 1}</div>
                  <h3 style={{ fontWeight:700, fontSize:"1.0625rem", color:"#0D1117", marginBottom:8 }}>{title}</h3>
                  <p style={{ fontSize:"0.9rem", color:"#6B7280", lineHeight:1.65 }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Use cases ─────────────────────────────────────────────────── */}
        <section style={{ padding:"96px max(20px, calc((100vw - 1100px)/2))", background:"#F9FAFB", borderTop:"1px solid #F3F4F6" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible:{ transition:{ staggerChildren:0.08 }}}}>
            <motion.div variants={reveal} style={{ marginBottom:64, textAlign:"center" }}>
              <h2 style={{ fontSize:"clamp(1.75rem, 4vw, 2.6rem)", fontWeight:800, letterSpacing:"-0.025em", color:"#0D1117", marginBottom:12 }}>
                Who's it for?
              </h2>
              <p style={{ fontSize:"1.05rem", color:"#6B7280" }}>Spoiler: probably you.</p>
            </motion.div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16 }}>
              {([
                {
                  label:"3D Artists", app:"Blender", desc:"Render in Cycles on an RTX 4090. From a browser tab.", color:"#7C3AED",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M14 4L24 10V18L14 24L4 18V10L14 4Z" stroke="#7C3AED" strokeWidth="1.8" strokeLinejoin="round"/>
                      <path d="M14 4V24M4 10L24 18M24 10L4 18" stroke="#7C3AED" strokeWidth="1.2" strokeOpacity="0.4" strokeLinejoin="round"/>
                      <circle cx="14" cy="14" r="3" fill="#7C3AED" fillOpacity="0.25" stroke="#7C3AED" strokeWidth="1.4"/>
                    </svg>
                  ),
                },
                {
                  label:"Robotics Devs", app:"Gazebo + ROS 2", desc:"Simulate environments. No workstation needed.", color:"#2563EB",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="9" y="9" width="10" height="10" rx="2" stroke="#2563EB" strokeWidth="1.8"/>
                      <path d="M14 3V7M14 21V25M3 14H7M21 14H25" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M6.5 6.5L9.5 9.5M18.5 18.5L21.5 21.5M21.5 6.5L18.5 9.5M9.5 18.5L6.5 21.5" stroke="#2563EB" strokeWidth="1.4" strokeOpacity="0.5" strokeLinecap="round"/>
                      <circle cx="14" cy="14" r="2" fill="#2563EB"/>
                    </svg>
                  ),
                },
                {
                  label:"Students", app:"Any tool", desc:"Run MATLAB, Blender, or Linux — even on a school Chromebook.", color:"#D97706",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="3" y="6" width="22" height="14" rx="2.5" stroke="#D97706" strokeWidth="1.8"/>
                      <path d="M9 20L8 24H20L19 20" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="7" y="10" width="6" height="4" rx="1" fill="#D97706" fillOpacity="0.2" stroke="#D97706" strokeWidth="1.2"/>
                      <path d="M16 11H21M16 14H19" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  ),
                },
                {
                  label:"Indie Creators", app:"Full stack", desc:"GPU rendering, ML training, video editing. Indie budget, pro output.", color:"#00C896",
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="3" y="7" width="17" height="14" rx="2.5" stroke="#00C896" strokeWidth="1.8"/>
                      <path d="M20 11L25 8V20L20 17" stroke="#00C896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="11.5" cy="14" r="3" fill="#00C896" fillOpacity="0.2" stroke="#00C896" strokeWidth="1.3"/>
                      <path d="M10.5 13L13 14L10.5 15V13Z" fill="#00C896"/>
                    </svg>
                  ),
                },
              ] as { label:string; app:string; desc:string; color:string; icon:React.ReactNode }[]).map(({ icon, label, app, desc, color }, i) => (
                <motion.div key={label} custom={i} variants={reveal}
                  className="usecase-card"
                  style={{
                    background:"#fff",
                    border:"1.5px solid #E5E7EB",
                    borderRadius:16, padding:"28px 22px",
                    transition:"transform 0.2s",
                    cursor:"default",
                  }}
                >
                  <div style={{
                    width:52, height:52, borderRadius:12, marginBottom:18,
                    background:`${color}10`,
                    border:`1.5px solid ${color}25`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{icon}</div>
                  <div style={{
                    display:"inline-block",
                    fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", color, marginBottom:10,
                    padding:"3px 8px", borderRadius:6,
                    background:`${color}14`,
                  }}>{app}</div>
                  <h3 style={{ fontWeight:700, fontSize:"1rem", color:"#0D1117", marginBottom:8 }}>{label}</h3>
                  <p style={{ fontSize:"0.875rem", color:"#6B7280", lineHeight:1.65 }}>{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────────────── */}
        <section style={{ padding:"80px max(20px, calc((100vw - 1100px)/2))", background:"#fff", borderTop:"1px solid #F3F4F6" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible:{ transition:{ staggerChildren:0.1 }}}}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 }}>
              {[
                { quote:"I'm a broke art student with a 2015 MacBook. bootx literally changed how I work. Rendered a full scene in 40 seconds.", handle:"@mx.blends", role:"3D Artist" },
                { quote:"Ran Gazebo on my iPad in a coffee shop. My advisor didn't believe me until I screenshotted the GPU stats.", handle:"@rk_robotics", role:"PhD Researcher, IIT" },
                { quote:"We onboarded a team of 12 interns with zero workstation budget. bootx saved us around ₹40 lakh in hardware.", handle:"@anirudhc_dev", role:"Founder, indie studio" },
              ].map(({ quote, handle, role }, i) => (
                <motion.div key={handle} custom={i} variants={reveal}
                  style={{
                    background:"#FAFAFA",
                    border:"1.5px solid #F3F4F6",
                    borderRadius:16, padding:"28px 24px",
                  }}
                >
                  <div style={{ fontSize:"1.25rem", color:"#D1FAE5", marginBottom:12 }}>❝</div>
                  <p style={{ fontSize:"0.9375rem", color:"#374151", lineHeight:1.7, marginBottom:20, fontStyle:"italic" }}>
                    {quote}
                  </p>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"0.875rem", color:"#0D1117" }}>{handle}</div>
                    <div style={{ fontSize:"0.8125rem", color:"#9CA3AF" }}>{role}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <section id="pricing" style={{ padding:"96px max(20px, calc((100vw - 1100px)/2))", background:"#F9FAFB", borderTop:"1px solid #F3F4F6" }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible:{ transition:{ staggerChildren:0.08 }}}}>
            <motion.div variants={reveal} style={{ textAlign:"center", marginBottom:72 }}>
              <h2 style={{ fontSize:"clamp(1.75rem, 4vw, 2.6rem)", fontWeight:800, letterSpacing:"-0.025em", color:"#0D1117", marginBottom:12 }}>
                Pay for what you use.
              </h2>
              <p style={{ fontSize:"1.05rem", color:"#6B7280" }}>
                Credits-based. No subscription. Start with free credits.
              </p>
            </motion.div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20, alignItems:"start" }}>
              {PLANS.map((plan, i) => (
                <motion.div key={plan.name} custom={i} variants={reveal}
                  className={plan.dark ? "" : "plan-card-outline"}
                  style={{
                    background: plan.dark ? "#0D1117" : "#fff",
                    border: plan.dark ? "none" : "1.5px solid #E5E7EB",
                    borderRadius:20, padding:"32px 28px",
                    position:"relative",
                    boxShadow: plan.dark ? "0 20px 60px rgba(0,0,0,0.15)" : "none",
                    transition:"border-color 0.2s",
                  }}
                >
                  {plan.badge && (
                    <div style={{
                      position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)",
                      background:"#00C896", color:"#0A1A14",
                      fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.06em",
                      padding:"4px 14px", borderRadius:100, whiteSpace:"nowrap", textTransform:"uppercase",
                    }}>{plan.badge}</div>
                  )}
                  <p style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color: plan.dark ? "rgba(255,255,255,0.4)" : "#9CA3AF", marginBottom:10 }}>
                    {plan.name}
                  </p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:"2.5rem", fontWeight:800, letterSpacing:"-0.03em", color: plan.dark ? "#fff" : "#0D1117" }}>
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span style={{ fontSize:"0.875rem", color: plan.dark ? "rgba(255,255,255,0.35)" : "#9CA3AF" }}>one-time</span>
                    )}
                  </div>
                  <p style={{ fontSize:"0.875rem", fontWeight:600, color:"#00C896", marginBottom:6 }}>
                    {plan.credits} credits
                  </p>
                  <p style={{ fontSize:"0.875rem", color: plan.dark ? "rgba(255,255,255,0.45)" : "#6B7280", marginBottom:28, lineHeight:1.55 }}>
                    {plan.desc}
                  </p>
                  <ul style={{ listStyle:"none", padding:0, margin:"0 0 28px", display:"flex", flexDirection:"column", gap:10 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display:"flex", alignItems:"center", gap:10, fontSize:"0.9rem", color: plan.dark ? "rgba(255,255,255,0.72)" : "#374151" }}>
                        <span style={{ color:"#00C896", flexShrink:0 }}><IcCheck /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={plan.href}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      width:"100%", padding:"13px 0", borderRadius:12,
                      fontWeight:700, fontSize:"0.9rem",
                      transition:"all 0.15s",
                      ...(plan.dark
                        ? { background:"#00C896", color:"#0A1A14" }
                        : plan.mail
                        ? { border:"1.5px solid #E5E7EB", color:"#374151" }
                        : { background:"#F3F4F6", color:"#0D1117" }),
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity="0.85"; el.style.transform="translateY(-1px)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity="1"; el.style.transform="translateY(0)"; }}
                  >
                    {plan.mail && <IcMail />}
                    {plan.cta}
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section style={{
          padding:"96px max(20px, calc((100vw - 1100px)/2))",
          background:"linear-gradient(135deg, #0D2E20 0%, #0A1F18 50%, #0D2E1A 100%)",
          textAlign:"center",
        }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once:true }} variants={{ visible:{ transition:{ staggerChildren:0.1 }}}}>
            <motion.p variants={reveal} style={{ fontSize:"0.8125rem", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(0,200,150,0.7)", marginBottom:16 }}>
              No credit card required
            </motion.p>
            <motion.h2 variants={reveal} style={{ fontSize:"clamp(2rem, 5vw, 3.5rem)", fontWeight:800, letterSpacing:"-0.03em", color:"#fff", marginBottom:16, maxWidth:680, margin:"0 auto 16px" }}>
              Run your first GPU app in 30 seconds.
            </motion.h2>
            <motion.p variants={reveal} style={{ fontSize:"1.0625rem", color:"rgba(255,255,255,0.5)", marginBottom:40, maxWidth:440, margin:"0 auto 40px" }}>
              Seriously. Open bootx, pick Blender, hit launch. That's it.
            </motion.p>
            <motion.div variants={reveal} style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <Link href="/app"
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  background:"#00C896", color:"#0A1A14",
                  padding:"14px 30px", borderRadius:12, fontWeight:700, fontSize:"1rem",
                  transition:"all 0.15s",
                }}
                onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.background="#00E5B2"; el.style.transform="translateY(-1px)"; }}
                onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.background="#00C896"; el.style.transform="translateY(0)"; }}
              >
                Start for free <IcArrow />
              </Link>
              <a href="#pricing"
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"14px 26px", borderRadius:12, fontWeight:600, fontSize:"1rem",
                  border:"1.5px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.8)",
                  transition:"all 0.15s",
                }}
                onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.35)"; }}
                onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.borderColor="rgba(255,255,255,0.15)"; }}
              >
                See pricing
              </a>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer style={{ background:"#fff", borderTop:"1px solid #F3F4F6", padding:"40px max(20px, calc((100vw - 1100px)/2))" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-start", gap:32, marginBottom:40 }}>
            <div>
              <LogoLockup size={26} textColor="#0D1117" />
              <p style={{ marginTop:10, fontSize:"0.875rem", color:"#9CA3AF", maxWidth:240, lineHeight:1.6 }}>
                Run anything. From anywhere. On any device.
              </p>
            </div>
            <div style={{ display:"flex", gap:48, flexWrap:"wrap" }}>
              {[
                { label:"Product", links:[["Features","#features"],["Pricing","#pricing"],["How it works","#how"]] },
                { label:"Company", links:[["Contact","mailto:shubham@bootx.in"],["Privacy","#"],["Terms","#"]] },
              ].map(({ label, links }) => (
                <div key={label}>
                  <p style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:14 }}>{label}</p>
                  <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
                    {links.map(([text, href]) => (
                      <li key={text}>
                        <a href={href} style={{ fontSize:"0.875rem", color:"#6B7280", transition:"color 0.15s" }}
                          onMouseEnter={e=>((e.currentTarget as HTMLElement).style.color="#0D1117")}
                          onMouseLeave={e=>((e.currentTarget as HTMLElement).style.color="#6B7280")}>
                          {text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:"0.8125rem", color:"#9CA3AF" }}>© 2026 bootx. All rights reserved.</p>
            <p style={{ fontSize:"0.8125rem", color:"#D1D5DB" }}>Run anything. From anywhere.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
