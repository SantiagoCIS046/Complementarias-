// =============================================
// pdfGenerator.js - Generación de PDFs
// =============================================
// Requiere instalar: npm install pdfkit
const PDFDocument = require('pdfkit');

/**
 * Crea un PDF simple con título y lista de datos.
 * @param {object} res - Objeto response de Express para enviar el PDF
 * @param {string} title - Título del documento
 * @param {object[]} rows - Arreglo de objetos a listar
 */
const generatePdf = (res, title, rows) => {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();

  rows.forEach((row, index) => {
    doc.fontSize(11).text(`${index + 1}. ${JSON.stringify(row)}`);
    doc.moveDown(0.3);
  });

  doc.end();
};

module.exports = { generatePdf };
