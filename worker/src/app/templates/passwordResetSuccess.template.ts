import { env } from '@/env';

const passwordResetSuccessTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Password Changed</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d12; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d12; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#16161f; border-radius:12px; overflow:hidden; border:1px solid #26262f;">
 
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px 16px 24px;">
              <img src="${env.S3_PUBLIC_URL}/attachments/50525ece-7156-4455-a6bb-f0c2f825a1c7-1787806422985.png" alt="Bookdianight" width="140" style="display:block;" />
            </td>
          </tr>
 
          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <hr style="border:none; border-top:1px solid #26262f; margin:0;" />
            </td>
          </tr>
 
          <!-- Hero -->
          <tr>
            <td align="center" style="padding:36px 32px 8px 32px;">
              <div style="width:56px; height:56px; background-color:#152a1c; border:1px solid #1f4a2c; border-radius:50%; margin:0 auto 18px auto; text-align:center; line-height:56px;">
                <span style="color:#4ade80; font-size:26px;">&#10003;</span>
              </div>
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:22px; font-weight:700;">
                Your password has been changed
              </h1>
              <p style="margin:0; color:#b3b3bd; font-size:15px; line-height:1.7;">
                Hi <strong style="color:#ffffff;">{{name}}</strong>, this confirms that the password for <strong style="color:#ffffff;">{{email}}</strong> was successfully reset. You can now log in with your new password.
              </p>
            </td>
          </tr>
 
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:28px 32px 32px 32px;">
              <a href="https://bookdianight.com/login" style="display:inline-block; background-color:#8b5cf6; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:14px 36px; border-radius:8px;">
                Log In to Your Account
              </a>
            </td>
          </tr>
 
          <!-- Security note -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#251418; border:1px solid #4a1e26; border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0; color:#e08a94; font-size:12.5px; line-height:1.6;">
                      Wasn't you? If you didn't make this change, your account may be compromised. Contact us immediately at
                      <a href="mailto:support@bookdianight.com" style="color:#e08a94; text-decoration:underline;">support@bookdianight.com</a>
                      so we can help secure it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <hr style="border:none; border-top:1px solid #26262f; margin:0;" />
            </td>
          </tr>
 
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 32px 32px 32px;">
              <p style="margin:0 0 16px 0; color:#6f6f7a; font-size:12px; line-height:1.6;">
                Need help? Contact us at
                <a href="mailto:support@bookdianight.com" style="color:#8b5cf6; text-decoration:none;">support@bookdianight.com</a>
              </p>
              <p style="margin:0 0 16px 0; font-size:12px;">
                <a href="https://bookdianight.com/terms" style="color:#8a8a94; text-decoration:underline; margin-right:12px;">Terms of Service</a>
                <a href="https://bookdianight.com/privacy" style="color:#8a8a94; text-decoration:underline;">Privacy Policy</a>
              </p>
              <p style="margin:0; color:#4a4a54; font-size:11px;">
                &copy; Bookdianight. All rights reserved.
              </p>
            </td>
          </tr>
 
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default passwordResetSuccessTemplate;
