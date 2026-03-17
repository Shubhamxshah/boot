"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function LoginPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"login" | "register">(
    searchParams?.get("tab") === "register" ? "register" : "login"
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, #0d3d2e 0%, #061209 60%, #020805 100%)",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <div
            className="rounded-2xl p-8"
            style={{
              background: "rgba(17, 26, 22, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid #1f2e28",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ background: "#0d1f19", border: "1px solid #1f2e28" }}
              >
                ∞
              </div>
              <h1 className="text-2xl font-bold text-[#e8f0ec]">bootx</h1>
              <p className="text-[#6b8a7a] text-sm mt-1">Run anything. From anywhere.</p>
            </div>

            {view === "login" ? (
              <LoginForm onSwitch={() => setView("register")} />
            ) : (
              <RegisterForm onSwitch={() => setView("login")} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
