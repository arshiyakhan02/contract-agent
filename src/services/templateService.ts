import { PDFDocument } from 'pdf-lib';
import { logger } from '../utils/logger';

interface ContractVariables {
    [key: string]: string;
}

export class TemplateService {
    /**
     * Loads a PDF template and injects variables into Form Fields.
     * Assumes the PDF has form fields matching the variable keys.
     */
    async generateContract(templateBuffer: Buffer, variables: ContractVariables): Promise<Buffer> {
        try {
            const pdfDoc = await PDFDocument.load(templateBuffer);
            const form = pdfDoc.getForm();

            for (const [key, value] of Object.entries(variables)) {
                try {
                    const field = form.getTextField(key);
                    if (field) {
                        field.setText(value);
                        // Optional: Make read-only after filling
                        field.enableReadOnly();
                    }
                } catch (err) {
                    logger.warn(`Field '${key}' not found in PDF template or is not a text field.`);
                }
            }

            // Flatten the form to make fields uneditable parts of the page content
            form.flatten();

            const pdfBytes = await pdfDoc.save();
            return Buffer.from(pdfBytes);
        } catch (error) {
            logger.error('Error generating contract from template:', error);
            throw error;
        }
    }
}

export const templateService = new TemplateService();
