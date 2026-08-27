const signupSuccessTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to Bookdianight</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d12; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d12; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#16161f; border-radius:12px; overflow:hidden; border:1px solid #26262f;">
 
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 24px 16px 24px;">
              <img src="https://nazmulhasan.s3.us-east-1.amazonaws.com/attachments/50525ece-7156-4455-a6bb-f0c2f825a1c7-1787806422985.png" alt="Bookdianight" width="140" style="display:block;" />
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
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:24px; font-weight:700;">
                You're verified, {{name}}!
              </h1>
              <p style="margin:0; color:#b3b3bd; font-size:15px; line-height:1.7;">
                Your email <strong style="color:#ffffff;">{{email}}</strong> is confirmed and your Bookdianight account is fully active. Welcome to the crew — the city's best nights are now a few taps away.
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
                    <p style="margin:0; color:#e4e4ea; font-size:14px; font-weight:600;">Discover events near you</p>
                    <p style="margin:2px 0 0 0; color:#8a8a94; font-size:13px; line-height:1.5;">Browse clubs, parties, and shows happening tonight.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">🎟️</div>
                  </td>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <p style="margin:0; color:#e4e4ea; font-size:14px; font-weight:600;">Book your first table</p>
                    <p style="margin:2px 0 0 0; color:#8a8a94; font-size:13px; line-height:1.5;">Reserve a spot in seconds, no back-and-forth calls.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px; vertical-align:top;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">👤</div>
                  </td>
                  <td style="padding-bottom:8px; vertical-align:top;">
                    <p style="margin:0; color:#e4e4ea; font-size:14px; font-weight:600;">Complete your profile</p>
                    <p style="margin:2px 0 0 0; color:#8a8a94; font-size:13px; line-height:1.5;">Add your preferences to get better recommendations.</p>
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
              <p style="margin:0 0 16px 0; color:#6f6f7a; font-size:12px; line-height:1.6;">
                Questions or need a hand? Reach us at
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
</html>`;

export default signupSuccessTemplate;
