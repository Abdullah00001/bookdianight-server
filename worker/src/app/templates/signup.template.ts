import { companyInformation } from '@/const';

const signupTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify Your Email</title>
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
 
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                Welcome to ${companyInformation.name} 🎉
              </h1>
              <p style="margin:0 0 6px 0; color:#ffffff; font-size:16px; line-height:1.6;">
                Hi <strong style="color:#ffffff; font-weight:600;">{{name}}</strong>, your account has been created successfully.
              </p>
              <p style="margin:0 0 20px 0; color:#ffffff; font-size:16px; line-height:1.6;">
                Please verify <strong style="color:#ffffff; font-weight:600;"><a href="mailto:{{email}}" style="color:#ffffff; text-decoration:none;">{{email}}</a></strong> using the code below to activate your account.
              </p>
            </td>
          </tr>
 
          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:8px 32px 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#1f1f2b; border:1px dashed #8b5cf6; border-radius:10px; padding:18px 32px;">
                <tr>
                  <td align="center">
                    <span style="color:#8b5cf6; font-size:12px; letter-spacing:2px; text-transform:uppercase; display:block; margin-bottom:6px;">
                      Verification Code
                    </span>
                    <span style="color:#ffffff; font-size:32px; font-weight:700; letter-spacing:8px;">
                      {{otp}}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Expiry note -->
          <tr>
            <td style="padding:0 32px 24px 32px;">
              <p style="margin:0; color:#f8fafc; font-size:14px; line-height:1.6; text-align:center;">
                This code expires in <strong style="color:#f8fafc; font-weight:600;">{{otpExpireAt}} minutes</strong>. Do not share it with anyone.
              </p>
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
              <p style="margin:0 0 8px 0; color:#e2e8f0; font-size:13px; line-height:1.6;">
                Didn't sign up for ${companyInformation.name}? You can safely ignore this email.
              </p>
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

export default signupTemplate;
