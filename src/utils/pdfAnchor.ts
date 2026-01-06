import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function addSignatureAnchorToPdf(
    pdfBuffer: Buffer
): Promise<Buffer> {

    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const { width } = lastPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ✅ Anchor text (DocuSign will search this)
    const anchorText = 'Authorized Signature:';

    lastPage.drawText(anchorText, {
        x: width / 2 - 100,
        y: 80,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    const updatedPdf = await pdfDoc.save();
    return Buffer.from(updatedPdf);
}
