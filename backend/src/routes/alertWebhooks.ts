import { Router, Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { IncidentService } from '../services/IncidentService';
import { RunbookModel } from '../models/Runbook';
import { RunbookExecutor } from '../services/RunbookExecutor';
import { AuditLogModel } from '../models/AuditLog';
import { isUsingMemoryStore } from '../db/connection';
import { memoryStore } from '../db/memoryStore';
import { WebhookLogDocument } from '../models/Operational';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests' },
});

const router = Router();

function detectSource(payload: Record<string, unknown>): string {
  if (payload?.alerts && Array.isArray(payload.alerts)) return 'prometheus';
  if (payload?.alertId || payload?.alert_id) return 'datadog';
  if (payload?.panelId || payload?.panel_id) return 'grafana';
  if (payload?.source && typeof payload.source === 'string') return payload.source;
  return 'unknown';
}

function normalizeAlert(payload: Record<string, unknown>, source: string, projectName?: string): {
  title: string;
  description: string;
  severity: string;
  source: string;
  service_name: string;
  metadata: Record<string, unknown>;
} {
  switch (source) {
    case 'prometheus': {
      const alerts = (payload.alerts as Array<Record<string, unknown>>) || [];
      const first = alerts[0] || {};
      const labels = (first.labels as Record<string, string>) || {};
      return {
        title: (first.annotations as Record<string, string>)?.summary || `Alert: ${labels.alertname || 'Unknown'}`,
        description: (first.annotations as Record<string, string>)?.description || '',
        severity: labels.severity || 'medium',
        source: 'prometheus',
        service_name: labels.service || labels.job || projectName || 'unknown',
        metadata: payload as Record<string, unknown>,
      };
    }
    case 'datadog': {
      return {
        title: (payload.title as string) || 'Datadog Alert',
        description: (payload.text as string) || '',
        severity: (payload.severity as string) || 'medium',
        source: 'datadog',
        service_name: (payload.service as string) || projectName || 'unknown',
        metadata: payload as Record<string, unknown>,
      };
    }
    case 'grafana':
    default: {
      return {
        title: (payload.title as string) || (payload.message as string) || 'Grafana Alert',
        description: (payload.message as string) || '',
        severity: (payload.severity as string) || (payload.state as string) === 'alerting' ? 'critical' : 'medium',
        source: 'grafana',
        service_name: (payload.service_name as string) || projectName || 'unknown',
        metadata: payload as Record<string, unknown>,
      };
    }
  }
}

// Per-project webhook alert endpoint
router.post('/:token', webhookLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const payload = req.body;

    // Validate webhook token and find project
    const project = await ProjectModel.findByWebhookToken(token);
    if (!project) {
      res.status(401).json({ error: 'Invalid webhook token' });
      return;
    }

    const source = detectSource(payload);
    const normalized = normalizeAlert(payload, source, project.name);

    // Create incident linked to project
    const incident = await IncidentService.createFromAlert({
      ...normalized,
      service_name: project.name,
      metadata: {
        ...normalized.metadata,
        projectId: project.id,
        workspaceId: project.workspaceId,
      },
    });

    // Match and execute runbook
    const runbook = await RunbookModel.findMatching({
      ...normalized,
      service: project.name,
    });

    if (runbook && incident) {
      RunbookExecutor.execute(runbook.id, incident.id, runbook.dry_run_mode).catch(err => {
        console.error('Runbook execution failed:', err);
      });
    }

    // Log webhook
    if (isUsingMemoryStore()) {
      memoryStore.webhookLogs.unshift({
        id: uuidv4(),
        source,
        payload,
        incident_id: incident.id,
        received_at: new Date(),
      });
    } else {
      await WebhookLogDocument.create({ source, payload, incident_id: incident.id });
    }

    res.json({
      received: true,
      incidentId: incident.id,
      projectId: project.id,
      runbookMatched: !!runbook,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
