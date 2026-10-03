import { companyInformation } from '@/const';

const eventTicketTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>BookDia Night — Event Ticket</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

  @page { size: 150mm auto; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 100%;
    min-width: 150mm;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    background:
      radial-gradient(circle at 15% 8%, rgba(223,169,32,0.16) 0%, rgba(223,169,32,0) 42%),
      radial-gradient(circle at 85% 94%, rgba(223,169,32,0.10) 0%, rgba(223,169,32,0) 44%),
      #070707;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 7mm 0;
  }

  .ticket {
    width: 138mm;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    border-radius: 6mm;
    background: linear-gradient(165deg, #0e0e0e 0%, #070707 60%, #050505 100%);
    box-shadow: 0 8mm 24mm rgba(0,0,0,0.6), 0 0 0 1px rgba(223,169,32,0.12);
  }

  .glow-a { position: absolute; top: -22mm; left: -18mm; width: 90mm; height: 90mm; border-radius: 50%;
    background: radial-gradient(circle, rgba(223,169,32,0.20) 0%, rgba(223,169,32,0.08) 45%, rgba(223,169,32,0) 75%); z-index: 0; }
  .glow-b { position: absolute; bottom: 55mm; right: -25mm; width: 95mm; height: 95mm; border-radius: 50%;
    background: radial-gradient(circle, rgba(223,169,32,0.11) 0%, rgba(223,169,32,0.04) 45%, rgba(223,169,32,0) 75%); z-index: 0; }
  .glow-c { position: absolute; bottom: -25mm; left: -15mm; width: 85mm; height: 85mm; border-radius: 50%;
    background: radial-gradient(circle, rgba(223,169,32,0.14) 0%, rgba(223,169,32,0.05) 45%, rgba(223,169,32,0) 75%); z-index: 0; }

  .grain { position: absolute; inset: 0; z-index: 0; opacity: 0.5;
    background-image: repeating-linear-gradient(120deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 22px); }

  .icon { flex: none; width: 100%; height: 100%; stroke: #070707; fill: none; stroke-width: 2; }
  .icon-chip { flex: none; width: 8mm; height: 8mm; border-radius: 3mm; display: flex; align-items: center; justify-content: center; padding: 1.8mm;
    background: linear-gradient(135deg, #f3d27f, #DFA920); box-shadow: 0 2mm 4mm rgba(223,169,32,0.35); }
  .icon-chip.pink { background: linear-gradient(135deg, #DFA920, #a9800f); box-shadow: 0 2mm 4mm rgba(169,128,15,0.4); }
  .icon-chip.violet { background: linear-gradient(135deg, #ffe6ad, #d1a13e); box-shadow: 0 2mm 4mm rgba(209,161,62,0.35); }
  .icon-chip.num-chip { font-family: 'Sora', sans-serif; font-size: 9px; font-weight: 800; color: #070707; }

  /* ============ MAIN (top) ============ */
  .main {
    flex: none;
    padding: 8mm 7mm 6mm;
    display: flex;
    flex-direction: column;
    row-gap: 5mm;
    position: relative;
    z-index: 1;
  }

  .brand-row { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 3mm; min-width: 0; }

  .brand-logo-box {
    height: 11mm; width: 11mm; min-width: 11mm;
    border-radius: 3mm;
    background: rgba(255,255,255,0.94);
    display: flex; align-items: center; justify-content: center;
    padding: 1.2mm;
  }
  .brand-logo-box img { height: 100%; width: 100%; object-fit: contain; }

  .brand-name { font-family: 'Sora', sans-serif; font-size: 12.5px; letter-spacing: 0.2px; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .brand-sub { font-size: 7.5px; letter-spacing: 1.6px; color: #DFA920; text-transform: uppercase; margin-top: 0.8mm; white-space: nowrap; font-weight: 500; }

  .ticket-tag { text-align: right; flex: none; }
  .ticket-tag .label { font-size: 7px; letter-spacing: 1.8px; color: #8a8a8a; text-transform: uppercase; }
  .ticket-tag .order-id { font-family: 'Sora', sans-serif; font-size: 10.5px; color: #ffffff; margin-top: 1mm; font-weight: 700; }

  .club-name {
    font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; line-height: 1.12;
    overflow-wrap: break-word;
    color: #DFA920;
  }
  .location { display: flex; align-items: center; gap: 1.6mm; margin-top: 2mm; font-size: 10.5px; color: #c4c4c4; }
  .location svg { width: 3mm; height: 3mm; flex: none; stroke: #DFA920; fill: none; stroke-width: 2; }

  .pill {
    display: inline-flex;
    width: fit-content;
    font-family: 'Sora', sans-serif;
    font-size: 8.5px; letter-spacing: 1.6px; color: #1a1400;
    background: linear-gradient(135deg, #f3d27f, #DFA920);
    padding: 2.2mm 4.5mm; border-radius: 20px; text-transform: uppercase; font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 2mm 5mm rgba(223,169,32,0.35);
    margin-top: 2.5mm;
  }

  .info-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 4mm;
    padding: 1mm 4mm;
  }
  .info-row {
    display: flex; align-items: center; gap: 3mm;
    padding: 3mm 0;
  }
  .info-row + .info-row { border-top: 1px solid rgba(255,255,255,0.07); }
  .info-row .txt { min-width: 0; }
  .info-row .label { font-size: 7.5px; letter-spacing: 1.4px; color: #9a9a9a; text-transform: uppercase; font-weight: 600; }
  .info-row .value { font-size: 11px; color: #ffffff; margin-top: 1mm; font-weight: 600; overflow-wrap: break-word; }

  .package-strip {
    padding-top: 4mm; border-top: 1px solid rgba(255,255,255,0.09);
  }
  .package-strip .pkg-label { font-size: 7.5px; letter-spacing: 1.8px; color: #9a9a9a; text-transform: uppercase; }
  .package-strip .pkg-name { font-family: 'Sora', sans-serif; font-size: 13.5px; color: #ffffff; font-weight: 700; margin-top: 1.6mm; }

  .footer-block {
    display: flex;
    flex-direction: column;
    row-gap: 4mm;
    border-top: 1px solid rgba(255,255,255,0.09);
    padding-top: 4mm;
  }
  .buyer-block .bl-label { font-size: 7px; letter-spacing: 1.6px; color: #8a8a8a; text-transform: uppercase; }
  .buyer-block .name { font-size: 12.5px; font-weight: 600; color: #ffffff; margin-top: 1.4mm; }
  .buyer-block .email { font-size: 9.5px; color: #b0b0b0; margin-top: 0.8mm; }
  .buyer-block .purchased { font-size: 8px; color: #767676; margin-top: 1.6mm; }

  .company-footer { font-size: 8px; color: #767676; line-height: 1.6; }
  .company-footer strong { color: #b0b0b0; font-weight: 600; }

  /* ============ PERFORATION (horizontal) ============ */
  .perforation { position: relative; height: 0; z-index: 1; }
  .perforation::before {
    content: ""; position: absolute; left: 6mm; right: 6mm; top: -0.5px;
    border-top: 1.5px dashed rgba(255,255,255,0.18);
  }
  .notch { position: absolute; top: -5mm; width: 10mm; height: 10mm; border-radius: 50%; background: #070707; }
  .notch.left { left: -5mm; }
  .notch.right { right: -5mm; }

  /* ============ STUB (bottom) ============ */
  .stub {
    flex: none;
    padding: 8mm 7mm 7mm;
    display: flex;
    flex-direction: column;
    row-gap: 3.5mm;
    background: linear-gradient(165deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
    position: relative;
    z-index: 1;
  }

  .stub .eyebrow { font-size: 8px; letter-spacing: 2px; color: #DFA920; text-transform: uppercase; font-weight: 700; }

  .stub-top-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 3mm; }

  .guest-count-row { display: flex; align-items: baseline; gap: 2mm; }
  .guest-count-row .num {
    font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; line-height: 1;
    color: #DFA920;
  }
  .guest-count-row .unit { font-size: 9px; color: #b0b0b0; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }

  .stub-club { text-align: right; min-width: 0; }
  .stub-club .club-name-small { font-family: 'Sora', sans-serif; font-size: 12.5px; color: #ffffff; font-weight: 700; overflow-wrap: break-word; }
  .stub-club .loc-small { font-size: 8.5px; color: #b0b0b0; margin-top: 1mm; }

  .stub-meta { display: flex; flex-direction: column; gap: 3mm; }
  .stub-meta-item { display: flex; align-items: center; gap: 2.4mm; }
  .stub-meta-item .txt { min-width: 0; }
  .stub-meta-item .txt .label { font-size: 7.5px; letter-spacing: 1.2px; color: #8a8a8a; text-transform: uppercase; }
  .stub-meta-item .txt .value { font-size: 10.5px; color: #ffffff; font-weight: 500; margin-top: 0.6mm; overflow-wrap: break-word; }

  .payment-box { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4mm; }
  .payment-line {
    display: grid; grid-template-columns: 1fr auto; column-gap: 3mm;
    font-size: 9.5px; color: #b0b0b0; margin-bottom: 2mm;
  }
  .payment-line span:last-child { text-align: right; color: #eaeaea; font-weight: 500; }
  .payment-line.total {
    margin-top: 1.5mm; padding-top: 3mm; border-top: 1px dashed rgba(223,169,32,0.35);
    font-size: 13.5px; font-weight: 700;
  }
  .payment-line.total span:first-child { color: #ffffff; font-family: 'Sora', sans-serif; }
  .payment-line.total span:last-child {
    font-family: 'Sora', sans-serif;
    color: #DFA920;
  }
  .admit-note { font-size: 7.5px; color: #5a5a5a; letter-spacing: 0.2px; line-height: 1.6; margin-top: 3mm; }
</style>
</head>
<body>

  <div class="ticket">
    <div class="glow-a"></div>
    <div class="glow-b"></div>
    <div class="glow-c"></div>
    <div class="grain"></div>

    <!-- ============ MAIN (top) ============ -->
    <div class="main">

      <div class="brand-row">
        <div class="brand">
          <div class="brand-logo-box"><img src="${companyInformation.logo}" alt="${companyInformation.name}" /></div>
          <div style="min-width:0;">
            <div class="brand-name">${companyInformation.name}</div>
            <div class="brand-sub">Event Ticket</div>
          </div>
        </div>
        <div class="ticket-tag">
          <div class="label">Order ID</div>
          <div class="order-id">#{{buyerInformation.orderId}}</div>
          {{#if qrCodeDataUri}}
          <div style="margin-top: 2mm; background: white; padding: 2px; border-radius: 4px;">
            <img src="{{qrCodeDataUri}}" alt="QR Code" style="width: 25mm; height: 25mm; display: block;" />
          </div>
          {{/if}}
        </div>
      </div>

      <div>
        <div class="club-name">{{eventTicketDetails.eventName}}</div>
        <div class="location">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>{{eventTicketDetails.location}}</span>
        </div>
        <div class="pill">{{ticketType}}</div>
      </div>

      <div class="info-card">
        <div class="info-row">
          <div class="icon-chip pink"><svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></div>
          <div class="txt"><div class="label">Starts</div><div class="value">{{eventTicketDetails.startDateTime}}</div></div>
        </div>
        <div class="info-row">
          <div class="icon-chip violet"><svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></div>
          <div class="txt"><div class="label">Ends</div><div class="value">{{eventTicketDetails.endDateTime}}</div></div>
        </div>
        <div class="info-row">
          <div class="icon-chip"><svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="txt"><div class="label">Total Persons</div><div class="value">{{eventTicketDetails.totalPersons}}</div></div>
        </div>
      </div>

      <div class="package-strip" style="border-top:1px solid rgba(255,255,255,0.09); padding-top:4mm;">
        <div class="pkg-label">Attendees</div>
        <div class="info-card" style="margin-top:2.5mm;">
          {{#each attendees}}
          <div class="info-row">
            <div class="icon-chip num-chip">{{this.index}}</div>
            <div class="txt"><div class="label">Attendee {{this.index}}</div><div class="value">{{this.name}}</div></div>
          </div>
          {{/each}}
        </div>
      </div>

      <div class="footer-block">
        <div class="buyer-block">
          <div class="bl-label">Booked By</div>
          <div class="name">{{buyerInformation.name}}</div>
          <div class="email">{{buyerInformation.email}}</div>
          <div class="purchased">Purchased on {{buyerInformation.dateOfPurchase}}</div>
        </div>
        <div class="company-footer">
          <strong>${companyInformation.legalName}</strong><br/>
          ${companyInformation.address}<br/>
          ${companyInformation.website} &nbsp;·&nbsp; ${companyInformation.email}
        </div>
      </div>

    </div>

    <!-- ============ PERFORATION ============ -->
    <div class="perforation">
      <div class="notch left"></div>
      <div class="notch right"></div>
    </div>

    <!-- ============ STUB (bottom) ============ -->
    <div class="stub">

      <div class="stub-top-row">
        <div>
          <div class="eyebrow">Admission</div>
          <div class="guest-count-row">
            <span class="num">{{eventTicketDetails.totalPersons}}</span>
            <span class="unit">Person(s)</span>
          </div>
        </div>
        <div class="stub-club">
          <div class="club-name-small">{{eventTicketDetails.eventName}}</div>
          <div class="loc-small">{{eventTicketDetails.location}}</div>
        </div>
      </div>

      <div class="stub-meta">
        <div class="stub-meta-item">
          <div class="icon-chip" style="width:7mm;height:7mm;padding:1.5mm;"><svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></div>
          <div class="txt"><div class="label">Starts</div><div class="value">{{eventTicketDetails.startDateTime}}</div></div>
        </div>
        <div class="stub-meta-item">
          <div class="icon-chip violet" style="width:7mm;height:7mm;padding:1.5mm;"><svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div class="txt"><div class="label">Primary Guest</div><div class="value">{{buyerInformation.name}}</div></div>
        </div>
      </div>

      <div class="payment-box">
        <div class="payment-line"><span>Gross Amount</span><span>{{paymentInformation.currency}} {{paymentInformation.grossAmount}}</span></div>
        <div class="payment-line"><span>Service Charge</span><span>{{paymentInformation.currency}} {{paymentInformation.serviceCharge}}</span></div>
        <div class="payment-line total"><span>Total Paid</span><span>{{paymentInformation.currency}} {{paymentInformation.totalAmount}}</span></div>
        <div class="admit-note">Non-transferable. Valid only for the guest(s) and date shown above. ${companyInformation.copyright}</div>
      </div>

    </div>

  </div>

</body>
</html>
`;

export default eventTicketTemplate;
