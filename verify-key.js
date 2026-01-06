"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const openai_1 = __importDefault(require("openai"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '.env') });
async function testKey() {
    console.log("Testing OpenAI Key...");
    if (!process.env.OPENAI_API_KEY) {
        console.error("Error: OPENAI_API_KEY is missing in .env");
        return;
    }
    console.log("Key found:", process.env.OPENAI_API_KEY.substring(0, 10) + "...");
    const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log("Success! Response:", response.choices[0].message.content);
    }
    catch (error) {
        console.error("API Error:");
        console.error("Status:", error.status);
        console.error("Code:", error.code); // e.g. insufficient_quota
        console.error("Type:", error.type);
        console.error("Message:", error.message);
    }
}
testKey();
