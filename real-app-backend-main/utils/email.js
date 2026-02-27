const nodemailer = require("nodemailer");

/**
 * Minimal email helper.
 *
 * If SMTP env vars are missing, it falls back to console logging
 * to keep MVP runnable locally without extra setup.
 */
const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || "false") === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

exports.sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || "no-reply@localhost";

  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log("[email:mock]", { to, subject, text });
    return { mocked: true };
  }

  return transporter.sendMail({ from, to, subject, text, html });
};
