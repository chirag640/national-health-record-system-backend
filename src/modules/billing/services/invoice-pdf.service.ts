import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface InvoicePdfOptions {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: string;

  // Hospital details
  hospitalName: string;
  hospitalAddress?: string;
  hospitalGSTIN?: string;
  hospitalPAN?: string;

  // Patient details
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientAddress?: string;
  patientGSTIN?: string;

  // Line items
  items: Array<{
    description: string;
    serviceType: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
    totalAmount: number;
  }>;

  // Totals
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;

  // Additional info
  notes?: string;
  termsAndConditions?: string;
}

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  constructor() {}

  /**
   * Generate invoice PDF and return as Buffer
   */
  async generateInvoicePdf(options: InvoicePdfOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate PDF content
        this.buildInvoice(doc, options);

        // Finalize PDF
        doc.end();
      } catch (error) {
        this.logger.error('Failed to generate PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate invoice PDF and return as readable stream
   */
  generateInvoiceStream(options: InvoicePdfOptions): Readable {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    this.buildInvoice(doc, options);
    doc.end();
    return doc as any;
  }

  /**
   * Build the invoice PDF document
   */
  private buildInvoice(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    // Header
    this.generateHeader(doc, invoice);

    // Invoice details
    this.generateInvoiceInfo(doc, invoice);

    // Customer information
    this.generateCustomerInfo(doc, invoice);

    // Line items table
    this.generateItemsTable(doc, invoice);

    // Totals section
    this.generateTotals(doc, invoice);

    // Payment information
    this.generatePaymentInfo(doc, invoice);

    // Notes and Terms
    this.generateFooter(doc, invoice);
  }

  /**
   * Generate document header
   */
  private generateHeader(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    doc.fontSize(20).font('Helvetica-Bold').text(invoice.hospitalName, 50, 50);

    if (invoice.hospitalAddress) {
      doc.fontSize(10).font('Helvetica').text(invoice.hospitalAddress, 50, 75, { width: 300 });
    }

    // GST and PAN
    let yPos = invoice.hospitalAddress ? 95 : 75;
    if (invoice.hospitalGSTIN) {
      doc.fontSize(9).text(`GSTIN: ${invoice.hospitalGSTIN}`, 50, yPos);
      yPos += 12;
    }
    if (invoice.hospitalPAN) {
      doc.fontSize(9).text(`PAN: ${invoice.hospitalPAN}`, 50, yPos);
    }

    // Invoice title
    doc.fontSize(26).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });

    // Status badge
    const statusColor = this.getStatusColor(invoice.status);
    doc
      .fontSize(12)
      .fillColor(statusColor)
      .text(invoice.status.toUpperCase(), 400, 85, { align: 'right' });

    doc.fillColor('#000000'); // Reset color

    // Horizontal line
    doc.strokeColor('#aaa').lineWidth(1).moveTo(50, 135).lineTo(550, 135).stroke();
  }

  /**
   * Generate invoice information section
   */
  private generateInvoiceInfo(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    const yPos = 150;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Invoice Number:', 50, yPos)
      .font('Helvetica')
      .text(invoice.invoiceNumber, 150, yPos);

    doc
      .font('Helvetica-Bold')
      .text('Invoice Date:', 50, yPos + 15)
      .font('Helvetica')
      .text(this.formatDate(invoice.invoiceDate), 150, yPos + 15);

    doc
      .font('Helvetica-Bold')
      .text('Due Date:', 50, yPos + 30)
      .font('Helvetica')
      .text(this.formatDate(invoice.dueDate), 150, yPos + 30);
  }

  /**
   * Generate customer information section
   */
  private generateCustomerInfo(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    const yPos = 150;

    doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 320, yPos);

    doc.font('Helvetica').text(invoice.patientName, 320, yPos + 15);

    let customerYPos = yPos + 30;
    if (invoice.patientEmail) {
      doc.text(invoice.patientEmail, 320, customerYPos);
      customerYPos += 15;
    }
    if (invoice.patientPhone) {
      doc.text(invoice.patientPhone, 320, customerYPos);
      customerYPos += 15;
    }
    if (invoice.patientAddress) {
      doc.text(invoice.patientAddress, 320, customerYPos, { width: 230 });
      customerYPos += 30;
    }
    if (invoice.patientGSTIN) {
      doc.text(`GSTIN: ${invoice.patientGSTIN}`, 320, customerYPos);
    }
  }

  /**
   * Generate items table
   */
  private generateItemsTable(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    const tableTop = 250;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');

    this.generateTableRow(doc, tableTop, 'Description', 'Qty', 'Rate', 'Discount', 'Tax', 'Amount');

    // Header line
    doc
      .strokeColor('#aaa')
      .lineWidth(1)
      .moveTo(50, tableTop + 20)
      .lineTo(550, tableTop + 20)
      .stroke();

    // Table rows
    doc.font('Helvetica');
    let yPos = tableTop + 30;

    invoice.items.forEach((item) => {
      this.generateTableRow(
        doc,
        yPos,
        item.description,
        item.quantity.toString(),
        this.formatCurrency(item.unitPrice, invoice.currency),
        item.discountAmount ? this.formatCurrency(item.discountAmount, invoice.currency) : '-',
        item.taxAmount ? this.formatCurrency(item.taxAmount, invoice.currency) : '-',
        this.formatCurrency(item.totalAmount, invoice.currency),
      );
      yPos += 25;

      // Add page break if needed
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
    });

    // Bottom line
    doc.strokeColor('#aaa').lineWidth(1).moveTo(50, yPos).lineTo(550, yPos).stroke();

    // Return updated position for potential future use
    // return yPos + 10;
  }

  /**
   * Generate table row
   */
  private generateTableRow(
    doc: PDFKit.PDFDocument,
    y: number,
    description: string,
    qty: string,
    rate: string,
    discount: string,
    tax: string,
    amount: string,
  ): void {
    doc
      .fontSize(9)
      .text(description, 50, y, { width: 200 })
      .text(qty, 260, y, { width: 50, align: 'center' })
      .text(rate, 310, y, { width: 60, align: 'right' })
      .text(discount, 375, y, { width: 50, align: 'right' })
      .text(tax, 430, y, { width: 50, align: 'right' })
      .text(amount, 485, y, { width: 65, align: 'right' });
  }

  /**
   * Generate totals section
   */
  private generateTotals(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    // Calculate position based on items
    const yPos = Math.max(400, 250 + invoice.items.length * 25 + 60);

    doc.fontSize(10);

    // Subtotal
    doc
      .font('Helvetica')
      .text('Subtotal:', 400, yPos, { width: 90, align: 'right' })
      .text(this.formatCurrency(invoice.subtotal, invoice.currency), 495, yPos, {
        width: 60,
        align: 'right',
      });

    // Discount
    if (invoice.totalDiscount > 0) {
      doc
        .text('Discount:', 400, yPos + 20, { width: 90, align: 'right' })
        .text(`-${this.formatCurrency(invoice.totalDiscount, invoice.currency)}`, 495, yPos + 20, {
          width: 60,
          align: 'right',
        });
    }

    // Tax
    if (invoice.totalTax > 0) {
      doc
        .text('Tax/GST:', 400, yPos + 40, { width: 90, align: 'right' })
        .text(this.formatCurrency(invoice.totalTax, invoice.currency), 495, yPos + 40, {
          width: 60,
          align: 'right',
        });
    }

    // Total line
    doc
      .strokeColor('#aaa')
      .lineWidth(1)
      .moveTo(400, yPos + 60)
      .lineTo(555, yPos + 60)
      .stroke();

    // Total
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total:', 400, yPos + 70, { width: 90, align: 'right' })
      .text(this.formatCurrency(invoice.totalAmount, invoice.currency), 495, yPos + 70, {
        width: 60,
        align: 'right',
      });

    // Paid amount
    if (invoice.paidAmount > 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Paid:', 400, yPos + 95, { width: 90, align: 'right' })
        .fillColor('green')
        .text(this.formatCurrency(invoice.paidAmount, invoice.currency), 495, yPos + 95, {
          width: 60,
          align: 'right',
        })
        .fillColor('#000000');
    }

    // Balance
    if (invoice.balanceAmount > 0) {
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Balance Due:', 400, yPos + 115, { width: 90, align: 'right' })
        .fillColor('red')
        .text(this.formatCurrency(invoice.balanceAmount, invoice.currency), 495, yPos + 115, {
          width: 60,
          align: 'right',
        })
        .fillColor('#000000');
    }
  }

  /**
   * Generate payment information
   */
  private generatePaymentInfo(doc: PDFKit.PDFDocument, _invoice: InvoicePdfOptions): void {
    const yPos = 600;

    doc.fontSize(10).font('Helvetica-Bold').text('Payment Information:', 50, yPos);

    doc
      .font('Helvetica')
      .fontSize(9)
      .text(
        'Please make payment via cash, card, UPI, or net banking at the hospital reception.',
        50,
        yPos + 15,
        { width: 500 },
      );
  }

  /**
   * Generate footer with notes and terms
   */
  private generateFooter(doc: PDFKit.PDFDocument, invoice: InvoicePdfOptions): void {
    const yPos = 650;

    // Notes
    if (invoice.notes) {
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, yPos);

      doc
        .font('Helvetica')
        .fontSize(9)
        .text(invoice.notes, 50, yPos + 15, { width: 500 });
    }

    // Terms and conditions
    if (invoice.termsAndConditions) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Terms & Conditions:', 50, yPos + 50);

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(invoice.termsAndConditions, 50, yPos + 65, { width: 500 });
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666')
      .text(
        'Thank you for your trust in our healthcare services. For queries, please contact our billing department.',
        50,
        750,
        { align: 'center', width: 500 },
      );
  }

  /**
   * Format date as DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * Get status color
   */
  private getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') {
      return '#22c55e';
    }
    if (statusLower === 'overdue') {
      return '#ef4444';
    }
    if (statusLower === 'partially-paid') {
      return '#f59e0b';
    }
    if (statusLower === 'cancelled') {
      return '#6b7280';
    }
    return '#3b82f6'; // pending/draft
  }
}
