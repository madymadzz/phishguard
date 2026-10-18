"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Locale } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (section: keyof typeof translations.en, key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("phishguard_locale") as Locale;
      if (saved === "en" || saved === "fil") {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("phishguard_locale", newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleLocale = () => {
    const next = locale === "en" ? "fil" : "en";
    setLocale(next);
  };

  const t = (section: keyof typeof translations.en, key: string): string => {
    const dict = translations[locale] || translations.en;
    const sec = dict[section] as Record<string, string> | undefined;
    if (sec && sec[key]) {
      return sec[key];
    }
    // Fallback to English
    const fallbackSec = translations.en[section] as Record<string, string> | undefined;
    return (fallbackSec && fallbackSec[key]) || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLanguage();

  return (
    <button
      onClick={toggleLocale}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors select-none ${className || ""}`}
      title={locale === "en" ? "Lumipat sa Filipino" : "Switch to English"}
    >
      <span className={locale === "en" ? "text-[#0B5FFF]" : "text-slate-400"}>EN</span>
      <span className="text-slate-300 dark:text-slate-600">/</span>
      <span className={locale === "fil" ? "text-[#0B5FFF]" : "text-slate-400"}>FIL</span>
    </button>
  );
}
