"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '.env') });
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
        }
        else {
            console.log("Success!");
        }
    }
    catch (error) {
        console.error("Fetch Error:", error);
    }
}
testHF();
