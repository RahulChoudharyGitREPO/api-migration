import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "gmail",
      port: 587,
      secure: true,
      auth: {
        user: process.env.PUSH_EMAIL_ID,
        pass: process.env.PUSH_EMAIL_APP_PASSWORD,
      },
    });
  }

  private isHTML(str: string): boolean {
    const htmlRegex = /<\/?[a-z][\s\S]*>/i;
    return htmlRegex.test(str);
  }

  async sendMail(
    user: { email: string; name?: string },
    subject: string,
    body: string,
  ): Promise<boolean> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `Relific ${process.env.PUSH_EMAIL_ID}`,
        to: user.email,
        subject: subject,
      };

      if (this.isHTML(body)) {
        mailOptions.html = body;
      } else {
        mailOptions.text = body;
      }

      const response = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${user.email}`,
        response.messageId,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${user.email}`, error);
      return false;
    }
  }

  async sendResetPasswordEmail(
    user: { email: string; name?: string },
    resetUrl: string,
  ): Promise<boolean> {
    const subject = "Reset Your Password";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>You have requested to reset your password. Please click the link below to create a new password:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>This link will expire in 24 hours for security reasons.</p>
        <br>
        <p>Best regards,<br>SurveyR Team</p>
      </div>
    `;

    return this.sendMail(user, subject, body);
  }

  /**
   * Send email (simplified interface for workflow notifications)
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    return this.sendMail({ email: to }, subject, html);
  }
}
