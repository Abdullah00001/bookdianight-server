import { renderHtmlToPdf } from '../app/utils/pdf.utils';
import { clubTicketTemplate } from '../app/templates/clubTicket.template';
import { eventTicketTemplate } from '../app/templates/eventTicket.template';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Testing minimal HTML render...');
  const minimalHtml = '<html><body><h1>Minimal Test</h1></body></html>';
  const minimalPdf = await renderHtmlToPdf(minimalHtml);
  console.log(`Minimal PDF generated: ${minimalPdf.length} bytes`);

  console.log('Testing Club template...');
  const clubHtml = clubTicketTemplate({
    ticketId: 'CLUB-1234',
    customerName: 'Test User',
    clubName: 'Test Club',
    bookingDate: '2026-10-01',
    qrCodeData:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  });
  const clubPdf = await renderHtmlToPdf(clubHtml);
  console.log(`Club PDF generated: ${clubPdf.length} bytes`);

  console.log('Testing Event template...');
  const eventHtml = eventTicketTemplate({
    ticketId: 'EVENT-1234',
    customerName: 'Test User',
    eventName: 'Test Event',
    eventDate: '2026-10-01',
    eventTime: '10:00 PM',
    qrCodeData:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  });
  const eventPdf = await renderHtmlToPdf(eventHtml);
  console.log(`Event PDF generated: ${eventPdf.length} bytes`);

  console.log('ALL PDF RENDERING SUCCESSFUL!');
  process.exit(0);
}

main().catch((err) => {
  console.error('PDF TEST FAILED:', err);
  process.exit(1);
});
