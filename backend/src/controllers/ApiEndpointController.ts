import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiEndpointModel, ApiEndpoint } from '../models/ApiEndpoint';
import { ProjectModel } from '../models/Project';
import { WorkspaceMemberModel, UserRole } from '../models/User';
import { ApiDetectionService } from '../services/ApiDetectionService';
import { z } from 'zod';

const createEndpointSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(255),
  path: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  fullUrl: z.string().url(),
  description: z.string().optional().nullable(),
  authRequired: z.boolean().optional(),
  expectedStatusCode: z.number().optional(),
  requestBody: z.string().optional().nullable(),
  headers: z.record(z.string()).optional(),
  checkInterval: z.number().min(30).max(3600).optional(),
  timeoutMs: z.number().min(1000).max(60000).optional(),
  retryCount: z.number().min(0).max(10).optional(),
  failureThreshold: z.number().min(1).max(100).optional(),
  monitored: z.boolean().optional(),
  detectionMethod: z.enum(['auto_scan', 'openapi', 'github', 'manual']).optional(),
});

const updateEndpointSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  path: z.string().min(1).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional(),
  fullUrl: z.string().url().optional(),
  description: z.string().optional().nullable(),
  authRequired: z.boolean().optional(),
  expectedStatusCode: z.number().optional(),
  requestBody: z.string().optional().nullable(),
  headers: z.record(z.string()).optional(),
  checkInterval: z.number().min(30).max(3600).optional(),
  timeoutMs: z.number().min(1000).max(60000).optional(),
  retryCount: z.number().min(0).max(10).optional(),
  failureThreshold: z.number().min(1).max(100).optional(),
  monitored: z.boolean().optional(),
});

export class ApiEndpointController {
  private static async requireProjectAccess(
    req: AuthRequest,
    res: Response,
    projectId: string,
    roles: UserRole[] = ['owner', 'admin', 'engineer', 'viewer']
  ): Promise<boolean> {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return false;
    }
    const role = await WorkspaceMemberModel.getRole(req.userId!, project.workspaceId);
    if (!role || !roles.includes(role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return false;
    }
    return true;
  }

  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        res.status(400).json({ error: 'projectId is required' });
        return;
      }
      if (!await ApiEndpointController.requireProjectAccess(req, res, projectId as string)) return;

      const endpoints = await ApiEndpointModel.findByProject(projectId as string);
      res.json(endpoints);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch endpoints' });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const endpoint = await ApiEndpointModel.findById(req.params.id);
      if (!endpoint) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      if (!await ApiEndpointController.requireProjectAccess(req, res, endpoint.projectId)) return;
      res.json(endpoint);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch endpoint' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = createEndpointSchema.parse(req.body);
      if (!await ApiEndpointController.requireProjectAccess(req, res, parsed.projectId, ['owner', 'admin', 'engineer'])) return;

      const endpoint = await ApiEndpointModel.create({
        ...parsed,
        authRequired: parsed.authRequired ?? false,
        description: parsed.description ?? null,
        requestBody: parsed.requestBody ?? null,
        expectedStatusCode: parsed.expectedStatusCode ?? 200,
        checkInterval: parsed.checkInterval ?? 300,
        timeoutMs: parsed.timeoutMs ?? 5000,
        retryCount: parsed.retryCount ?? 2,
        failureThreshold: parsed.failureThreshold ?? 3,
        monitored: parsed.monitored ?? true,
        detectionMethod: parsed.detectionMethod ?? 'manual',
        headers: parsed.headers ?? {},
      });
      res.status(201).json(endpoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to create endpoint' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const updates = updateEndpointSchema.parse(req.body);
      const existing = await ApiEndpointModel.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      if (!await ApiEndpointController.requireProjectAccess(req, res, existing.projectId, ['owner', 'admin', 'engineer'])) return;

      const endpoint = await ApiEndpointModel.update(req.params.id, updates);
      if (!endpoint) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      res.json(endpoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to update endpoint' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const existing = await ApiEndpointModel.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      if (!await ApiEndpointController.requireProjectAccess(req, res, existing.projectId, ['owner', 'admin'])) return;

      const deleted = await ApiEndpointModel.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete endpoint' });
    }
  }

  static async detect(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        res.status(400).json({ error: 'projectId is required' });
        return;
      }
      if (!await ApiEndpointController.requireProjectAccess(req, res, projectId, ['owner', 'admin', 'engineer'])) return;

      const project = await ProjectModel.findById(projectId);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      if (!project.baseUrl) {
        res.status(400).json({ error: 'Project has no base URL configured' });
        return;
      }

      // Remove existing endpoints before re-detecting (prevents duplicates)
      await ApiEndpointModel.deleteByProject(projectId);

      const { endpoints, method } = await ApiDetectionService.detectAll(project.baseUrl);

      if (endpoints.length === 0) {
        res.json({ endpoints: [], method, message: 'No endpoints detected' });
        return;
      }

      // Save detected endpoints to database
      const saved = await ApiEndpointModel.createMany(
        endpoints.map((ep) => ({
          projectId,
          name: ep.name,
          path: ep.path,
          method: ep.method,
          fullUrl: ep.fullUrl,
          description: ep.description || null,
          requestBody: null,
          authRequired: ep.authRequired,
          expectedStatusCode: ep.expectedStatusCode,
          headers: {},
          checkInterval: 300,
          timeoutMs: 5000,
          retryCount: 2,
          failureThreshold: 3,
          monitored: true,
          detectionMethod: method as ApiEndpoint['detectionMethod'],
        }))
      );

      res.json({ endpoints: saved, method, count: saved.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to detect endpoints' });
    }
  }

  static async toggleMonitoring(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { monitored } = z.object({ monitored: z.boolean() }).parse(req.body);
      const existing = await ApiEndpointModel.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Endpoint not found' });
        return;
      }
      if (!await ApiEndpointController.requireProjectAccess(req, res, existing.projectId, ['owner', 'admin', 'engineer'])) return;

      const endpoint = await ApiEndpointModel.update(req.params.id, { monitored });
      res.json(endpoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Failed to update monitoring status' });
    }
  }
}
