import { Router } from 'express';
import { ApiEndpointController } from '../controllers/ApiEndpointController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', ApiEndpointController.list);
router.post('/', ApiEndpointController.create);
router.post('/detect', ApiEndpointController.detect);
router.get('/:id', ApiEndpointController.getById);
router.patch('/:id', ApiEndpointController.update);
router.delete('/:id', ApiEndpointController.delete);
router.patch('/:id/monitoring', ApiEndpointController.toggleMonitoring);

export default router;
