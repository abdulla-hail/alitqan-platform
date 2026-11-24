import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { can, getStaff } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { MESSAGE_STATUS, REQUEST_STATUS } from "@/features/admin/inbox-labels";

export const dynamic = "force-dynamic";

/** Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell). */
const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};

export async function GET(req: NextRequest) {
  const staff = await getStaff();
  if (!staff || !can(staff, "inbox.export")) return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") === "messages" ? "messages" : "requests";
  const format = sp.get("format") === "xlsx" ? "xlsx" : "csv";
  const sb = await createSessionClient();

  let columns: { key: string; header: string }[];
  let rows: Record<string, unknown>[];
  if (type === "requests") {
    let q = sb.from("project_requests").select("reference,kind,status,priority,name,email,phone,company,service_label,budget,timeline,description,followup_on,locale,created_at").order("created_at", { ascending: false }).limit(10000);
    const st = sp.get("status");
    if (st && REQUEST_STATUS[st]) q = q.eq("status", st);
    const kind = sp.get("kind");
    if (kind === "project" || kind === "quote") q = q.eq("kind", kind);
    const { data, error } = await q;
    if (error) return new NextResponse("Error", { status: 500 });
    rows = data ?? [];
    columns = ["reference", "kind", "status", "priority", "name", "email", "phone", "company", "service_label", "budget", "timeline", "description", "followup_on", "locale", "created_at"].map((k) => ({ key: k, header: k }));
  } else {
    let q = sb.from("contact_messages").select("status,name,email,phone,subject,message,locale,followup_on,created_at").order("created_at", { ascending: false }).limit(10000);
    const st = sp.get("status");
    if (st && MESSAGE_STATUS[st]) q = q.eq("status", st);
    const { data, error } = await q;
    if (error) return new NextResponse("Error", { status: 500 });
    rows = data ?? [];
    columns = ["status", "name", "email", "phone", "subject", "message", "locale", "followup_on", "created_at"].map((k) => ({ key: k, header: k }));
  }
  await sb.rpc("log_event", { p_action: "export", p_entity: type, p_summary: `${format} (${rows.length})` });
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const esc = (v: unknown) => `"${cell(v).replace(/"/g, '""')}"`;
    const csv = "﻿" + [columns.map((c) => esc(c.header)).join(","), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(","))].join("\r\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type}-${stamp}.csv"`, "Cache-Control": "no-store" } });
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(type);
  ws.columns = columns.map((c) => ({ ...c, width: c.key === "description" || c.key === "message" ? 60 : 20 }));
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(Object.fromEntries(columns.map((c) => [c.key, cell(r[c.key])])));
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="${type}-${stamp}.xlsx"`, "Cache-Control": "no-store" },
  });
}
