export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "suspended";
export type RiskLevel = "safe" | "suspicious" | "dangerous";
export type ScanSource = "url" | "qr";
export type RuleType = "block" | "allow";
export type ReportStatus = "open" | "reviewed" | "resolved";

export interface ReasonItem {
  code: string;
  severity: "info" | "warn" | "danger";
  message: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  source: ScanSource;
  input_value: string;
  final_url: string | null;
  hostname: string | null;
  registrable_domain: string | null;
  risk_level: RiskLevel;
  risk_score: number;
  reasons: ReasonItem[];
  signals: Record<string, Json>;
  redirect_chain: string[];
  ai_explanation: {
    summary?: string;
    bullets?: string[];
    aiVerdict?: RiskLevel;
    confidence?: number;
  };
  engine_version: string;
  created_at: string;
}

export interface DomainRule {
  id: string;
  domain: string;
  rule_type: RuleType;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  scan_id: string | null;
  user_id: string;
  reason: string;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface LearnArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_md: string;
  category: string;
  read_minutes: number;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: Json;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, Json>;
  created_at: string;
}
