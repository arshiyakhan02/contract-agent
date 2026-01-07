import { config } from '../config/env';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
    ApiClient,
    EnvelopesApi,
    EnvelopeDefinition,
    Document,
    Signer as DocusignSigner,
    SignHere,
    Recipients,
    RecipientViewRequest
} from 'docusign-esign';

export interface Signer {
    email: string;
    name: string;
    clientUserId?: string;
}

class DocusignService {
    private apiClient: ApiClient;

    constructor() {
        this.apiClient = new ApiClient();
        this.apiClient.setBasePath(config.DOCUSIGN_BASE_PATH);
        logger.info(`DocuSign REST Base Path: ${config.DOCUSIGN_BASE_PATH}`);
    }

    /**
     * Authenticate with DocuSign using JWT
     */
    private async getAccessToken(): Promise<string> {
        if (config.DOCUSIGN_INTEGRATION_KEY === 'mock-integration-key') {
            return 'mock-access-token';
        }

        try {
            let privateKey = config.DOCUSIGN_PRIVATE_KEY.trim();

            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }

            let formattedKey = privateKey.replace(/\\n/g, '\n');

            if (!formattedKey.includes('BEGIN RSA PRIVATE KEY')) {
                formattedKey = `-----BEGIN RSA PRIVATE KEY-----\n${formattedKey}\n-----END RSA PRIVATE KEY-----`;
            }

            this.apiClient.setOAuthBasePath(config.DOCUSIGN_OAUTH_BASE_PATH);

            const response = await this.apiClient.requestJWTUserToken(
                config.DOCUSIGN_INTEGRATION_KEY.trim(),
                config.DOCUSIGN_USER_ID.trim(),
                ['signature', 'impersonation'],
                Buffer.from(formattedKey),
                600
            );

            return response.body.access_token;
        } catch (error: any) {
            logger.error('DocuSign JWT authentication failed:', error);
            throw new Error(`Failed to authenticate with DocuSign: ${error.message}`);
        }
    }

    /**
     * Send envelope for signing
     */
    async sendEnvelope(
        pdfBuffer: Buffer,
        signer: Signer,
        docName: string
    ): Promise<string> {
        if (config.DOCUSIGN_INTEGRATION_KEY === 'mock-integration-key') {
            return `mock-envelope-${uuidv4()}`;
        }

        try {
            const token = await this.getAccessToken();
            this.apiClient.addDefaultHeader('Authorization', `Bearer ${token}`);

            const envelopesApi = new EnvelopesApi(this.apiClient);

            // ✅ FIX: clientUserId MUST be present for embedded signing
            const CLIENT_USER_ID = signer.clientUserId || '1000';

            const envelope: EnvelopeDefinition = {
                emailSubject: `Please sign: ${docName}`,
                status: 'sent',
                documents: [
                    {
                        documentBase64: pdfBuffer.toString('base64'),
                        name: docName,
                        fileExtension: 'pdf',
                        documentId: '1'
                    } as Document
                ],
                recipients: {
                    signers: [
                        {
                            email: signer.email,
                            name: signer.name,
                            recipientId: '1',
                            clientUserId: CLIENT_USER_ID,
                            tabs: {
                                signHereTabs: [
                                    {
                                        documentId: '1',
                                        pageNumber: '1',
                                        xPosition: '100',
                                        yPosition: '700'
                                    } as SignHere
                                ]
                            }
                        } as DocusignSigner
                    ]
                } as Recipients
            };

            const result = await envelopesApi.createEnvelope(
                config.DOCUSIGN_ACCOUNT_ID,
                { envelopeDefinition: envelope }
            );

            if (!result.envelopeId) {
                throw new Error('Envelope ID not returned');
            }

            logger.info(`Envelope sent successfully: ${result.envelopeId}`);
            return result.envelopeId;
        } catch (error: any) {
            logger.error('Error sending DocuSign envelope:', error);
            throw new Error(`Failed to send envelope: ${error.message}`);
        }
    }

    /**
     * Get embedded signing URL
     */
    async getRecipientViewUrl(
        envelopeId: string,
        signer: Signer,
        returnUrl: string
    ): Promise<string> {
        if (config.DOCUSIGN_INTEGRATION_KEY === 'mock-integration-key') {
            return `https://demo.docusign.net/Signing/MOCK_VIEW?envelopeId=${envelopeId}`;
        }

        const token = await this.getAccessToken();
        this.apiClient.addDefaultHeader('Authorization', `Bearer ${token}`);

        const envelopesApi = new EnvelopesApi(this.apiClient);

        // ✅ SAME clientUserId as envelope
        const CLIENT_USER_ID = signer.clientUserId || '1000';

        const viewRequest: RecipientViewRequest = {
            returnUrl,
            authenticationMethod: 'none',
            email: signer.email,
            userName: signer.name,
            clientUserId: CLIENT_USER_ID
        };

        const result = await envelopesApi.createRecipientView(
            config.DOCUSIGN_ACCOUNT_ID,
            envelopeId,
            { recipientViewRequest: viewRequest }
        );

        return result.url || '';
    }

    /**
     * Retry logic for recipient view URL
     */
    async getRecipientViewUrlWithRetry(
        envelopeId: string,
        signer: Signer,
        returnUrl: string,
        retries: number = 3,
        delayMs: number = 1500
    ): Promise<string> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logger.info(`Recipient view attempt ${attempt}`);
                const url = await this.getRecipientViewUrl(
                    envelopeId,
                    signer,
                    returnUrl
                );

                if (url) return url;
                throw new Error('Empty signing URL');
            } catch (err: any) {
                logger.warn(`Attempt ${attempt} failed: ${err.message}`);
                if (attempt === retries) throw err;
                await new Promise(res => setTimeout(res, delayMs));
            }
        }

        throw new Error('Unable to generate signing URL');
    }
}

export const docusignService = new DocusignService();
