import cron from 'node-cron';
import axios from 'axios';
import winston from 'winston';
import { ProjectModel, HealthCheckModel, projectMemoryStore } from '../models/Project';
import { isUsingMemoryStore } from '../db/connection';
import { getIO } from '../websocket/incidentSocket';
import { IncidentService } from './IncidentService';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Track consecutive failures per project
const consecutiveFailures = new Map<string, number>();
const FAILURE_THRESHOLD = 3;

export class HealthCheckScheduler {
  private static task: cron.ScheduledTask | null = null;
  private static running = false;

  static start(): void {
    if (this.task) return;
    
    // Run every minute
    this.task = cron.schedule('* * * * *', async () => {
      if (this.running) return;
      this.running = true;

      try {
        await this.runChecks();
      } catch (error) {
        logger.error('Health check scheduler error:', error);
      } finally {
        this.running = false;
      }
    });

    logger.info('[HealthCheck] Scheduler started (every 60s)');
  }

  static stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('[HealthCheck] Scheduler stopped');
    }
  }

  private static async runChecks(): Promise<void> {
    const projects = isUsingMemoryStore()
      ? projectMemoryStore.filter((p) => p.healthCheckUrl)
      : await (await import('../models/Project')).ProjectDocument.find({
          healthCheckUrl: { $nin: [null, ''] },
        });

    const io = getIO();

    for (const project of projects) {
      const healthCheckUrl = project.healthCheckUrl;
      if (!healthCheckUrl) continue;

      try {
        const start = Date.now();
        const response = await axios.get(healthCheckUrl, {
          timeout: 10000,
          validateStatus: () => true,
        });
        const latencyMs = Date.now() - start;
        const isHealthy = response.status >= 200 && response.status < 500;

        await HealthCheckModel.create({
          projectId: project.id,
          statusCode: response.status,
          latencyMs,
          isHealthy,
        });

        if (isHealthy) {
          consecutiveFailures.set(project.id, 0);
          await ProjectModel.update(project.id, { status: 'healthy' });
        } else {
          const failures = (consecutiveFailures.get(project.id) || 0) + 1;
          consecutiveFailures.set(project.id, failures);

          if (failures >= FAILURE_THRESHOLD) {
            logger.warn(`[HealthCheck] Project ${project.name} - ${failures} consecutive failures. Creating incident.`);
            await ProjectModel.update(project.id, { status: 'down' });

            // Create incident for persistent health check failure
            try {
              await IncidentService.createFromAlert({
                title: `Health check failed for ${project.name}`,
                description: `Project ${project.name} health check at ${healthCheckUrl} has failed ${failures} times consecutively. Last status: ${response.status}`,
                severity: 'high',
                source: 'health-check',
                service_name: project.name,
                metadata: {
                  projectId: project.id,
                  statusCode: response.status,
                  latencyMs,
                  consecutiveFailures: failures,
                },
              });
            } catch (incidentError) {
              logger.error('[HealthCheck] Failed to create incident:', incidentError);
            }
          } else {
            await ProjectModel.update(project.id, { status: 'degraded' });
          }
        }

        // Emit monitor status update via WebSocket
        if (io) {
          io.emit('monitor:status', {
            id: project.id,
            name: project.name,
            status: isHealthy ? 'healthy' : 'unhealthy',
            latencyMs,
            checkedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        const failures = (consecutiveFailures.get(project.id) || 0) + 1;
        consecutiveFailures.set(project.id, failures);

        await HealthCheckModel.create({
          projectId: project.id,
          statusCode: null,
          latencyMs: null,
          isHealthy: false,
          errorMessage: error instanceof Error ? error.message : 'Connection failed',
        });

        if (failures >= FAILURE_THRESHOLD) {
          await ProjectModel.update(project.id, { status: 'down' });
          try {
            await IncidentService.createFromAlert({
              title: `Health check failed for ${project.name}`,
              description: `Project ${project.name} health check at ${healthCheckUrl} is unreachable after ${failures} attempts.`,
              severity: 'high',
              source: 'health-check',
              service_name: project.name,
              metadata: {
                projectId: project.id,
                error: error instanceof Error ? error.message : 'Connection failed',
                consecutiveFailures: failures,
              },
            });
          } catch (incidentError) {
            logger.error('[HealthCheck] Failed to create incident:', incidentError);
          }
        } else {
          await ProjectModel.update(project.id, { status: 'degraded' });
        }

        if (io) {
          io.emit('monitor:status', {
            id: project.id,
            name: project.name,
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Connection failed',
            checkedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
}
