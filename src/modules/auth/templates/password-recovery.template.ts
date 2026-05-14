import { emailBaseStyles, recoveryStyles } from './styles/email.styles';

export function getPasswordRecoveryTemplate(nombre: string, code: string, logoUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de contraseña</title>
  <style>
    ${emailBaseStyles}
    ${recoveryStyles}
  </style>
</head>
<body>
  <div class="container">
<div class="header">
  <div style="margin-bottom: 16px;">
<img src="${logoUrl}" alt="IEEE UTN" style="max-width: 280px; height: auto;" />  </div>
  <h1>🔐 Recuperación de Contraseña</h1>
</div>

    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para continuar:</p>

    <div class="code-box">
      <div style="color: #6f6f6e; font-size: 14px; margin-bottom: 10px;">Tu código de verificación es:</div>
      <div class="code">${code}</div>
    </div>

    <p style="text-align: center; color: #6f6f6e;">
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
      <p style="color: #6f6f6e; font-size: 12px;">© ${new Date().getFullYear()} IEEE UTN. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}