import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const result = dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
});

if (result.error) {
    console.error('❌ Error loading .env file:', result.error);
} else {
    console.log('✅ .env file loaded successfully');

    console.log(
        'ENV CHECK → DOCUSIGN_OAUTH_BASE_PATH:',
        process.env.DOCUSIGN_OAUTH_BASE_PATH
    );

    console.log(
        'ENV CHECK → DOCUSIGN_BASE_PATH:',
        process.env.DOCUSIGN_BASE_PATH
    );

    console.log(
        'ENV CHECK → GEMINI_API_KEY exists:',
        !!process.env.GEMINI_API_KEY
    );
}

/**
 * Application configuration interface
 */
interface Config {
    PORT: number;
    NODE_ENV: string;

    // AI Keys
    HUGGINGFACE_API_KEY: string;
    OPENAI_API_KEY: string;
    GEMINI_API_KEY: string;

    // DocuSign
    DOCUSIGN_ACCOUNT_ID: string;
    DOCUSIGN_INTEGRATION_KEY: string;
    DOCUSIGN_USER_ID: string;
    DOCUSIGN_PRIVATE_KEY: string;
    DOCUSIGN_BASE_PATH: string;          // REST API base path
    DOCUSIGN_OAUTH_BASE_PATH: string;    // OAuth hostname ONLY

    // Storage
    STORAGE_TYPE: 'local' | 's3' | 'gdrive';
    LOCAL_STORAGE_PATH: string;
}

/**
 * Exported config object
 */
export const config: Config = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // AI
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'mock-openai-key',
    GEMINI_API_KEY: (process.env.GEMINI_API_KEY || 'mock-gemini-key').trim(),

    // DocuSign
    DOCUSIGN_ACCOUNT_ID: process.env.DOCUSIGN_ACCOUNT_ID || 'mock-account-id',
    DOCUSIGN_INTEGRATION_KEY:
        process.env.DOCUSIGN_INTEGRATION_KEY || 'mock-integration-key',
    DOCUSIGN_USER_ID: process.env.DOCUSIGN_USER_ID || 'mock-user-id',
    DOCUSIGN_PRIVATE_KEY:
        process.env.DOCUSIGN_PRIVATE_KEY || 'mock-private-key',

    // ✅ IMPORTANT: Correct DocuSign paths
    DOCUSIGN_BASE_PATH:
        process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',

    // ⚠️ HOSTNAME ONLY — no https, no /restapi
    DOCUSIGN_OAUTH_BASE_PATH:
        process.env.DOCUSIGN_OAUTH_BASE_PATH || 'account-d.docusign.com',

    // Storage
    STORAGE_TYPE:
        (process.env.STORAGE_TYPE as 'local' | 's3' | 'gdrive') || 'local',
    LOCAL_STORAGE_PATH:
        process.env.LOCAL_STORAGE_PATH ||
        path.resolve(__dirname, '../../storage'),
};
