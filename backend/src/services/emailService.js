const nodemailer = require('nodemailer');

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // 1. If SMTP credentials are provided in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const options = {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (process.env.SMTP_HOST) {
      options.host = process.env.SMTP_HOST;
      options.port = parseInt(process.env.SMTP_PORT, 10) || 587;
      options.secure = options.port === 465;
    } else {
      // Default to Gmail service
      options.service = 'gmail';
    }

    cachedTransporter = nodemailer.createTransport(options);
    console.log('[EmailService] Using configured SMTP provider for user:', process.env.SMTP_USER);
    return cachedTransporter;
  }

  // 2. Automatic test fallback: Ethereal test account (Zero configuration required)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EmailService] Using Ethereal test mailer. Account:', testAccount.user);
    console.log('[EmailService] Reminders will generate clickable browser preview links!');
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Could not initialize test mailer:', err.message);
    return null;
  }
};

/**
 * Send task reminder email
 */
const sendTaskReminderEmail = async ({ to, name, taskTitle, description, dueDate, priority }) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      console.warn('[EmailService] Transporter unavailable, skipping email delivery.');
      return null;
    }

    const formattedDate = dueDate
      ? new Date(dueDate).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'No due date specified';

    const priorityColors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
    };

    const badgeColor = priorityColors[priority] || '#6366f1';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">TaskMaster Reminder</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Stay on top of your schedule</p>
        </div>

        <div style="padding: 28px 24px;">
          <p style="font-size: 16px; color: #334155; margin-top: 0;">Hi <strong>${name || 'there'}</strong>,</p>
          <p style="font-size: 15px; color: #475569; line-height: 1.5;">This is a friendly reminder for your upcoming task:</p>

          <div style="background-color: #f8fafc; border-left: 4px solid ${badgeColor}; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <h2 style="margin: 0; font-size: 18px; color: #0f172a;">${taskTitle}</h2>
              <span style="background-color: ${badgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
                ${priority.toUpperCase()} PRIORITY
              </span>
            </div>

            ${
              description
                ? `<p style="color: #64748b; font-size: 14px; margin: 8px 0 12px 0;">${description}</p>`
                : ''
            }

            <div style="margin-top: 12px; font-size: 14px; color: #334155;">
              📅 <strong>Due:</strong> ${formattedDate}
            </div>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            Log into TaskMaster to check off or update this task when completed.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Sent with ❤️ by TaskMaster Productivity Assistant
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"TaskMaster Reminders" <notifications@taskmaster.app>',
      to,
      subject: `⏰ Reminder: ${taskTitle}`,
      text: `Hi ${name || 'there'},\n\nReminder for your task: "${taskTitle}"\nPriority: ${priority}\nDue Date: ${formattedDate}\n\n${description || ''}\n\nTaskMaster Team`,
      html: htmlContent,
    });

    console.log(`[EmailService] Reminder sent to ${to} (Message ID: ${info.messageId})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] 🔗 Preview email in browser: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  } catch (error) {
    console.error('[EmailService] Failed to send reminder email:', error.message);
    throw error;
  }
};

module.exports = {
  sendTaskReminderEmail,
};
