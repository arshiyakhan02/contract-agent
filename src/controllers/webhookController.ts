import { Request, Response } from 'express';
import { contractService } from '../services/contractService';
import { logger } from '../utils/logger';

export class WebhookController {

    /**
     * Endpoint: POST /api/v1/webhooks/init-contract
     * Triggered by CRM/n8n to start a new contract workflow.
     */
    async initContract(req: Request, res: Response) {
        try {
            const { patientData, templateName } = req.body;

            if (!patientData || !patientData.email || !patientData.name) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing patient data (name, email required)'
                });
            }

            // 1. Create Contract
            const contract = await contractService.createContract(patientData, templateName);

            // 2. Auto-Analyze
            try {
                await contractService.analyzeContract(contract.id);
            } catch (analysisErr) {
                logger.error(`Analysis failed for ${contract.id}`, analysisErr);
            }

            return res.status(201).json({
                success: true,
                message: 'Contract initiated successfully',
                data: {
                    contractId: contract.id,
                    status: contract.status,
                    analysis: contract.analysis
                }
            });
        } catch (error: any) {
            logger.error('Error in initContract webhook:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Endpoint: POST /api/v1/webhooks/docusign-connect
     * Listener for DocuSign Connect webhooks.
     */
    async handleDocusignEvent(req: Request, res: Response) {
        try {
            const eventData = req.body;

            logger.info('DocuSign Webhook Received:', eventData);

            const envelopeId = eventData?.envelopeId;
            const status = eventData?.status;

            // ✅ Only when signing is completed
            if (status === 'completed' && envelopeId) {

                const contract =
                    contractService.getContractByEnvelopeId(envelopeId);

                if (contract) {
                    contractService.markAsSigned(contract.id);

                    logger.info(
                        `Contract ${contract.id} marked as SIGNED via DocuSign webhook`
                    );
                } else {
                    logger.warn(
                        `No contract found for envelopeId ${envelopeId}`
                    );
                }
            }

            return res.status(200).send('OK');
        } catch (error) {
            logger.error('Error handling DocuSign webhook:', error);
            return res.status(500).send('Error');
        }
    }

    /**
     * Endpoint: POST /api/v1/contracts/:id/send
     * Manual trigger to send for signature.
     */
    async sendForSignature(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await contractService.sendForSignature(id);

            if (typeof result === 'string') {
                return res.json({
                    success: true,
                    envelopeId: result
                });
            } else {
                return res.json({
                    success: true,
                    envelopeId: result.envelopeId,
                    signingUrl: result.signingUrl
                });
            }
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Endpoint: GET /api/v1/return-url
     * DocuSign redirect after signing completion
     */
    async returnUrl(req: Request, res: Response) {
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Signature Completed</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background: #f4f6f8;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    width: 420px;
    text-align: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }
  .icon {
    font-size: 48px;
    color: #28a745;
  }
  h2 {
    margin: 10px 0;
  }
  p {
    color: #555;
  }
  button {
    background: #28a745;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
  }
</style>
</head>
<body>

<div class="overlay">
  <div class="modal">
    <div class="icon">✔️</div>
    <h2>Signature Completed</h2>
    <p>Your document has been signed successfully.</p>
    <button onclick="closeAndRedirect()">Close</button>
  </div>
</div>

<script>
  function closeAndRedirect() {
    if (window.opener) {
      window.opener.postMessage(
        { type: 'DOCUSIGN_SIGNED' },
        '*'
      );
    }
    window.location.href = '${process.env.APP_BASE_URL}/form';
  }

  setTimeout(closeAndRedirect, 4000);
</script>

</body>
</html>
        `);
    }
}

export const webhookController = new WebhookController();
