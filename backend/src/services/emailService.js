// Brevo (formerly Sendinblue) — HTTP API, works on Render free tier, sends to any recipient
const sendViaBrevo = async ({ to, toName, from, fromName, subject, html, text }) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[EmailService] BREVO_API_KEY not set');
    return null;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName || 'TaskMaster', email: from || process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Brevo API error');
  return data;
};

const PRIORITY_META = {
  high:   { color: '#ef4444', bg: '#fef2f2', label: '🔴 HIGH PRIORITY',   emoji: '🚨' },
  medium: { color: '#f59e0b', bg: '#fffbeb', label: '🟡 MEDIUM PRIORITY', emoji: '⚠️' },
  low:    { color: '#10b981', bg: '#f0fdf4', label: '🟢 LOW PRIORITY',    emoji: '✅' },
};

const sendTaskReminderEmail = async ({ to, name, taskTitle, description, dueDate, priority, appUrl }) => {
  try {

    const p = PRIORITY_META[priority] || PRIORITY_META.medium;
    const appLink = appUrl || process.env.APP_URL || 'https://todo-app-7ddz.onrender.com';

    const formattedDate = dueDate
      ? new Date(dueDate).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : null;

    const isOverdue = dueDate && new Date(dueDate) < new Date();
    const statusLabel = isOverdue ? '⚠️ OVERDUE' : '⏰ DUE SOON';
    const statusColor = isOverdue ? '#ef4444' : '#4f46e5';

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TaskMaster Reminder</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:14px;">✓</div>
    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">TaskMaster</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">Your Personal Productivity Assistant</p>
  </td></tr>

  <!-- STATUS BANNER -->
  <tr><td style="background:${statusColor};padding:10px 40px;text-align:center;">
    <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;">${statusLabel}</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:36px 40px;">
    <p style="margin:0 0 6px;font-size:18px;color:#1e293b;font-weight:600;">Hi ${name || 'there'} 👋</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
      ${isOverdue
        ? 'This task is <strong>overdue</strong>. Take a moment to complete it or update the due date.'
        : 'Just a heads-up — one of your tasks needs attention before the deadline.'}
    </p>

    <!-- TASK CARD -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${p.bg};border:1.5px solid ${p.color}33;border-left:5px solid ${p.color};border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:24px 24px 20px;">

        <!-- Priority badge -->
        <div style="margin-bottom:14px;">
          <span style="background:${p.color};color:#ffffff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">${p.label}</span>
        </div>

        <!-- Task title -->
        <h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;font-weight:700;line-height:1.3;">${taskTitle}</h2>

        ${description ? `<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;border-top:1px solid ${p.color}22;padding-top:12px;">${description}</p>` : ''}

        <!-- Due date -->
        ${formattedDate ? `
        <table cellpadding="0" cellspacing="0" style="margin-top:${description ? '0' : '12px'};">
          <tr>
            <td style="background:${p.color}18;border-radius:8px;padding:10px 16px;">
              <span style="font-size:13px;color:${p.color};font-weight:700;">📅 Due: ${formattedDate}</span>
            </td>
          </tr>
        </table>` : ''}

      </td></tr>
    </table>

    <!-- CTA BUTTON -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:28px;">
        <a href="${appLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
          Open TaskMaster →
        </a>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">
      Mark this task complete in the app once done.<br>You can manage all your reminders from your TaskMaster dashboard.
    </p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">Sent by <strong style="color:#4f46e5;">TaskMaster</strong> — Your Productivity Companion</p>
    <p style="margin:0;font-size:11px;color:#cbd5e1;">To stop receiving reminders, manage your tasks at <a href="${appLink}" style="color:#4f46e5;">${appLink}</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

    const text = `Hi ${name || 'there'},\n\n${isOverdue ? 'OVERDUE' : 'REMINDER'}: ${taskTitle}\nPriority: ${priority.toUpperCase()}\n${formattedDate ? `Due: ${formattedDate}\n` : ''}${description ? `\n${description}\n` : ''}\nOpen app: ${appLink}\n\n— TaskMaster`;

    const result = await sendViaBrevo({
      to,
      toName: name,
      from: process.env.BREVO_SENDER_EMAIL,
      fromName: 'TaskMaster',
      subject: `${p.emoji} ${isOverdue ? '[OVERDUE]' : 'Reminder:'} ${taskTitle}`,
      html,
      text,
    });

    console.log(`[EmailService] ✅ Sent to ${to} via Brevo — ${result?.messageId}`);
    return { success: true, messageId: result?.messageId };
  } catch (error) {
    console.error('[EmailService] ❌ Failed:', error.message);
    throw error;
  }
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  try {
    const resend = getResend ? null : null; // use Brevo
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset Your Password</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
  <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">🔐</div>
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Reset Your Password</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">TaskMaster Account Security</p>
  </td></tr>
  <tr><td style="padding:36px 40px;">
    <p style="margin:0 0 8px;font-size:18px;color:#1e293b;font-weight:600;">Hi ${name || 'there'} 👋</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
      We received a request to reset your TaskMaster password. Click the button below to set a new password.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:28px;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">
          Reset My Password →
        </a>
      </td></tr>
    </table>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#991b1b;">⚠️ This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your password will remain unchanged.</p>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
      If the button doesn't work, copy this link:<br>
      <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
    </p>
  </td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by <strong style="color:#4f46e5;">TaskMaster</strong> — Your Productivity Companion</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    const text = `Hi ${name || 'there'},\n\nReset your TaskMaster password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n— TaskMaster`;

    await sendViaBrevo({
      to,
      toName: name,
      from: process.env.BREVO_SENDER_EMAIL,
      fromName: 'TaskMaster',
      subject: '🔐 Reset Your TaskMaster Password',
      html,
      text,
    });

    console.log(`[EmailService] ✅ Password reset email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('[EmailService] ❌ Failed to send reset email:', error.message);
    throw error;
  }
};

module.exports = {
  sendTaskReminderEmail,
  sendPasswordResetEmail,
};
