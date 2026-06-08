import { Job, Worker, Queue } from 'bullmq';
import { RunbookExecutor } from '../services/RunbookExecutor';
import { config } from '../config';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export let actionQueue: Queue | null = null;

let redisUnavailableWarned = false;

export function getActionQueue(): Queue | null {
  if (actionQueue) {
    return actionQueue;
  }

  try {
    const connection = {
      url: config.redisUrl,
      maxRetriesPerRequest: null,
      retryStrategy: () => null as number | null,
      enableOfflineQueue: false,
    };

    actionQueue = new Queue('runbook-executions', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
      },
    });

    // Suppress Redis connection errors for queue as well
    actionQueue.on('error', () => {});

    logger.info('[Worker] BullMQ action queue initialized');
    return actionQueue;
  } catch (error) {
    logger.warn('Redis unavailable; action queue disabled', {
      error: error instanceof Error ? error.message : error,
    });
    actionQueue = null;
    return null;
  }
}

export function initWorker(): Worker | null {
  try {
    const connection = {
      url: config.redisUrl,
      maxRetriesPerRequest: null,
      retryStrategy: () => null as number | null,
      enableOfflineQueue: false,
    };

    const worker = new Worker(
      'runbook-executions',
      async (job: Job) => {
        const { runbookId, incidentId, dryRun } = job.data as {
          runbookId: string;
          incidentId: string;
          dryRun: boolean;
        };

        logger.info(`Executing runbook ${runbookId} for incident ${incidentId}`, { dryRun });

        try {
          const result = await RunbookExecutor.execute(runbookId, incidentId, dryRun);
          logger.info(`Runbook execution completed`, {
            runbookId,
            incidentId,
            stepsCompleted: result.steps.filter(s => s.status === 'success').length,
            totalDurationMs: result.totalDurationMs,
          });
          return result;
        } catch (error) {
          logger.error(`Runbook execution failed`, {
            runbookId,
            incidentId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      },
      {
        connection,
        concurrency: 5,
        lockDuration: 30000,
      }
    );

    // Suppress Redis connection errors — worker is non-critical, falls back to memory store
    worker.on('error', (error) => {
      const isConnRefused = (error as { code?: string })?.code === 'ECONNREFUSED' ||
        (error as Error).message?.includes('ECONNREFUSED');
      if (isConnRefused && !redisUnavailableWarned) {
        logger.warn('Redis unavailable — background worker disabled. Runbook execution will use fallback.');
        redisUnavailableWarned = true;
      } else if (!isConnRefused) {
        logger.error('[Worker] Unexpected error', { error: error instanceof Error ? error.message : error });
      }
    });

    worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed`, { error: error.message });
    });

    logger.info('[Worker] BullMQ action worker initialized');
    return worker;
  } catch (error) {
    logger.warn('Failed to initialize BullMQ worker; Redis may not be available', {
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}
