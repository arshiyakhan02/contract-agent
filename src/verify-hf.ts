
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

async function testHF() {
    console.log("Testing Hugging Face Key...");
    console.log("Key:", HF_KEY ? HF_KEY.substring(0, 5) + "..." : "MISSING");

    if (!HF_KEY) {
        console.error("Error: HUGGINGFACE_API_KEY is missing.");
        return;
    }

    try {
        console.log("Sending request to:", MODEL_ENDPOINT);
        const response = await fetch(MODEL_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${HF_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: "<s>[INST] Say hello! [/INST]",
                parameters: { max_new_tokens: 50 },
            }),
        });

        console.log("Status:", response.status, response.statusText);

        const text = await response.text();
        console.log("Raw Response Body:", text);

        if (!response.ok) {
            console.error("Request failed.");
        } else {
            console.log("Success!");
        }

    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

testHF();
