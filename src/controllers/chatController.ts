import { Request, Response } from 'express';
import { contractService } from '../services/contractService';
import { logger } from '../utils/logger';

export class ChatController {

    /**
     * Endpoint: POST /api/v1/contracts/:id/chat
     * Chat with the specific contract.
     */
    async chat(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { question } = req.body;

            if (!question) {
                return res.status(400).json({ success: false, message: 'Question is required' });
            }

            const answer = await contractService.chatWithContract(id, question);

            return res.json({
                success: true,
                data: {
                    contractId: id,
                    question,
                    answer
                }
            });
        } catch (error: any) {
            logger.error(`Error in chat for contract ${req.params.id}:`, error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export const chatController = new ChatController();

