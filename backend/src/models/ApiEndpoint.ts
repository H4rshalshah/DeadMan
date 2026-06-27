import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isUsingMemoryStore } from '../db/connection';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type EndpointStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type DetectionMethod = 'auto_scan' | 'openapi' | 'github' | 'manual';

export interface ApiEndpoint {
  id: string;
  projectId: string;
  name: string;
  path: string;
  method: HttpMethod;
  fullUrl: string;
  description: string | null;
  authRequired: boolean;
  expectedStatusCode: number;
  requestBody: string | null;
  headers: Record<string, string>;
  checkInterval: number; // seconds
  timeoutMs: number;
  retryCount: number;
  failureThreshold: number;
  status: EndpointStatus;
  monitored: boolean;
  detectionMethod: DetectionMethod;
  lastCheckedAt: Date | null;
  lastResponseTimeMs: number | null;
  lastStatusCode: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const ApiEndpointSchema = new Schema({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  path: { type: String, required: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'], default: 'GET' },
  fullUrl: { type: String, required: true },
  description: { type: String, default: null },
  authRequired: { type: Boolean, default: false },
  expectedStatusCode: { type: Number, default: 200 },
  requestBody: { type: String, default: null },
  headers: { type: Schema.Types.Mixed, default: {} },
  checkInterval: { type: Number, default: 300 },
  timeoutMs: { type: Number, default: 5000 },
  retryCount: { type: Number, default: 2 },
  failureThreshold: { type: Number, default: 3 },
  status: { type: String, enum: ['healthy', 'degraded', 'down', 'unknown'], default: 'unknown' },
  monitored: { type: Boolean, default: true },
  detectionMethod: { type: String, enum: ['auto_scan', 'openapi', 'github', 'manual'], default: 'manual' },
  lastCheckedAt: { type: Date, default: null },
  lastResponseTimeMs: { type: Number, default: null },
  lastStatusCode: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ApiEndpointSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ApiEndpointDocument = mongoose.models.ApiEndpoint || mongoose.model<ApiEndpoint>('ApiEndpoint', ApiEndpointSchema);

// In-memory store
export const apiEndpointMemoryStore: ApiEndpoint[] = [];

function normalize<T>(doc: unknown): T {
  const value = typeof (doc as { toJSON?: () => unknown })?.toJSON === 'function'
    ? (doc as { toJSON: () => T }).toJSON()
    : doc;
  return value as T;
}

export class ApiEndpointModel {
  static async findByProject(projectId: string): Promise<ApiEndpoint[]> {
    if (isUsingMemoryStore()) {
      return apiEndpointMemoryStore
        .filter((e) => e.projectId === projectId)
        .sort((a, b) => a.path.localeCompare(b.path));
    }
    const docs = await ApiEndpointDocument.find({ projectId }).sort({ path: 1 });
    return docs.map((d) => normalize<ApiEndpoint>(d));
  }

  static async findById(id: string): Promise<ApiEndpoint | null> {
    if (isUsingMemoryStore()) return apiEndpointMemoryStore.find((e) => e.id === id) || null;
    const doc = await ApiEndpointDocument.findOne({ id });
    return doc ? normalize<ApiEndpoint>(doc) : null;
  }

  static async create(data: Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'lastCheckedAt' | 'lastResponseTimeMs' | 'lastStatusCode'>): Promise<ApiEndpoint> {
    const endpoint: ApiEndpoint = {
      ...data,
      id: uuidv4(),
      status: 'unknown',
      lastCheckedAt: null,
      lastResponseTimeMs: null,
      lastStatusCode: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isUsingMemoryStore()) {
      apiEndpointMemoryStore.push(endpoint);
      return endpoint;
    }
    return normalize<ApiEndpoint>(await ApiEndpointDocument.create(endpoint));
  }

  static async createMany(endpoints: Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'lastCheckedAt' | 'lastResponseTimeMs' | 'lastStatusCode'>[]): Promise<ApiEndpoint[]> {
    const results: ApiEndpoint[] = [];
    for (const ep of endpoints) {
      results.push(await this.create(ep));
    }
    return results;
  }

  static async update(id: string, updates: Partial<ApiEndpoint>): Promise<ApiEndpoint | null> {
    const payload = { ...updates, updatedAt: new Date() };
    if (isUsingMemoryStore()) {
      const idx = apiEndpointMemoryStore.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      apiEndpointMemoryStore[idx] = { ...apiEndpointMemoryStore[idx], ...payload };
      return apiEndpointMemoryStore[idx];
    }
    const doc = await ApiEndpointDocument.findOneAndUpdate({ id }, payload, { new: true });
    return doc ? normalize<ApiEndpoint>(doc) : null;
  }

  static async delete(id: string): Promise<boolean> {
    if (isUsingMemoryStore()) {
      const idx = apiEndpointMemoryStore.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      apiEndpointMemoryStore.splice(idx, 1);
      return true;
    }
    const result = await ApiEndpointDocument.deleteOne({ id });
    return result.deletedCount > 0;
  }

  static async deleteByProject(projectId: string): Promise<boolean> {
    if (isUsingMemoryStore()) {
      const before = apiEndpointMemoryStore.length;
      const filtered = apiEndpointMemoryStore.filter((e) => e.projectId !== projectId);
      const deleted = before - filtered.length;
      apiEndpointMemoryStore.splice(0, apiEndpointMemoryStore.length, ...filtered);
      return deleted > 0;
    }
    const result = await ApiEndpointDocument.deleteMany({ projectId });
    return result.deletedCount > 0;
  }
}
