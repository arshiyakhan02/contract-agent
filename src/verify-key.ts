
import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testKey() {
    console.log("Testing OpenAI Key...");
    if (!process.env.OPENAI_API_KEY) {
        console.error("Error: OPENAI_API_KEY is missing in .env");
        return;
    }
    console.log("Key found:", process.env.OPENAI_API_KEY.substring(0, 10) + "...");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log("Success! Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("API Error:");
        console.error("Status:", error.status);
        console.error("Code:", error.code); // e.g. insufficient_quota
        console.error("Type:", error.type);
        console.error("Message:", error.message);
    }
}

testKey();
