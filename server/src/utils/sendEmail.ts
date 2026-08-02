import "dotenv/config";
import ejs from "ejs";
import nodeMailer, { Transporter } from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

// ES Module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: parseInt(process.env.SMPT_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const templatePath = path.join(__dirname, "../mails", options.template);

  try {
    const html: string = await ejs.renderFile(templatePath, options.data);

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error(
      `Email send failed (template: ${options.template}):`,
      error?.message
    );
    throw error;
  }
};

export default sendEmail;