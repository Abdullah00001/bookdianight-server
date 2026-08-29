import { env } from '@/env';

const signupTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify Your Email</title>
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
 
          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:22px; font-weight:700;">
                Welcome to Bookdianight 🎉
              </h1>
              <p style="margin:0 0 6px 0; color:#b3b3bd; font-size:15px; line-height:1.6;">
                Hi <strong style="color:#ffffff;">{{name}}</strong>, your account has been created successfully.
              </p>
              <p style="margin:0 0 20px 0; color:#b3b3bd; font-size:15px; line-height:1.6;">
                Please verify <strong style="color:#ffffff;">{{email}}</strong> using the code below to activate your account.
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
              <p style="margin:0; color:#8a8a94; font-size:13px; line-height:1.6; text-align:center;">
                This code expires at <strong style="color:#c4c4cf;">{{otpExpireAt}}</strong>. Do not share it with anyone.
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
              <p style="margin:0 0 8px 0; color:#6f6f7a; font-size:12px; line-height:1.6;">
                Didn't sign up for Bookdianight? You can safely ignore this email.
              </p>
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

export default signupTemplate;
