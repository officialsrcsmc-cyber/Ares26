// ADMIN ONLY: emails people who have submitted an abstract but have NOT paid the conference registration fee.
// "Owes" = registration is not Approved AND (no payment proof uploaded OR the proof was Rejected).
// People whose proof is Pending (uploaded, being verified) are NOT emailed. Authors whose abstracts were all Rejected are skipped.
// One email per person (it lists their abstracts). Skips anyone already reminded unless resend=true.
// Needs the same Resend setup as status-email (RESEND_API_KEY, MAIL_FROM). Setup steps are in README.md.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const ref = (n: number | string) => "ARES26-ABS-" + n;

type Abs = { ref_no: number | null; title: string; status: string };

function build(name: string, abs: Abs[], fee: number, rejected: boolean, site: string) {
  const many = abs.length > 1;
  const subject = "ARES'26: please complete your registration payment";
  const list = abs.map((a) => `${a.ref_no ? ref(a.ref_no) + " - " : ""}${a.title} (${a.status})`);
  const html =
    `<p>Hello ${esc(name || "there")},</p>` +
    `<p>Thank you for submitting your abstract${many ? "s" : ""} to ARES'26 at Sargodha Medical College:</p>` +
    `<ul>${list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` +
    (rejected
      ? `<p>We could not verify the registration payment you uploaded. `
      : `<p>We have not yet received your <b>conference registration fee</b>. `) +
    `Your registration is needed to take part in ARES'26, including presenting your abstract${many ? "s" : ""}.</p>` +
    `<p>Please log in to your dashboard, pay the registration fee (the amount for your category is shown there) and upload your payment proof:<br/>` +
    `<a href="${esc(site)}">${esc(site)}</a></p>` +
    `<p>If you have already paid, please upload the proof on your dashboard so we can verify it. If you think you received this by mistake, just reply to this email.</p>` +
    `<p>Regards,<br/>ARES'26 Organizing Committee<br/>Sargodha Medical College</p>`;
  const text =
    `Hello ${name || "there"},\n\nThank you for submitting your abstract${many ? "s" : ""} to ARES'26 at Sargodha Medical College:\n` +
    list.map((l) => "- " + l).join("\n") + "\n\n" +
    (rejected ? "We could not verify the registration payment you uploaded. " : "We have not yet received your conference registration fee. ") +
    `Your registration is needed to take part in ARES'26, including presenting your abstract${many ? "s" : ""}.\n\n` +
    `Please log in to your dashboard, pay the registration fee (the amount for your category is shown there) and upload your payment proof:\n${site}\n\n` +
    `If you have already paid, please upload the proof on your dashboard so we can verify it. If you think you received this by mistake, just reply to this email.\n\n` +
    `Regards,\nARES'26 Organizing Committee\nSargodha Medical College`;
  return { subject, html, text };
}

async function sendBatch(payload: unknown[]) {
  const r = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: r.ok, text: await r.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // 1. Must be a signed-in admin
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    if (!u?.user) return json({ error: "Please sign in again." }, 401);
    const { data: me } = await sb.from("profiles").select("is_admin,email,first_name").eq("id", u.user.id).maybeSingle();
    if (!me?.is_admin) return json({ error: "Admins only." }, 403);

    if (!Deno.env.get("RESEND_API_KEY") || !Deno.env.get("MAIL_FROM"))
      return json({ error: "Email is not set up yet: set RESEND_API_KEY and MAIL_FROM secrets (see README)." }, 500);

    // 2. Inputs
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
    const resend = body.resend === true;
    const fee = Number(body.fee) > 0 ? Number(body.fee) : 500;
    let site = String(Deno.env.get("SITE_URL") || body.baseUrl || "").split("#")[0];
    if (!/^https?:\/\//i.test(site)) return json({ error: "Missing site address for the dashboard link." }, 400);
    if (!site.endsWith("/")) site += "/";
    const dash = site + "#dashboard";
    const from = Deno.env.get("MAIL_FROM")!;
    const reply_to = Deno.env.get("REPLY_TO") || undefined;

    // 3. Test mode: one sample email to the admin who clicked, nothing is saved
    if (body.test === true) {
      const m = build(me.first_name || "Admin", [{ ref_no: 1001, title: "Sample abstract title", status: "Accepted" }], fee, false, dash);
      const r = await sendBatch([{ from, to: [me.email], subject: "[TEST] " + m.subject, html: m.html, text: m.text, reply_to }]);
      return r.ok ? json({ test: true, to: me.email }) : json({ error: "Resend refused the test email: " + r.text.slice(0, 300) }, 502);
    }

    // 4. Everyone who owes the registration fee: not Approved, and no proof yet or proof Rejected
    let q = sb.from("profiles")
      .select("id,email,first_name,status,proof_path,dues_email_sent_at,dues_email_count")
      .neq("status", "Approved").or("proof_path.is.null,status.eq.Rejected");
    if (ids.length) q = q.in("id", ids);
    if (!resend) q = q.is("dues_email_sent_at", null);
    const { data: people, error: pe } = await q;
    if (pe) return json({ error: pe.message }, 500);
    if (!people?.length) return json({ sent: 0, failed: [], skipped: [], updated: [] });

    // 5. ...and who have at least one abstract that is not Rejected
    const { data: abs, error: ae } = await sb.from("abstracts")
      .select("user_id,ref_no,title,status").in("user_id", people.map((p) => p.id)).neq("status", "Rejected").order("created_at");
    if (ae) return json({ error: ae.message }, 500);
    const byUser = new Map<string, Abs[]>();
    for (const a of abs || []) { if (!byUser.has(a.user_id)) byUser.set(a.user_id, []); byUser.get(a.user_id)!.push(a); }

    const skipped: { email: string; reason: string }[] = [];
    const list = people.filter((p) => {
      if (!String(p.email || "").trim()) { skipped.push({ email: "(none)", reason: "no email on the account" }); return false; }
      return byUser.has(p.id);
    });
    if (!list.length) return json({ sent: 0, failed: [], skipped, updated: [] });

    // 6. Send in batches of 50; save the sent time only after Resend accepts the batch
    const now = new Date().toISOString();
    const failed: { email: string; error: string }[] = [];
    const updated: { id: string; dues_email_sent_at: string; dues_email_count: number }[] = [];
    let sent = 0;
    for (let i = 0; i < list.length; i += 50) {
      const chunk = list.slice(i, i + 50);
      const payload = chunk.map((p) => {
        const m = build(String(p.first_name || "").trim(), byUser.get(p.id)!, fee, p.status === "Rejected", dash);
        return { from, to: [p.email], subject: m.subject, html: m.html, text: m.text, reply_to };
      });
      const r = await sendBatch(payload);
      if (!r.ok) { for (const p of chunk) failed.push({ email: p.email, error: r.text.slice(0, 200) }); continue; }
      for (const p of chunk) {
        const count = (p.dues_email_count || 0) + 1;
        const { error } = await sb.from("profiles").update({ dues_email_sent_at: now, dues_email_count: count }).eq("id", p.id);
        if (error) failed.push({ email: p.email, error: "Email sent but could not be marked as sent: " + error.message });
        else updated.push({ id: p.id, dues_email_sent_at: now, dues_email_count: count });
      }
      sent += chunk.length;
    }
    return json({ sent, failed, skipped, updated });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
