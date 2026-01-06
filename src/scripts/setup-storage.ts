import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

async function setup() {
    console.log('Setting up storage...');

    if (!fs.existsSync(config.LOCAL_STORAGE_PATH)) {
        fs.mkdirSync(config.LOCAL_STORAGE_PATH, { recursive: true });
    }

    const templatePath = path.join(config.LOCAL_STORAGE_PATH, 'standard-template.pdf');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const form = pdfDoc.getForm();

    // Add some text
    page.drawText('Standard Healthcare Contract', { x: 50, y: 700, size: 20 });
    page.drawText('This contract is between Organization and {{name}}.', { x: 50, y: 650, size: 12 });
    page.drawText('Email: {{email}}', { x: 50, y: 630, size: 12 });
    page.drawText('Price: ${{price}}', { x: 50, y: 610, size: 12 });

    page.drawText('TERMS:', { x: 50, y: 580, size: 12 });
    page.drawText('1. Payment is due upon receipt.', { x: 50, y: 560, size: 10 });
    page.drawText('2. Cancellation requires 24h notice.', { x: 50, y: 540, size: 10 });

    // Add form fields corresponding to our variables
    const nameField = form.createTextField('name');
    nameField.setText('{{name}}'); // Default
    nameField.addToPage(page, { x: 200, y: 650, width: 150, height: 20 });

    const emailField = form.createTextField('email');
    emailField.setText('{{email}}');
    emailField.addToPage(page, { x: 200, y: 630, width: 150, height: 20 });

    const priceField = form.createTextField('price');
    priceField.setText('{{price}}');
    priceField.addToPage(page, { x: 200, y: 610, width: 100, height: 20 });

    const pdfBytes = await pdfDoc.save();

    fs.writeFileSync(templatePath, pdfBytes);
    console.log(`Created dummy template at ${templatePath}`);
}

setup().catch(console.error);
