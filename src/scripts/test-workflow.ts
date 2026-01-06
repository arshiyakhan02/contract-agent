import { contractService } from '../services/contractService';
import { logger } from '../utils/logger';

async function runTest() {
    console.log('--- Starting System Test ---');

    const patientData = {
        name: "John Doe",
        email: "john@example.com",
        price: "250.00"
    };

    try {
        // 1. Initiate Contract
        console.log('\n1. Initiating Contract...');
        const contract = await contractService.createContract(patientData, 'standard-template.pdf');
        console.log(`Contract Created: ${contract.id}`);
        console.log(`Status: ${contract.status}`);
        console.log(`File: ${contract.filePath}`);

        // 2. Analyze
        console.log('\n2. Analyzing Contract...');
        const analysis = await contractService.analyzeContract(contract.id);
        console.log('Analysis Result:', JSON.stringify(analysis, null, 2));

        // 3. Chat
        console.log('\n3. Testing Chat...');
        const question = "What is the cancellation policy?";
        const answer = await contractService.chatWithContract(contract.id, question);
        console.log(`Q: ${question}`);
        console.log(`A: ${answer}`);

        // 4. Send for Signature
        console.log('\n4. Sending for Signature...');
        const envelopeId = await contractService.sendForSignature(contract.id);
        console.log(`Envelope ID: ${envelopeId}`);

        console.log('\n--- Test Complete: SUCCESS ---');
    } catch (error) {
        console.error('\n--- Test Failed ---');
        console.error(error);
    }
}

// Basic mock of storage to ensure template exists if setup wasn't run (or rely on user running setup)
// checking if we can run setup here? No, let's assume setup was run or we run it manually.

runTest();
