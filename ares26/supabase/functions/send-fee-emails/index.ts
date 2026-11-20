// ADMIN ONLY: emails every author with an Accepted abstract their private PKR fee-payment link.
// - One email PER ABSTRACT: an author with several accepted abstracts gets a separate email (with its own link) for each.
// - Skips abstracts whose fee is already Pending/Approved, and (unless resend=true) ones already emailed.
// - Generates the payment link (fee_link_at) first if it has not been generated yet.
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

type Item = { ref: string; title: string; category: string; link: string };

function build(name: string, i: Item, fee: number) {
  const subject = `ARES'26: your abstract is accepted - fee payment link (${i.ref})`;
  const html =
    `<p>Hello ${esc(name || "there")},</p>` +
    `<p>Congratulations! Your abstract has been <b>accepted</b> for ARES'26 at Sargodha Medical College.</p>` +
    `<p><b>${esc(i.title)}</b><br/>${esc(i.ref)} &middot; ${esc(i.category)} presentation<br/>` +
    `Payment link: <a href="${esc(i.link)}">${esc(i.link)}</a></p>` +
    `<p>To complete your submission, please pay the <b>PKR ${esc(fee)}</b> printing and setup fee and upload your payment receipt using the link above. ` +
    `You will need to log in to the account you used to submit the abstract.</p>` +
    `<p>If you have more than one accepted abstract, you will receive a separate email and payment link for each one.</p>` +
    `<p>Regards,<br/>ARES'26 Organizing Committee<br/>Sargodha Medical College</p>`;
  const text =
    `Hello ${name || "there"},\n\nCongratulations! Your abstract has been accepted for ARES'26 at Sargodha Medical College.\n\n` +
    `${i.title}\n${i.ref} - ${i.category} presentation\nPayment link: ${i.link}` +
    `\n\nTo complete your submission, please pay the PKR ${fee} printing and setup fee and upload your payment receipt using the link above. ` +
    `You will need to log in to the account you used to submit the abstract.\n\n` +
    `If you have more than one accepted abstract, you will receive a separate email and payment link for each one.\n\nRegards,\nARES'26 Organizing Committee\nSargodha Medical College`;
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
    if (!/^https?:\/\//i.test(site)) return json({ error: "Missing site address for the payment links." }, 400);
    if (!site.endsWith("/")) site += "/";
    const linkFor = (n: number | string) => `${site}#abstract-submission-${n}`;
    const from = Deno.env.get("MAIL_FROM")!;
    const reply_to = Deno.env.get("REPLY_TO") || undefined;

    // 3. Test mode: one sample email to the admin who clicked, nothing is saved
    if (body.test === true) {
      const m = build(me.first_name || "Admin", { ref: ref(1001), title: "Sample abstract title", category: "Oral", link: linkFor(1001) }, fee);
      const r = await sendBatch([{ from, to: [me.email], subject: "[TEST] " + m.subject, html: m.html, text: m.text, reply_to }]);
      return r.ok ? json({ test: true, to: me.email }) : json({ error: "Resend refused the test email: " + r.text.slice(0, 300) }, 502);
    }

    // 4. Who gets an email: Accepted abstracts that still need the fee
    let q = sb.from("abstracts")
      .select("id,ref_no,title,category,fee_status,fee_link_at,fee_email_sent_at,user_id,profiles(first_name,last_name,email)")
      .eq("status", "Accepted").not("ref_no", "is", null).in("fee_status", ["Unpaid", "Rejected"]);
    if (ids.length) q = q.in("id", ids);
    if (!resend) q = q.is("fee_email_sent_at", null);
    const { data: rows, error: qe } = await q;
    if (qe) return json({ error: qe.message }, 500);

    // One entry per abstract (NOT per author): an author with 2 accepted abstracts gets 2 emails
    const skipped: { ref: string; reason: string }[] = [];
    const list: { name: string; email: string; row: any }[] = [];
    for (const r of rows || []) {
      const p: any = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const email = String(p?.email || "").trim();
      if (!email) { skipped.push({ ref: ref(r.ref_no), reason: "no email on the author's account" }); continue; }
      list.push({ name: String(p.first_name || "").trim(), email, row: r });
    }
    if (!list.length) return json({ sent: 0, abstracts: 0, failed: [], skipped, updated: [] });

    // 5. Generate any missing payment links first (the page stays closed until fee_link_at is set)
    const now = new Date().toISOString();
    const all = list.map((g) => g.row);
    const need = all.filter((r) => !r.fee_link_at).map((r) => r.id);
    if (need.length) {
      const { error } = await sb.from("abstracts").update({ fee_link_at: now }).in("id", need);
      if (error) return json({ error: "Could not generate links: " + error.message }, 500);
      for (const r of all) if (!r.fee_link_at) r.fee_link_at = now;
    }

    // 6. Send in batches of 50 emails; mark each abstract as emailed only after Resend accepts its batch
    const failed: { email: string; error: string }[] = [];
    const updated: { id: string; fee_link_at: string; fee_email_sent_at: string }[] = [];
    let sent = 0, abstracts = 0;
    for (let i = 0; i < list.length; i += 50) {
      const chunk = list.slice(i, i + 50);
      const payload = chunk.map((g) => {
        const r = g.row;
        const m = build(g.name, { ref: ref(r.ref_no), title: r.title, category: r.category, link: linkFor(r.ref_no) }, fee);
        return { from, to: [g.email], subject: m.subject, html: m.html, text: m.text, reply_to };
      });
      const r = await sendBatch(payload);
      if (!r.ok) { for (const g of chunk) failed.push({ email: `${g.email} (${ref(g.row.ref_no)})`, error: r.text.slice(0, 200) }); continue; }
      const doneIds = chunk.map((g) => g.row.id);
      const { error } = await sb.from("abstracts").update({ fee_email_sent_at: now }).in("id", doneIds);
      if (error) failed.push({ email: "(saving sent-time)", error: "Emails were sent but could not be marked as sent: " + error.message });
      sent += chunk.length; abstracts += doneIds.length;
      for (const g of chunk) updated.push({ id: g.row.id, fee_link_at: g.row.fee_link_at, fee_email_sent_at: now });
    }
    return json({ sent, abstracts, failed, skipped, updated });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
