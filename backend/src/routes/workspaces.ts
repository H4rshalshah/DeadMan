import { Router } from 'express';
import { WorkspaceController } from '../controllers/WorkspaceController';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth';

const router = Router();

// All workspace routes require auth
router.use(requireAuth);

// Workspace CRUD - Owner only for delete
router.post('/', WorkspaceController.create);
router.get('/', WorkspaceController.list);
router.get('/current', WorkspaceController.getCurrent);
router.get('/:id', WorkspaceController.getById);
router.patch('/:id', requireWorkspaceRole('owner', 'admin'), WorkspaceController.update);
router.put('/:id/switch', WorkspaceController.switchWorkspace);
router.delete('/:id', requireWorkspaceRole('owner'), WorkspaceController.delete);

// Team management - Admin+ for management actions
router.get('/:id/members', WorkspaceController.getMembers);
router.post('/:id/invites', requireWorkspaceRole('owner', 'admin'), WorkspaceController.inviteMember);
router.get('/:id/invites', WorkspaceController.getInvites);
router.patch('/:id/members/:memberId/role', requireWorkspaceRole('owner', 'admin'), WorkspaceController.changeMemberRole);
router.delete('/:id/members/:memberId', requireWorkspaceRole('owner', 'admin'), WorkspaceController.removeMember);
router.delete('/:id/invites/:inviteId', requireWorkspaceRole('owner', 'admin'), WorkspaceController.revokeInvite);

export default router;

// Invite acceptance (no workspace ID needed)
export const inviteRouter = Router();
inviteRouter.post('/invites/:token/accept', requireAuth, WorkspaceController.acceptInvite);
