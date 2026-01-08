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
    private accessToken: string | null = null;
    private accountId: string | null = null;

    constructor() {
        this.apiClient = new ApiClient();
        this.apiClient.setBasePath(config.DOCUSIGN_BASE_PATH);
        logger.info(`DocuSign REST Base Path: ${config.DOCUSIGN_BASE_PATH}`);
    }

    /**
     * Authenticate with DocuSign using JWT (token reused)
     */
    private async getAccessToken(): Promise<string> {
        if (config.DOCUSIGN_INTEGRATION_KEY === 'mock-integration-key') {
            return 'mock-access-token';
        }

        // ✅ TS-safe return
        if (this.accessToken !== null) {
            return this.accessToken!;
        }

        try {
            let privateKey = config.DOCUSIGN_PRIVATE_KEY.trim();

            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }

            privateKey = privateKey.replace(/\\n/g, '\n');

            this.apiClient.setOAuthBasePath(config.DOCUSIGN_OAUTH_BASE_PATH);

            const response = await this.apiClient.requestJWTUserToken(
                config.DOCUSIGN_INTEGRATION_KEY.trim(),
                config.DOCUSIGN_USER_ID.trim(),
                ['signature', 'impersonation'],
                Buffer.from(privateKey),
                600
            );

            this.accessToken = response.body.access_token;

            // ✅ fetch real account from JWT
            const userInfo = await this.apiClient.getUserInfo(this.accessToken!);
            const account = userInfo.accounts?.find(
                (acc: any) => acc.isDefault === 'true'
            );

            if (!account) {
                throw new Error('No default DocuSign account found');
            }

            this.apiClient.setBasePath(`${account.baseUri}/restapi`);
            this.accountId = account.accountId;

            return this.accessToken!;
        } catch (error: any) {
            logger.error('DocuSign JWT authentication failed:', error);
            throw new Error(`Failed to authenticate with DocuSign: ${error.message}`);
        }
    }

    /**
     * Send envelope for signing (embedded)
     */
    async sendEnvelope(
        pdfBuffer: Buffer,
        signer: Signer,
        docName: string
    ): Promise<string> {
        if (config.DOCUSIGN_INTEGRATION_KEY === 'mock-integration-key') {
            return `mock-envelope-${uuidv4()}`;
        }

        const token = await this.getAccessToken();
        this.apiClient.addDefaultHeader('Authorization', `Bearer ${token}`);

        const envelopesApi = new EnvelopesApi(this.apiClient);
        const CLIENT_USER_ID = signer.clientUserId || '1000';

        const envelope: EnvelopeDefinition = {
            emailSubject: `Please sign: ${docName}`,
            status: 'created',
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
            this.accountId!, // ✅ TS-safe
            { envelopeDefinition: envelope }
        );

        if (!result.envelopeId) {
            throw new Error('Envelope ID not returned');
        }

        return result.envelopeId;
    }

    /**
     * Get embedded signing URL
     */
    async getRecipientViewUrl(
        envelopeId: string,
        signer: Signer,
        returnUrl: string
    ): Promise<string> {
        const token = await this.getAccessToken();
        this.apiClient.addDefaultHeader('Authorization', `Bearer ${token}`);

        const envelopesApi = new EnvelopesApi(this.apiClient);
        const CLIENT_USER_ID = signer.clientUserId || '1000';

        const viewRequest: RecipientViewRequest = {
            returnUrl,
            authenticationMethod: 'none',
            email: signer.email,
            userName: signer.name,
            clientUserId: CLIENT_USER_ID,
            recipientId: '1'
        };

        const result = await envelopesApi.createRecipientView(
            this.accountId!, // ✅ TS-safe
            envelopeId,
            { recipientViewRequest: viewRequest }
        );

        return result.url || '';
    }

    /**
     * Retry logic (used by contractService)
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
                if (attempt === retries) throw err;
                await new Promise(res => setTimeout(res, delayMs));
            }
        }

        throw new Error('Unable to generate signing URL');
    }
}

export const docusignService = new DocusignService();
