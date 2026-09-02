import { companyInformation } from '@/const';

const passwordResetSuccessTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Password Changed</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d12; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d12; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#16161f; border-radius:12px; overflow:hidden; border:1px solid #26262f;">
 
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px 16px 24px;">
              <img src="${companyInformation.logo}" alt="${companyInformation.name}" width="140" style="display:block;" />
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
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                Your password has been changed
              </h1>
              <p style="margin:0; color:#ffffff; font-size:16px; line-height:1.7;">
                Hi <strong style="color:#ffffff; font-weight:600;">{{name}}</strong>, this confirms that the password for <strong style="color:#ffffff; font-weight:600;"><a href="mailto:{{email}}" style="color:#ffffff; text-decoration:none;">{{email}}</a></strong> was successfully reset. You can now log in with your new password.
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
                      <a href="mailto:${companyInformation.email}" style="color:#e08a94; text-decoration:underline;">${companyInformation.email}</a>
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
              <p style="margin:0 0 16px 0; color:#e2e8f0; font-size:13px; line-height:1.6;">
                Need help? Contact us at
                <a href="mailto:${companyInformation.email}" style="color:#8b5cf6; text-decoration:none; font-weight:500;">${companyInformation.email}</a>
              </p>
              <p style="margin:0 0 16px 0; font-size:13px;">
                <a href="${companyInformation.website}/terms" style="color:#f8fafc; text-decoration:underline; margin-right:12px;">Terms of Service</a>
                <a href="${companyInformation.website}/privacy" style="color:#f8fafc; text-decoration:underline;">Privacy Policy</a>
              </p>
              <p style="margin:0 0 8px 0; color:#cbd5e1; font-size:12px; line-height:1.6;">
                ${companyInformation.legalName}<br />
                ${companyInformation.address}<br />
                ${companyInformation.phone}
              </p>
              <p style="margin:0; color:#cbd5e1; font-size:12px;">
                ${companyInformation.copyright}
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
