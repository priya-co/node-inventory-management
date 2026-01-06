import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';

export class ReportGenerator {
  /**
   * Generate CSV content from data array
   */
  static generateCSV<T extends Record<string, any>>(
    data: T[],
    columns: Array<{ key: keyof T; header: string }>
  ): string {
    if (data.length === 0) {
      return '';
    }

    const csvStringifier = createObjectCsvStringifier({
      header: columns.map(col => ({ id: col.key as string, title: col.header }))
    });

    const records = data.map(item =>
      columns.reduce((acc, col) => {
        const value = item[col.key];
        acc[col.key as string] = (value && typeof value === 'object' && (value as any) instanceof Date) ? (value as Date).toISOString() : String(value || '');
        return acc;
      }, {} as Record<string, string>)
    );

    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  }

  /**
   * Generate PDF buffer from data array
   */
  static async generatePDF<T extends Record<string, any>>(
    data: T[],
    title: string,
    columns: string[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Add title
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();

        // Add generation date
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        if (data.length === 0) {
          doc.fontSize(12).text('No data available for this report.');
          doc.end();
          return;
        }

        // Table setup
        const tableTop = 150;
        const itemHeight = 20;
        const columnWidth = (doc.page.width - 100) / columns.length;

        // Draw table header
        doc.fontSize(10).font('Helvetica-Bold');
        columns.forEach((column, i) => {
          doc.text(column, 50 + (i * columnWidth), tableTop, {
            width: columnWidth,
            align: 'left'
          });
        });

        // Draw header line
        doc.moveTo(50, tableTop + 15)
           .lineTo(doc.page.width - 50, tableTop + 15)
           .stroke();

        // Draw table rows
        doc.font('Helvetica');
        data.forEach((item, rowIndex) => {
          const y = tableTop + 25 + (rowIndex * itemHeight);

          // Check if we need a new page
          if (y > doc.page.height - 100) {
            doc.addPage();
            // Redraw header on new page
            doc.fontSize(10).font('Helvetica-Bold');
            columns.forEach((column, i) => {
              doc.text(column, 50 + (i * columnWidth), 50, {
                width: columnWidth,
                align: 'left'
              });
            });
            doc.moveTo(50, 65)
               .lineTo(doc.page.width - 50, 65)
               .stroke();
            doc.font('Helvetica');
          }

          const currentY = rowIndex > 10 ? 50 + 25 + ((rowIndex - 11) * itemHeight) : y;

          columns.forEach((column, colIndex) => {
            const key = this.getColumnKey(column, item);
            const value = item[key];
            const displayValue = value instanceof Date ? value.toLocaleDateString() : String(value || '');

            doc.text(displayValue, 50 + (colIndex * columnWidth), currentY, {
              width: columnWidth,
              align: 'left'
            });
          });
        });

        // Add footer
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Page ${i + 1} of ${totalPages}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper method to map column headers to object keys
   */
  private static getColumnKey(header: string, item: Record<string, any>): string {
    const headerToKeyMap: Record<string, string> = {
      'Product Name': 'product',
      'Product': 'product',
      'SKU': 'sku',
      'Category': 'category',
      'Current Stock': 'currentStock',
      'Minimum Stock': 'minStock',
      'Warehouse': 'warehouse',
      'Last Updated': 'lastUpdated',
      'Date': 'date',
      'Action': 'action',
      'Quantity': 'quantity',
      'Previous Stock': 'previousStock',
      'New Stock': 'newStock',
      'Reason': 'reason'
    };

    return headerToKeyMap[header] || header.toLowerCase().replace(/\s+/g, '');
  }
}