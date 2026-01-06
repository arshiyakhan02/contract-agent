"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const docusign_esign_1 = require("docusign-esign");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '.env') });
const config = {
    DOCUSIGN_INTEGRATION_KEY: process.env.DOCUSIGN_INTEGRATION_KEY,
    DOCUSIGN_USER_ID: process.env.DOCUSIGN_USER_ID,
    DOCUSIGN_PRIVATE_KEY: process.env.DOCUSIGN_PRIVATE_KEY || '',
    DOCUSIGN_BASE_PATH: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi'
};
async function testDocuSign() {
    console.log("Testing DocuSign Auth...");
    if (!config.DOCUSIGN_INTEGRATION_KEY || !config.DOCUSIGN_USER_ID || !config.DOCUSIGN_PRIVATE_KEY) {
        console.error("Missing DocuSign credentials in .env");
        return;
    }
    const apiClient = new docusign_esign_1.ApiClient();
    apiClient.setBasePath(config.DOCUSIGN_BASE_PATH);
    apiClient.setOAuthBasePath('account-d.docusign.com'); // Sandbox
    try {
        const privateKey = config.DOCUSIGN_PRIVATE_KEY;
        console.log(`Key Length: ${privateKey.length}`);
        console.log(`Includes Begin Header: ${privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')}`);
        console.log(`Includes End Header: ${privateKey.includes('-----END RSA PRIVATE KEY-----')}`);
        console.log(`Number of lines (newlines): ${privateKey.split('\n').length}`);
        const formattedKey = privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')
            ? privateKey
            : `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;
        // Log first few chars to see if it's messed up
        console.log(`Formatted Key Starts With: ${formattedKey.substring(0, 35)}...`);
        console.log("Requesting JWT...");
        const results = await apiClient.requestJWTUserToken(config.DOCUSIGN_INTEGRATION_KEY, config.DOCUSIGN_USER_ID, ['signature', 'impersonation'], Buffer.from(formattedKey), 600);
        console.log("Success! Access Token received.");
        console.log("Token starts with:", results.body.access_token.substring(0, 10));
        // Optional: Get User Info
        apiClient.addDefaultHeader('Authorization', 'Bearer ' + results.body.access_token);
        const userInfo = await apiClient.getUserInfo(results.body.access_token);
        console.log("User Info:", userInfo.accounts[0].accountName);
    }
    catch (error) {
        console.error("DocuSign Error:");
        if (error.response && error.response.body) {
            console.error(JSON.stringify(error.response.body, null, 2));
        }
        else {
            console.error(error);
        }
    }
}
testDocuSign();
