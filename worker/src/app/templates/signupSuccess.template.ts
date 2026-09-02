import { companyInformation } from '@/const';

const signupSuccessTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to ${companyInformation.name}</title>
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
              <div style="font-size:40px; line-height:1; margin-bottom:12px;">🥂</div>
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                You're verified, {{name}}!
              </h1>
              <p style="margin:0; color:#e2e8f0; font-size:16px; line-height:1.7;">
                Your email <strong style="color:#ffffff; font-weight:600;"><a href="mailto:{{email}}" style="color:#ffffff; text-decoration:none;">{{email}}</a></strong> is confirmed and your Bookdianight account is fully active. Welcome to the crew — the city's best nights are now a few taps away.
              </p>
            </td>
          </tr>
 
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:28px 32px 32px 32px;">
              <a href="https://bookdianight.com/explore" style="display:inline-block; background-color:#8b5cf6; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:14px 36px; border-radius:8px;">
                Start Exploring
              </a>
            </td>
          </tr>
 
          <!-- Divider -->
          <tr>
            <td style="padding:0 24px;">
              <hr style="border:none; border-top:1px solid #26262f; margin:0;" />
            </td>
          </tr>
 
          <!-- What's next -->
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 18px 0; color:#8b5cf6; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; font-weight:700;">
                What you can do now
              </p>
 
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px; vertical-align:top; width:36px;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">🔍</div>
                  </td>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <p style="margin:0; color:#f8fafc; font-size:14px; font-weight:600;">Discover events near you</p>
                    <p style="margin:2px 0 0 0; color:#94a3b8; font-size:14px; line-height:1.5;">Browse clubs, parties, and shows happening tonight.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">🎟️</div>
                  </td>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <p style="margin:0; color:#f8fafc; font-size:14px; font-weight:600;">Book your first table</p>
                    <p style="margin:2px 0 0 0; color:#94a3b8; font-size:14px; line-height:1.5;">Reserve a spot in seconds, no back-and-forth calls.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px; vertical-align:top;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">👤</div>
                  </td>
                  <td style="padding-bottom:8px; vertical-align:top;">
                    <p style="margin:0; color:#f8fafc; font-size:14px; font-weight:600;">Complete your profile</p>
                    <p style="margin:2px 0 0 0; color:#94a3b8; font-size:14px; line-height:1.5;">Add your preferences to get better recommendations.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Divider -->
          <tr>
            <td style="padding:16px 24px 0 24px;">
              <hr style="border:none; border-top:1px solid #26262f; margin:0;" />
            </td>
          </tr>
 
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 32px 32px 32px;">
              <p style="margin:0 0 16px 0; color:#64748b; font-size:13px; line-height:1.6;">
                Questions or need a hand? Reach us at
                <a href="mailto:${companyInformation.email}" style="color:#8b5cf6; text-decoration:none; font-weight:500;">${companyInformation.email}</a>
              </p>
              <p style="margin:0 0 16px 0; font-size:13px;">
                <a href="${companyInformation.website}/terms" style="color:#94a3b8; text-decoration:underline; margin-right:12px;">Terms of Service</a>
                <a href="${companyInformation.website}/privacy" style="color:#94a3b8; text-decoration:underline;">Privacy Policy</a>
              </p>
              <p style="margin:0 0 8px 0; color:#475569; font-size:12px; line-height:1.6;">
                ${companyInformation.legalName}<br />
                ${companyInformation.address}<br />
                ${companyInformation.phone}
              </p>
              <p style="margin:0; color:#475569; font-size:12px;">
                ${companyInformation.copyright}
              </p>
            </td>
          </tr>
 
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default signupSuccessTemplate;
