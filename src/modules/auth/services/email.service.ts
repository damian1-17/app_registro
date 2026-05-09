import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Inicializa el transporter de nodemailer
   */
  private initializeTransporter(): void {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT',465 );
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);

    // Validar que las credenciales estén configuradas
    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        '⚠️  Credenciales SMTP no configuradas. Los emails se loguearan en consola.',
      );
      this.transporter = null as any;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure, // true para 465, false para otros puertos
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Opciones adicionales para mejor compatibilidad
        requireTLS:true,
        tls: {
          rejectUnauthorized: false, // Solo en desarrollo
            minVersion: 'TLSv1.2',
        },
      });

      this.logger.log(`✅ Email service inicializado: ${smtpHost}:${smtpPort}`);
    } catch (error) {
      this.logger.error('❌ Error al inicializar el transporter de email:', error);
      this.transporter = null as any;
    }
  }

  /**
   * Envía el código de recuperación de contraseña
   */
  async sendPasswordRecoveryCode(
    email: string,
    code: string,
    nombre: string,
  ): Promise<void> {
    try {
      // Si no hay transporter configurado, loguear en consola
      if (!this.transporter) {
        this.logEmailToConsole(email, nombre, code, 'recuperación');
        return;
      }

      const emailFrom = this.configService.get<string>(
        'EMAIL_FROM',
        'noreply@app.com',
      );

      await this.transporter.sendMail({
        from: emailFrom,
        to: email,
        subject: 'Recuperación de contraseña',
        html: this.getPasswordRecoveryTemplate(nombre, code),
      });

      this.logger.log(`📧 Email de recuperación enviado a: ${email}`);
    } catch (error) {
      this.logger.error('❌ Error al enviar email de recuperación:', error);
      // Fallback: loguear en consola si falla el envío
      this.logEmailToConsole(email, nombre, code, 'recuperación');
      throw new Error('No se pudo enviar el email de recuperación');
    }
  }

  /**
   * Envía confirmación de cambio de contraseña exitoso
   */
  async sendPasswordChangedConfirmation(
    email: string,
    nombre: string,
  ): Promise<void> {
    try {
      // Si no hay transporter configurado, loguear en consola
      if (!this.transporter) {
        this.logEmailToConsole(email, nombre, '', 'confirmación');
        return;
      }

      const emailFrom = this.configService.get<string>(
        'EMAIL_FROM',
        'noreply@app.com',
      );

      await this.transporter.sendMail({
        from: emailFrom,
        to: email,
        subject: 'Contraseña actualizada exitosamente',
        html: this.getPasswordChangedTemplate(nombre),
      });

      this.logger.log(`📧 Email de confirmación enviado a: ${email}`);
    } catch (error) {
      this.logger.error('❌ Error al enviar email de confirmación:', error);
      // No lanzar error aquí, la contraseña ya fue cambiada
    }
  }

  /**
   * Template HTML para email de recuperación de contraseña
   */
  private getPasswordRecoveryTemplate(nombre: string, code: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de contraseña</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2c3e50;
      margin: 0;
      font-size: 24px;
    }
    .code-box {
      background-color: #f8f9fa;
      border: 2px dashed #007bff;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #007bff;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperación de Contraseña</h1>
    </div>
    
    <p>Hola <strong>${nombre}</strong>,</p>
    
    <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>
    
    <div class="code-box">
      <div style="color: #6c757d; font-size: 14px; margin-bottom: 10px;">Tu código de verificación es:</div>
      <div class="code">${code}</div>
    </div>
    
    <p style="text-align: center; color: #6c757d;">
      <strong>Este código expirará en 15 minutos</strong>
    </p>
    
    <div class="warning">
      <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este mensaje. Tu cuenta permanecerá segura.
    </div>
    
    <p style="margin-top: 30px;">
      Por seguridad, nunca compartas este código con nadie. Nuestro equipo nunca te pedirá este código por teléfono o email.
    </p>
    
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p style="color: #adb5bd; font-size: 12px;">© ${new Date().getFullYear()} Tu Aplicación. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Template HTML para confirmación de cambio de contraseña
   */
  private getPasswordChangedTemplate(nombre: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contraseña actualizada</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .success-icon {
      font-size: 48px;
      color: #28a745;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #2c3e50;
      margin: 0;
      font-size: 24px;
    }
    .success-box {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
      color: #155724;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Contraseña Actualizada</h1>
    </div>
    
    <p>Hola <strong>${nombre}</strong>,</p>
    
    <div class="success-box">
      <strong>Tu contraseña ha sido actualizada exitosamente</strong>
    </div>
    
    <p>Tu contraseña fue cambiada el <strong>${new Date().toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    })}</strong>.</p>
    
    <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
    
    <div class="warning">
      <strong>⚠️ ¿No fuiste tú?</strong><br>
      Si no realizaste este cambio, tu cuenta podría estar comprometida. Por favor, contacta inmediatamente a nuestro equipo de soporte.
    </div>
    
    <p style="margin-top: 30px;">
      Por tu seguridad, te recomendamos:
    </p>
    <ul>
      <li>Usar contraseñas únicas para cada servicio</li>
      <li>Cambiar tu contraseña periódicamente</li>
      <li>No compartir tus credenciales con nadie</li>
    </ul>
    
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
      <p style="color: #adb5bd; font-size: 12px;">© ${new Date().getFullYear()} Tu Aplicación. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Loguea el email en consola cuando no hay configuración SMTP
   */
  private logEmailToConsole(
    email: string,
    nombre: string,
    code: string,
    tipo: 'recuperación' | 'confirmación',
  ): void {
    this.logger.log(`
      ═══════════════════════════════════════════════════════════
      📧 EMAIL DE ${tipo.toUpperCase()} (MODO DESARROLLO)
      ═══════════════════════════════════════════════════════════
      Para: ${email}
      Nombre: ${nombre}
      ${code ? `Código: ${code}` : 'Tipo: Confirmación de cambio de contraseña'}
      ═══════════════════════════════════════════════════════════
      ⚠️  Para enviar emails reales, configura las variables:
      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
      ═══════════════════════════════════════════════════════════
    `);
  }

  /**
   * Verifica la conexión SMTP (útil para testing)
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('No hay transporter configurado para verificar');
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('✅ Conexión SMTP verificada exitosamente');
      return true;
    } catch (error) {
      this.logger.error('❌ Error al verificar conexión SMTP:', error);
      return false;
    }
  }
}