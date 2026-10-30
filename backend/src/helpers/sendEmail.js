import nodeMailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";
import hbs from "nodemailer-express-handlebars";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendEmail = async (
  subject,
  send_to,
  send_from,
  reply_to,
  template,
  name,
  link,
  extra = {}
) => {
  const emailUser = process.env.USER_EMAIL || process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

  const brevoKey = process.env.BREVO_API_KEY;

  // Check if email credentials are configured
  if (!brevoKey && (!emailUser || !emailPass)) {
    console.error("Email credentials not configured: USER_EMAIL or EMAIL_PASS missing");
    throw new Error("Email service not configured");
  }

  const cleanPass = (emailPass || "").replace(/\s+/g, "");
  const isGmail =
    (emailUser || "").toLowerCase().includes("@gmail.com") ||
    process.env.EMAIL_SERVICE?.toLowerCase() === "gmail";

  // With a Brevo key, mail goes over HTTPS (Render's free tier blocks SMTP
  // ports). The template is still rendered by handlebars through nodemailer's
  // JSON transport, which sends nothing itself.
  const transporter = nodeMailer.createTransport(
    brevoKey
      ? { jsonTransport: true }
      : isGmail
      ? {
          service: "gmail",
          auth: {
            user: emailUser,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        }
      : {
          service: process.env.EMAIL_SERVICE || "Outlook365",
          host: process.env.EMAIL_HOST || "smtp.office365.com",
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: emailUser,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        }
  );

  const handlebarsOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve(__dirname, "../views"),
      defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, "../views"),
    extName: ".handlebars",
  };

  transporter.use("compile", hbs(handlebarsOptions));

  const mailOptions = {
    from: send_from || emailUser,
    to: send_to,
    replyTo: reply_to || emailUser,
    subject: subject,
    template: template,
    context: {
      name: name,
      link: link,
      ...extra,
    },
  };

  try {
    if (brevoKey) {
      const rendered = JSON.parse((await transporter.sendMail(mailOptions)).message);
      // Brevo only accepts senders verified in the account
      const senderEmail = process.env.BREVO_SENDER_EMAIL || emailUser;
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Snippet Master", email: senderEmail },
          to: [{ email: send_to }],
          replyTo: { email: senderEmail },
          subject,
          htmlContent: rendered.html,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`Brevo ${res.status}: ${body.message || "send failed"}`);
      }
      console.log("Brevo message sent: %s", body.messageId);
      return body;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.log("Error sending email: ", error);
    throw error;
  }
};

export default sendEmail;
