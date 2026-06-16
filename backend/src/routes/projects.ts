import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', ProjectController.list);
router.post('/', ProjectController.create);
router.get('/:id', ProjectController.getById);
router.patch('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);
router.post('/:id/regenerate-webhook-token', requireWorkspaceRole('owner', 'admin'), ProjectController.regenerateWebhookToken);
router.post('/:id/health-checks/test', ProjectController.testHealthCheck);
router.get('/:id/health-checks', ProjectController.getHealthChecks);

export default router;
