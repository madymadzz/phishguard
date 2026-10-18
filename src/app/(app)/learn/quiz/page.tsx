"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Trophy,
  History,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface QuizQuestion {
  id: number;
  scenario: string;
  source: string;
  sender: string;
  previewUrl: string;
  isPhish: boolean;
  explanation: string;
  indicators: string[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    scenario: "You receive an SMS saying your e-wallet account has been temporarily restricted due to unverified KYC documents.",
    source: "SMS Message",
    sender: "E-Wallet Notification",
    previewUrl: "https://gcash-verification-update.buzz/kyc",
    isPhish: true,
    explanation: "This is a classic credential harvesting scam. The official domain is gcash.com. The attacker uses '.buzz' with 'gcash' in the subdomain to trick you into submitting your MPIN and OTP.",
    indicators: [
      "Suspicious top-level domain (.buzz)",
      "Brand name placed in subdomain instead of official domain",
      "Artificial panic / urgent threat of account restriction",
    ],
  },
  {
    id: 2,
    scenario: "You receive a password reset confirmation email after you requested one from your school's student portal.",
    source: "Email",
    sender: "no-reply@tip.edu.ph",
    previewUrl: "https://tip.edu.ph/auth/reset-password?token=9f82a",
    isPhish: false,
    explanation: "This is a legitimate link. The registrable domain is tip.edu.ph, the official website of the Technological Institute of the Philippines, and uses valid HTTPS.",
    indicators: [
      "Authentic official school domain (tip.edu.ph)",
      "Official institutional email sender",
      "Direct response to an action you initiated",
    ],
  },
  {
    id: 3,
    scenario: "An email claims unauthorized login activity on your online banking account and urges you to review your security settings immediately.",
    source: "Email",
    sender: "security-alert@bdo-update-system.com",
    previewUrl: "https://bdo.com.ph.security-alert-review.top/login",
    isPhish: true,
    explanation: "Notice the deceptive subdomain structure: 'bdo.com.ph' is just a prefix. The actual registrable domain you are connecting to is 'security-alert-review.top', a malicious spoofing site.",
    indicators: [
      "Subdomain masquerading: actual domain is security-alert-review.top",
      "High-risk TLD (.top) commonly abused by phishing kits",
      "Aggressive urgency forcing you to bypass normal app login",
    ],
  },
  {
    id: 4,
    scenario: "A pasted sticker QR code on a food court dining table says 'Scan here to view digital menu and pay bill directly'.",
    source: "Physical QR Code ('Quishing')",
    sender: "Tabletop Sticker",
    previewUrl: "http://mall-quick-payment-gateway.xyz/pay",
    isPhish: true,
    explanation: "This is a physical Quishing scam. Fraudsters place overlay stickers over authentic QR codes to divert mobile payments to unencrypted malicious portals.",
    indicators: [
      "Physical sticker placed over legitimate merchant signage",
      "Insecure unencrypted HTTP connection instead of HTTPS",
      "Unrecognized generic payment domain (.xyz)",
    ],
  },
  {
    id: 5,
    scenario: "A push notification from Google Chrome prompts you to review critical security settings on your account.",
    source: "Browser Notification",
    sender: "Google Accounts",
    previewUrl: "https://myaccount.google.com/security",
    isPhish: false,
    explanation: "This is a genuine security page hosted on google.com (official sub-domain myaccount.google.com) over encrypted HTTPS.",
    indicators: [
      "Official Google domain (google.com)",
      "Standard legitimate path for Google Account Security",
      "Verified SSL certificate issued to Google LLC",
    ],
  },
];

interface QuizAttempt {
  date: string;
  score: number;
  total: number;
}

export default function SpotThePhishQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [history, setHistory] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("phishguard_quiz_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];

  function handleSelectAnswer(userBelievesPhish: boolean) {
    if (selectedAnswer !== null) return; // Prevent changing after answer
    setSelectedAnswer(userBelievesPhish);

    if (userBelievesPhish === currentQuestion.isPhish) {
      setScore((prev) => prev + 1);
    }
  }

  function handleNext() {
    if (currentIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Finished
      const finalScore = selectedAnswer === currentQuestion.isPhish ? score + 1 : score;
      setIsCompleted(true);

      const attempt: QuizAttempt = {
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        score: finalScore,
        total: QUIZ_QUESTIONS.length,
      };

      const updatedHistory = [attempt, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("phishguard_quiz_history", JSON.stringify(updatedHistory));
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsCompleted(false);
  }

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/learn"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to Learn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Spot the Phish Quiz
          </span>
          <div className="w-8" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-4 space-y-5">
        {!isCompleted ? (
          <>
            {/* Progress bar and counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
                </span>
                <span>Score: {score}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#0B5FFF] transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Scenario Card */}
            <div className="bg-white dark:bg-[#16222E] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B5FFF] px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40">
                  {currentQuestion.source}
                </span>
                <span className="text-xs text-slate-400">From: {currentQuestion.sender}</span>
              </div>

              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {currentQuestion.scenario}
              </p>

              {/* Simulated Link Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0E1620] border border-slate-200 dark:border-slate-800 space-y-1 font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                  Link Preview
                </span>
                <p className="text-xs text-blue-600 dark:text-blue-400 break-all select-all">
                  {currentQuestion.previewUrl}
                </p>
              </div>

              {/* Action Buttons: Phish vs Safe */}
              {selectedAnswer === null ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleSelectAnswer(true)}
                    className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 text-[#E5484D] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Phishing Scam</span>
                  </button>
                  <button
                    onClick={() => handleSelectAnswer(false)}
                    className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/50 text-[#22A559] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Legitimate Link</span>
                  </button>
                </div>
              ) : (
                /* Immediate Feedback Breakdown */
                <div className="space-y-4 pt-2 animate-in fade-in">
                  <div
                    className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      selectedAnswer === currentQuestion.isPhish
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
                        : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200"
                    }`}
                  >
                    {selectedAnswer === currentQuestion.isPhish ? (
                      <CheckCircle2 className="w-5 h-5 text-[#22A559] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#E5484D] shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold">
                        {selectedAnswer === currentQuestion.isPhish
                          ? "Correct! You caught it."
                          : "Incorrect judgment."}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Indicators bullets */}
                  <div className="space-y-1.5 pl-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Key Clues
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {currentQuestion.indicators.map((ind, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0B5FFF] shrink-0" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full py-3 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0A53DE] transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#0B5FFF]/20"
                  >
                    <span>
                      {currentIndex + 1 < QUIZ_QUESTIONS.length
                        ? "Next Question"
                        : "View Final Results"}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Completion Screen */
          <div className="bg-white dark:bg-[#16222E] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 text-[#0B5FFF] flex items-center justify-center mx-auto shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#1F2F3D] dark:text-[#F1F5F9]">
                Quiz Completed!
              </h2>
              <p className="text-xs text-slate-400">
                You scored <strong className="text-[#0B5FFF] text-sm">{score}</strong> out of{" "}
                <strong>{QUIZ_QUESTIONS.length}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0E1620] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {score === 5 ? (
                <span>
                  🌟 <strong>Master Phish Hunter!</strong> You demonstrated perfect vigilance against real-world URL impersonation, deceptive TLDs, and Quishing attacks.
                </span>
              ) : score >= 3 ? (
                <span>
                  🛡️ <strong>Good Defensive Instincts!</strong> You caught most threats, but always double check registrable domains and physical QR codes before proceeding.
                </span>
              ) : (
                <span>
                  ⚠️ <strong>Needs Caution!</strong> Scammers rely on subtlety. Remember to check the registrable domain and never rush into entering credentials.
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 px-4 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0A53DE] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#0B5FFF]/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <Link
                href="/learn"
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16222E] text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
              >
                <span>Back to Learn</span>
              </Link>
            </div>

            {/* Score History List */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  <span>Recent Attempt History</span>
                </span>
                <div className="space-y-1.5">
                  {history.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-[#0E1620] border border-slate-100 dark:border-slate-800 font-mono"
                    >
                      <span className="text-slate-500 font-sans">{att.date}</span>
                      <span className="font-bold text-[#0B5FFF]">
                        {att.score} / {att.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
