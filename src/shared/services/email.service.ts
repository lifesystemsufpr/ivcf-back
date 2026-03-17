import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";
import { EmailConfig } from "../config/config.interface";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = this.configService.getOrThrow<EmailConfig>("email");

    this.transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    try {
      const emailConfig = this.configService.getOrThrow<EmailConfig>("email");

      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
        to: email,
        subject: "Recuperação de Senha - TecnoAging",
        html: this.getPasswordResetEmailTemplate(fullName, resetLink),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private getPasswordResetEmailTemplate(
    fullName: string,
    resetLink: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
          .header { background-color: #2c3e50; color: #ffffff; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #27ae60; color: #ffffff; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
          .warning { color: #e74c3c; font-size: 12px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TecnoAging - Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${fullName}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Se não foi você, ignore este email.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <a href="${resetLink}" class="button">Redefinir Senha</a>
            <p>ou copie e cole o seguinte link no seu navegador:</p>
            <p style="word-break: break-all; color: #3498db;">${resetLink}</p>
            <div class="warning">
              <p><strong>⚠️ Aviso de Segurança:</strong></p>
              <p>Este link é válido por apenas 15 minutos. Após este período, você precisará solicitar um novo link de recuperação.</p>
              <p>Nunca compartilhe este link com outra pessoa.</p>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TecnoAging. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
    `;
  }
}
