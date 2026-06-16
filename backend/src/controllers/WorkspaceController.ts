import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { WorkspaceModel, WorkspaceMemberModel, InviteModel, UserModel } from '../models/User';
import { z } from 'zod';

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'engineer', 'viewer']).default('engineer'),
});

const changeRoleSchema = z.object({
  role: z.enum(['admin', 'engineer', 'viewer']),
});

export class WorkspaceController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name } = createWorkspaceSchema.parse(req.body);
      const result = await AuthService.createWorkspace(req.userId!, name);
      res.status(201).json(result.workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workspaces = await WorkspaceModel.findByUser(req.userId!);
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  }

  static async getCurrent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user || !user.currentWorkspaceId) {
        res.json(null);
        return;
      }
      const workspace = await AuthService.getWorkspaceWithRole(user.currentWorkspaceId, req.userId!);
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch current workspace' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workspace = await AuthService.getWorkspaceWithRole(req.params.id, req.userId!);
      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workspace' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const updates = updateWorkspaceSchema.parse(req.body);
      const workspace = await WorkspaceModel.update(req.params.id, updates);
      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      res.json(workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  }

  static async switchWorkspace(req: AuthRequest, res: Response): Promise<void> {
    try {
      await AuthService.switchWorkspace(req.userId!, req.params.id);
      const workspace = await AuthService.getWorkspaceWithRole(req.params.id, req.userId!);
      res.json(workspace);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to switch workspace' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const workspace = await WorkspaceModel.findById(req.params.id);
      if (!workspace) {
        res.status(404).json({ error: 'Workspace not found' });
        return;
      }
      if (workspace.ownerId !== req.userId) {
        res.status(403).json({ error: 'Only the owner can delete the workspace' });
        return;
      }
      await WorkspaceModel.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete workspace' });
    }
  }

  // Team management
  static async getMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const members = await WorkspaceMemberModel.findByWorkspace(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  }

  static async inviteMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, role } = inviteSchema.parse(req.body);
      const invite = await AuthService.inviteMember(req.params.id, req.userId!, email, role);
      res.status(201).json(invite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to invite member' });
    }
  }

  static async getInvites(req: AuthRequest, res: Response): Promise<void> {
    try {
      const invites = await InviteModel.findByWorkspace(req.params.id);
      res.json(invites);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invites' });
    }
  }

  static async acceptInvite(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.acceptInvite(req.params.token, req.userId!);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to accept invite' });
    }
  }

  static async changeMemberRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role } = changeRoleSchema.parse(req.body);
      const result = await AuthService.changeMemberRole(req.params.id, req.userId!, req.params.memberId, role);
      if (!result) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to change role' });
    }
  }

  static async removeMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.removeMember(req.params.id, req.userId!, req.params.memberId);
      if (!result) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to remove member' });
    }
  }

  static async revokeInvite(req: AuthRequest, res: Response): Promise<void> {
    try {
      await InviteModel.revoke(req.params.inviteId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to revoke invite' });
    }
  }
}
