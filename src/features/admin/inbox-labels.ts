export const REQUEST_STATUS: Record<string, { ar: string; en: string; tone: string }> = {
  new: { ar: "جديد", en: "New", tone: "bg-accent text-on-accent" },
  reviewing: { ar: "قيد المراجعة", en: "Reviewing", tone: "bg-secondary/15 text-secondary" },
  contacted: { ar: "تم التواصل", en: "Contacted", tone: "bg-primary/12 text-primary" },
  proposal_sent: { ar: "أُرسل العرض", en: "Proposal sent", tone: "bg-primary/12 text-primary" },
  in_progress: { ar: "قيد التنفيذ", en: "In progress", tone: "bg-success/12 text-success" },
  won: { ar: "تم الاتفاق", en: "Won", tone: "bg-success/20 text-success" },
  lost: { ar: "لم يتم", en: "Lost", tone: "bg-danger/12 text-danger" },
  archived: { ar: "مؤرشف", en: "Archived", tone: "bg-subtle text-muted" },
};
export const MESSAGE_STATUS: Record<string, { ar: string; en: string; tone: string }> = {
  new: { ar: "جديدة", en: "New", tone: "bg-accent text-on-accent" },
  read: { ar: "مقروءة", en: "Read", tone: "bg-subtle text-muted" },
  replied: { ar: "تم الرد", en: "Replied", tone: "bg-success/12 text-success" },
  archived: { ar: "مؤرشفة", en: "Archived", tone: "bg-subtle text-muted" },
};
export const PRIORITY: Record<string, { ar: string; en: string }> = { low: { ar: "منخفضة", en: "Low" }, normal: { ar: "عادية", en: "Normal" }, high: { ar: "عالية", en: "High" } };
export const NOTIFY: Record<string, { ar: string; en: string }> = {
  sent: { ar: "أُرسل إشعار بريدي", en: "Email notification sent" },
  not_configured: { ar: "البريد غير مضبوط — لم يُرسل إشعار", en: "Email not configured — no notification sent" },
  disabled: { ar: "القالب معطل", en: "Template disabled" },
  no_recipients: { ar: "لا يوجد مستلمون", en: "No recipients" },
  failed: { ar: "فشل إرسال الإشعار", en: "Notification failed" },
  pending: { ar: "—", en: "—" },
};
