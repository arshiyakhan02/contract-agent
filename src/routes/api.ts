import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';
import { chatController } from '../controllers/chatController';
import { storageController, upload } from '../controllers/storageController';

const router = Router();

// CRM / Automation Triggers
router.post('/webhooks/init-contract', (req, res) =>
    webhookController.initContract(req, res)
);
router.post('/webhooks/docusign-connect', (req, res) =>
    webhookController.handleDocusignEvent(req, res)
);

// Storage
router.post('/storage/upload', upload.single('file'), (req, res) =>
    storageController.uploadFile(req, res)
);

// User / Front-end Interactions
router.post('/contracts/:id/send', (req, res) =>
    webhookController.sendForSignature(req, res)
);
router.post('/contracts/:id/chat', (req, res) =>
    chatController.chat(req, res)
);

// ✅ DocuSign Redirect URL (ADD THIS)
router.get('/return-url', (req, res) =>
    webhookController.returnUrl(req, res)
);

// Debug/View
router.get('/contracts/:id', (req, res) => {
    const { contractService } = require('../services/contractService');
    const contract = contractService.getContract(req.params.id);
    if (contract) {
        res.json({ success: true, data: contract });
    } else {
        res.status(404).json({ success: false, message: 'Not found' });
    }
});

export default router;
