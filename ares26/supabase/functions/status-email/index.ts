// OPTIONAL: emails participants when their payment proof is received and when it is approved or rejected.
// Needs a Resend account (resend.com). Setup steps are in README.md.
const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

Deno.serve(async (req) => {
  const { type, record, old_record } = await req.json();
  if (type !== "UPDATE" || !record || !old_record) return new Response("ignored");

  const name = esc(record.first_name);
  let subject = "", body = "";
  if (record.status !== old_record.status && record.status === "Approved") {
    subject = "ARES'26: your registration is approved";
    body = `<p>Hello ${name},</p><p>Your payment has been verified and your registration for ARES'26 is <b>approved</b>. We look forward to seeing you at Sargodha Medical College.</p>`;
  } else if (record.status !== old_record.status && record.status === "Rejected") {
    subject = "ARES'26: action needed on your payment";
    body = `<p>Hello ${name},</p><p>We could not verify your payment. Please log in to your dashboard and upload a new payment proof.</p>`;
  } else if (!old_record.proof_path && record.proof_path) {
    subject = "ARES'26: we received your payment proof";
    body = `<p>Hello ${name},</p><p>We received your payment proof. The team will verify it and email you once your registration is approved.</p>`;
  } else {
    return new Response("no relevant change");
  }

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: Deno.env.get("MAIL_FROM"), to: [record.email], subject, html: body }),
  });
  return new Response(await r.text(), { status: r.status });
});
