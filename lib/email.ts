type Recipient = { email: string; contactName: string; companyName: string };
type EmailResult = { ok: true; messageId: string | null } | { ok: false; error: string };

async function send(payload: Record<string, unknown>): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AGREEMENT_FROM_EMAIL;
  if (!apiKey || !from) return { ok: false, error: "Email delivery is not configured." };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, reply_to: "brooke@apexfleetconsulting.com", ...payload }),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    return response.ok
      ? { ok: true, messageId: body.id || null }
      : { ok: false, error: body.message || `Email provider returned ${response.status}` };
  } catch {
    return { ok: false, error: "Email provider could not be reached." };
  }
}

export async function sendAgreementEmail(partner: Recipient): Promise<EmailResult> {
  const portalUrl = process.env.PARTNER_PORTAL_URL || "https://partners.apexfleetconsulting.com/portal";
  return send({
    to: [partner.email],
    subject: "Your Apex Referral Partner Agreement is ready",
    text: `Hi ${partner.contactName},\n\nYour application to join the Apex Fleet Consulting Referral Partner Program has been approved.\n\nNext steps:\n1. Open ${portalUrl}\n2. Enter ${partner.email}.\n3. Use the secure link emailed to you.\n4. Review and electronically sign the agreement.\n5. Your referral tools unlock after signing.\n\nApex Fleet Consulting LLC`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0d1f35"><p style="font-weight:700;color:#bc5a15">APEX FLEET CONSULTING LLC</p><h1>Your partner application is approved</h1><p>Hi ${escapeHtml(partner.contactName)},</p><p>Your application for <strong>${escapeHtml(partner.companyName)}</strong> has been approved. Your Referral Partner Agreement is ready for review and electronic signature.</p><ol><li>Open the secure partner portal.</li><li>Enter <strong>${escapeHtml(partner.email)}</strong>.</li><li>Use the secure link emailed to you.</li><li>Review and sign the agreement.</li><li>Your referral tools unlock after signing.</li></ol><p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#e87b2f;color:white;padding:14px 22px;text-decoration:none;border-radius:8px;font-weight:700">Access partner portal</a></p></div>`,
  });
}

export async function sendReferralPaidEmail(
  partner: { email: string; contactName: string },
  referral: { companyName: string; compensation: number },
): Promise<EmailResult> {
  const portalUrl = process.env.PARTNER_PORTAL_URL || "https://partners.apexfleetconsulting.com/portal";
  const amount = Number(referral.compensation || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return send({
    to: [partner.email],
    subject: `Your referral compensation for ${referral.companyName} has been paid`,
    text: `Hi ${partner.contactName},\n\nYour referral compensation for ${referral.companyName} has been paid: ${amount}.\n\nYou can review the full history any time in your partner portal:\n${portalUrl}\n\nThank you for the introduction.\n\nApex Fleet Consulting LLC`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0d1f35"><p style="font-weight:700;color:#bc5a15">APEX FLEET CONSULTING LLC</p><h1>Your referral compensation has been paid</h1><p>Hi ${escapeHtml(partner.contactName)},</p><p>Your referral compensation for <strong>${escapeHtml(referral.companyName)}</strong> has been paid: <strong>${amount}</strong>.</p><p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#e87b2f;color:white;padding:14px 22px;text-decoration:none;border-radius:8px;font-weight:700">View your referral history</a></p></div>`,
  });
}

export async function sendDeclineEmail(partner: { email: string; contactName: string }): Promise<EmailResult> {
  return send({
    to: [partner.email],
    subject: "Update on your Apex Fleet Consulting partner application",
    text: `Hi ${partner.contactName},\n\nThank you for your interest in the Apex Fleet Consulting Referral Partner Program. After review, we are not able to move forward with your application at this time.\n\nWe appreciate the time you put into applying and wish you the best.\n\nApex Fleet Consulting LLC`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0d1f35"><p style="font-weight:700;color:#bc5a15">APEX FLEET CONSULTING LLC</p><h1>Update on your partner application</h1><p>Hi ${escapeHtml(partner.contactName)},</p><p>Thank you for your interest in the Apex Fleet Consulting Referral Partner Program. After review, we are not able to move forward with your application at this time.</p><p>We appreciate the time you put into applying and wish you the best.</p></div>`,
  });
}

export async function sendApplicationVerificationEmail(email: string, code: string): Promise<EmailResult> {
  return send({
    to: [email],
    subject: `Your verification code: ${code}`,
    text: `Your Apex Fleet Consulting partner application verification code is:\n\n${code}\n\nEnter this on the application page to continue. This code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.\n\nApex Fleet Consulting LLC`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0d1f35"><p style="font-weight:700;color:#bc5a15">APEX FLEET CONSULTING LLC</p><h1>Verify your email</h1><p>Use this code to continue your partner application:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:20px 0">${escapeHtml(code)}</p><p style="color:#64748b">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p></div>`,
  });
}

export async function sendAdminNotification(subject: string, text: string) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || "brooke@apexfleetconsulting.com";
  return send({ to: [to], subject, text });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}
