import { companyInformation } from '@/const';

const eventCancellationTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Event Canceled - ${companyInformation.name}</title>
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
              <div style="font-size:40px; line-height:1; margin-bottom:12px;">⚠️</div>
              <h1 style="margin:0 0 12px 0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                Event Canceled
              </h1>
              <p style="margin:0; color:#ffffff; font-size:16px; line-height:1.7;">
                Hi {{buyerName}},<br><br>
                We're writing to let you know that <strong>{{eventName}}</strong> scheduled for <strong>{{eventStartAt}}</strong> at <strong>{{eventLocation}}</strong> has been canceled.
              </p>
            </td>
          </tr>
 
          <!-- What's next -->
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 18px 0; color:#8b5cf6; font-size:12px; letter-spacing:1.5px; text-transform:uppercase; font-weight:700;">
                Important Details
              </p>
 
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px; vertical-align:top; width:36px;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">🚫</div>
                  </td>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <p style="margin:0; color:#f8fafc; font-size:14px; font-weight:600;">Tickets are void</p>
                    <p style="margin:2px 0 0 0; color:#cbd5e1; font-size:14px; line-height:1.5;">Your purchased tickets for this event are no longer valid and cannot be used.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">💳</div>
                  </td>
                  <td style="padding-bottom:16px; vertical-align:top;">
                    <p style="margin:0; color:#f8fafc; font-size:14px; font-weight:600;">Refund Status</p>
                    <p style="margin:2px 0 0 0; color:#cbd5e1; font-size:14px; line-height:1.5;">A refund of <strong>{{refundAmount}} {{refundCurrency}}</strong> has been authorized. Note that the original service charge is retained and is not included in this amount.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px; vertical-align:top;">
                    <div style="width:28px; height:28px; background-color:#1f1f2b; border-radius:8px; text-align:center; line-height:28px;">🕒</div>
                  </td>
                  <td style="padding-bottom:8px; vertical-align:top;">
                    <p style="margin:0; color:#f8fafc; font-size:14px; font-weight:600;">Refund Schedule</p>
                    <p style="margin:2px 0 0 0; color:#cbd5e1; font-size:14px; line-height:1.5;">The refund is scheduled for processing on <strong>{{refundScheduledFor}}</strong>. Please allow additional time for your bank to process the transaction.</p>
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
              <p style="margin:0 0 16px 0; color:#e2e8f0; font-size:13px; line-height:1.6;">
                Questions or need a hand? Reach us at
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
</html>`;

export default eventCancellationTemplate;
