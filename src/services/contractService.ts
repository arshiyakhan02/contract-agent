import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { templateService } from './templateService';
import { storageService } from './storageService';
import { aiService } from './aiService';
import { docusignService } from './docusignService';
import { logger } from '../utils/logger';
import { addSignatureAnchorToPdf } from '../utils/pdfAnchor';

// Simple in-memory DB
interface ContractRecord {
    id: string;
    patientName: string;
    status: 'DRAFT' | 'ANALYZED' | 'SENT_FOR_SIGNATURE' | 'SIGNED' | 'ARCHIVED';
    filePath: string;
    createdAt: Date;
    metadata: any;
    analysis?: any;
    envelopeId?: string;
}

const db: Map<string, ContractRecord> = new Map();

/**
 * Service to orchestrate the contract lifecycle.
 */
class ContractService {

    // 1️⃣ Create Contract
    async createContract(patientData: any, templateName: string): Promise<ContractRecord> {
        const id = uuidv4();
        logger.info(`Creating contract ${id}`);

        const templateBuffer = await storageService.getFile(templateName);

        const filledPdf = await templateService.generateContract(templateBuffer, {
            name: patientData.name,
            email: patientData.email,
            date: new Date().toISOString().split('T')[0],
            price: patientData.price || "100.00"
        });

        const fileName = `contract-${id}.pdf`;
        const savedPath = await storageService.uploadFile(filledPdf, fileName);

        const record: ContractRecord = {
            id,
            patientName: patientData.name,
            status: 'DRAFT',
            filePath: savedPath,
            createdAt: new Date(),
            metadata: patientData
        };

        db.set(id, record);
        return record;
    }

    // 2️⃣ Analyze Contract
    async analyzeContract(id: string): Promise<any> {
        const record = db.get(id);
        if (!record) throw new Error('Contract not found');

        const pdfBuffer = await storageService.getFile(
            path.basename(record.filePath)
        );

        const text = await aiService.extractText(pdfBuffer);
        const analysis = await aiService.analyzeContract(text);

        record.status = 'ANALYZED';
        record.analysis = analysis;
        record.metadata.fullText = text;

        db.set(id, record);
        return analysis;
    }

    // 3️⃣ Send for Signature
    async sendForSignature(
        id: string
    ): Promise<{ envelopeId: string; signingUrl?: string }> {

        const record = db.get(id);
        if (!record) throw new Error('Contract not found');

        const pdfBuffer = await storageService.getFile(
            path.basename(record.filePath)
        );

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("PDF buffer is empty");
        }

        const preparedPdf = await addSignatureAnchorToPdf(pdfBuffer);

        const clientUserId = id;

        const signer = {
            name: record.metadata.name,
            email: record.metadata.email,
            clientUserId
        };

        const envelopeId = await docusignService.sendEnvelope(
            preparedPdf,
            signer,
            `Contract-${id}`
        );

        record.status = 'SENT_FOR_SIGNATURE';
        record.envelopeId = envelopeId;
        db.set(id, record);

        const signingUrl = await docusignService.getRecipientViewUrlWithRetry(
            envelopeId,
            signer,
            'http://localhost:3000/api/v1/return-url'
        );

        return { envelopeId, signingUrl };
    }


    // 4️⃣ Chat
    async chatWithContract(id: string, question: string): Promise<string> {
        const record = db.get(id);
        if (!record) throw new Error('Contract not found');

        let text = record.metadata.fullText;
        if (!text) {
            const pdfBuffer = await storageService.getFile(
                path.basename(record.filePath)
            );
            text = await aiService.extractText(pdfBuffer);
            record.metadata.fullText = text;
            db.set(id, record);
        }

        return aiService.chatWithContract(id, question, text);
    }

    // 🔹 Get contract by ID
    getContract(id: string) {
        return db.get(id);
    }

    // 🔹 Get contract by DocuSign envelopeId (WEBHOOK USE)
    getContractByEnvelopeId(envelopeId: string) {
        return Array.from(db.values()).find(
            (c) => c.envelopeId === envelopeId
        );
    }

    // 🔹 Mark contract as SIGNED (WEBHOOK USE)
    markAsSigned(contractId: string) {
        const record = db.get(contractId);
        if (!record) return;

        record.status = 'SIGNED';
        record.metadata.signedAt = new Date().toISOString();
        db.set(contractId, record);
    }
}

export const contractService = new ContractService();
