import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { WorkspaceMemberModel, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  workspaceRole?: UserRole;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = AuthService.verifyToken(token);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireWorkspaceRole(...roles: UserRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId || req.query.workspaceId as string;
    if (!workspaceId || !req.userId) {
      res.status(400).json({ error: 'Workspace ID required' });
      return;
    }

    try {
      const role = await WorkspaceMemberModel.getRole(req.userId, workspaceId);
      if (!role || !roles.includes(role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      req.workspaceRole = role;
      next();
    } catch {
      res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
}
