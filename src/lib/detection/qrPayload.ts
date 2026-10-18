import type { ReasonItem, RiskLevel } from "@/types/database.types";

export interface NonUrlPayloadAnalysis {
  isNonUrl: boolean;
  payloadType?: string;
  actionDescription?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reasons: ReasonItem[];
  bullets: string[];
  summary: string;
}

/**
 * Checks if a scanned QR code payload is a non-URL data type
 * (e.g. Wi-Fi config, Tel, SMS, Mailto, vCard, Payment link, or Plain text).
 */
export function analyzeNonUrlPayload(text: string): NonUrlPayloadAnalysis {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Wi-Fi Configuration
  if (lower.startsWith("wifi:")) {
    return {
      isNonUrl: true,
      payloadType: "Wi-Fi Configuration",
      actionDescription: "Connects your device to a wireless network",
      riskLevel: "suspicious",
      riskScore: 45,
      reasons: [
        {
          code: "QR_WIFI_CONFIG",
          severity: "warn",
          message:
            "This QR code automatically configures a Wi-Fi connection. Connecting to unfamiliar rogue networks can expose your passwords, unencrypted traffic, and session tokens.",
        },
      ],
      bullets: [
        "Attempts to join an external wireless network",
        "Rogue access points can intercept unencrypted traffic",
        "Only connect to networks you personally recognize",
      ],
      summary:
        "Caution advised: This QR code prompts your device to join a Wi-Fi network. Rogue Wi-Fi networks are commonly used in man-in-the-middle attacks.",
    };
  }

  // 2. Payment Deep Links (UPI, GCash, Maya, PayPal, Crypto)
  if (
    lower.startsWith("upi://") ||
    lower.startsWith("gcash://") ||
    lower.startsWith("paymaya://") ||
    lower.startsWith("maya://") ||
    lower.startsWith("paypal://") ||
    lower.startsWith("bitcoin:") ||
    lower.startsWith("ethereum:")
  ) {
    return {
      isNonUrl: true,
      payloadType: "Payment Deep Link",
      actionDescription: "Initiates a financial transfer or payment request",
      riskLevel: "suspicious",
      riskScore: 55,
      reasons: [
        {
          code: "QR_PAYMENT_DEEP_LINK",
          severity: "warn",
          message:
            "This QR code directly initiates a money transfer or payment application. Scammers often place fake payment stickers over legitimate merchant codes.",
        },
      ],
      bullets: [
        "Opens a digital wallet or payment transaction",
        "Verify merchant identity before authorizing payment",
        "Check that the requested amount matches your bill",
      ],
      summary:
        "Caution required: This QR code initiates a payment transaction. Inspect the receiver name and amount carefully before approving.",
    };
  }

  // 3. Telephone Call (tel:)
  if (lower.startsWith("tel:")) {
    return {
      isNonUrl: true,
      payloadType: "Phone Number",
      actionDescription: "Prompts device to dial a phone number",
      riskLevel: "safe",
      riskScore: 10,
      reasons: [
        {
          code: "QR_TEL_LINK",
          severity: "info",
          message: "This code prompts your phone dialer to call a phone number.",
        },
      ],
      bullets: [
        "Opens your phone dialer",
        "Never share OTPs or passwords over unsolicited calls",
      ],
      summary: "This QR code contains a telephone number for direct calling.",
    };
  }

  // 4. SMS / Text Message (sms:, smsto:)
  if (lower.startsWith("sms:") || lower.startsWith("smsto:")) {
    return {
      isNonUrl: true,
      payloadType: "SMS Message",
      actionDescription: "Drafts a text message to a specific number",
      riskLevel: "safe",
      riskScore: 10,
      reasons: [
        {
          code: "QR_SMS_LINK",
          severity: "info",
          message: "This code opens a pre-composed SMS draft in your messaging app.",
        },
      ],
      bullets: [
        "Opens SMS text composition",
        "Review the destination number and message body before sending",
      ],
      summary: "This QR code drafts a standard SMS message.",
    };
  }

  // 5. Email (mailto:)
  if (lower.startsWith("mailto:")) {
    return {
      isNonUrl: true,
      payloadType: "Email Draft",
      actionDescription: "Drafts an email to a recipient",
      riskLevel: "safe",
      riskScore: 5,
      reasons: [
        {
          code: "QR_MAILTO_LINK",
          severity: "info",
          message: "This code drafts an email message in your default mail app.",
        },
      ],
      bullets: ["Opens your email client", "Verify recipient before sending"],
      summary: "This QR code opens an email draft to an address.",
    };
  }

  // 6. Contact Card (vCard) or Calendar Event
  if (trimmed.startsWith("BEGIN:VCARD") || trimmed.startsWith("BEGIN:VEVENT")) {
    return {
      isNonUrl: true,
      payloadType: "Contact Card (vCard)",
      actionDescription: "Imports a contact into your address book",
      riskLevel: "safe",
      riskScore: 0,
      reasons: [
        {
          code: "QR_VCARD",
          severity: "info",
          message: "This code contains digital contact business card details.",
        },
      ],
      bullets: ["Contains digital contact data", "Verify contact details before saving"],
      summary: "This QR code contains contact card (vCard) data.",
    };
  }

  // 7. Check if it's an HTTP/HTTPS or looks like a web link (contains domain suffix)
  const isWebLink =
    /^https?:\/\//i.test(trimmed) ||
    /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(:\d+)?(\/.*)?$/i.test(trimmed);

  if (!isWebLink) {
    return {
      isNonUrl: true,
      payloadType: "Plain Text Note",
      actionDescription: "Displays plain text information",
      riskLevel: "safe",
      riskScore: 0,
      reasons: [
        {
          code: "QR_PLAIN_TEXT",
          severity: "info",
          message: "This QR code contains raw text and does not link to any website or web service.",
        },
      ],
      bullets: ["Static unformatted text", "No internet connection or navigation required"],
      summary: "This QR code contains plain text without any web link or action.",
    };
  }

  return {
    isNonUrl: false,
    riskLevel: "safe",
    riskScore: 0,
    reasons: [],
    bullets: [],
    summary: "",
  };
}
