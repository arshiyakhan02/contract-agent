import pdfParse from "pdf-parse";
import axios from "axios";
import { config } from "../config/env";
import { logger } from "../utils/logger";

class AiService {
  constructor() { }

  /**
   * Extracts text from a PDF buffer.
   */
  async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text || "";
    } catch (error: any) {
      logger.error("PDF parse error:", error);
      return "";
    }
  }

  /**
   * Analyzes the contract text.
   */
  async analyzeContract(contractText: string): Promise<any> {
    try {
      if (!contractText || contractText.trim().length < 50) {
        throw new Error("Contract text is empty or too short");
      }

      const prompt = `
You are a legal AI assistant.
Analyze the contract and return ONLY valid JSON.

{
  "summary": "Short summary",
  "key_clauses": [
    { "title": "Clause name", "explanation": "Simple explanation", "risk_level": "Low | Medium | High" }
  ]
}

Contract:
${contractText.slice(0, 8000)}
`;

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          params: { key: config.GEMINI_API_KEY },
          headers: { "Content-Type": "application/json" },
          timeout: 30000
        }
      );

      const data = response.data;

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No candidates returned from Gemini");
      }

      let text = data.candidates[0].content.parts[0].text || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid JSON from Gemini");
      }

      return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error("Gemini analysis error:", errorMessage);
      return {
        summary: "AI analysis failed.",
        key_clauses: [
          {
            title: "Error",
            explanation: errorMessage,
            risk_level: "Unknown"
          }
        ]
      };
    }
  }

  /**
   * Chat with the contract.
   */
  async chatWithContract(
    sessionId: string,
    userQuestion: string,
    contractText: string
  ): Promise<string> {
    try {
      const prompt = `
You are a smart AI assistant inside a contract platform.

Rules:
1. If the user's message is a greeting or small talk, reply in one or two normal sentences.
2. If the user's message is about the contract, use the contract text.
3. Format contract-related answers ONLY using simple bullet points.
4. Do NOT use markdown, headings, ###, **bold**, or special formatting.
5. Use plain text only.


Contract:
${contractText.slice(0, 8000)}

User message:
${userQuestion}
`;

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          params: { key: config.GEMINI_API_KEY },
          headers: { "Content-Type": "application/json" },
          timeout: 30000
        }
      );

      const data = response.data;

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      logger.error("Gemini chat error:", errorMessage);
      return `I'm having trouble connecting to my brain right now. (Error: ${errorMessage})`;
    }
  }
}

export const aiService = new AiService();
