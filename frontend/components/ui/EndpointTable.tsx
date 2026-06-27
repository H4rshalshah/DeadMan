'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, CheckCircle, XCircle, Loader2, Plus, Trash2, RefreshCw,
  Eye, EyeOff, AlertTriangle, Clock, Activity, Terminal
} from 'lucide-react';

export interface EndpointData {
  id: string;
  name: string;
  path: string;
  method: string;
  fullUrl: string;
  description: string | null;
  authRequired: boolean;
  expectedStatusCode: number;
  checkInterval: number;
  timeoutMs: number;
  retryCount: number;
  failureThreshold: number;
  status: string;
  monitored: boolean;
  detectionMethod: string;
  lastCheckedAt: string | null;
  lastResponseTimeMs: number | null;
  lastStatusCode: number | null;
}

const methodColors: Record<string, string> = {
  GET: 'text-pulseops-success bg-pulseops-success/10',
  POST: 'text-pulseops-cyan bg-pulseops-cyan/10',
  PUT: 'text-pulseops-warning bg-pulseops-warning/10',
  PATCH: 'text-pulseops-warning bg-pulseops-warning/10',
  DELETE: 'text-pulseops-danger bg-pulseops-danger/10',
  HEAD: 'text-pulseops-muted bg-pulseops-border/50',
  OPTIONS: 'text-pulseops-muted bg-pulseops-border/50',
};

const statusColors: Record<string, string> = {
  healthy: 'text-pulseops-success',
  degraded: 'text-pulseops-warning',
  down: 'text-pulseops-danger',
  unknown: 'text-pulseops-muted',
};

interface EndpointTableProps {
  endpoints: EndpointData[];
  loading: boolean;
  onDelete: (id: string) => void;
  onToggleMonitoring: (id: string, monitored: boolean) => void;
  onCheck: (id: string) => void;
  onAdd: () => void;
  projectBaseUrl?: string;
}

export default function EndpointTable({
  endpoints,
  loading,
  onDelete,
  onToggleMonitoring,
  onCheck,
  onAdd,
  projectBaseUrl,
}: EndpointTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="text-pulseops-cyan animate-spin" />
      </div>
    );
  }

  if (endpoints.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-pulseops-border rounded-xl">
        <Globe size={36} className="mx-auto mb-3 text-pulseops-muted" />
        <h3 className="text-base font-medium text-pulseops-text mb-1">No endpoints detected</h3>
        <p className="text-sm text-pulseops-muted mb-4">
          {projectBaseUrl
            ? 'Click "Auto-Detect" to scan for API endpoints'
            : 'Add a base URL to your project to enable endpoint detection'}
        </p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pulseops-cyan/10 text-pulseops-cyan border border-pulseops-cyan/20 rounded-xl hover:bg-pulseops-cyan/20 transition-all text-sm"
        >
          <Plus size={14} />
          Add Endpoint Manually
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pulseops-border">
            <th className="text-left py-3 px-3 text-xs font-medium text-pulseops-muted uppercase tracking-wider">Method</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-pulseops-muted uppercase tracking-wider">Endpoint</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-pulseops-muted uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-pulseops-muted uppercase tracking-wider">Last Check</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-pulseops-muted uppercase tracking-wider">Monitor</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-pulseops-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pulseops-border">
          <AnimatePresence>
            {endpoints.map((ep, i) => (
              <motion.tr
                key={ep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-pulseops-cyan/5 transition-colors group"
              >
                <td className="py-3 px-3">
                  <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${methodColors[ep.method] || methodColors.GET}`}>
                    {ep.method}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div>
                    <p className="text-sm text-pulseops-text font-medium group-hover:text-pulseops-cyan transition-colors">
                      {ep.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <code className="text-[10px] font-mono text-pulseops-muted truncate max-w-[300px]">{ep.path}</code>
                      {ep.authRequired && (
                        <span className="text-[8px] text-pulseops-warning px-1 py-0.5 rounded bg-pulseops-warning/10">Auth</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ep.status === 'healthy' ? 'bg-pulseops-success' : ep.status === 'degraded' ? 'bg-pulseops-warning' : ep.status === 'down' ? 'bg-pulseops-danger' : 'bg-pulseops-muted'}`} />
                    <span className={`text-xs font-mono font-medium ${statusColors[ep.status] || statusColors.unknown}`}>
                      {ep.status}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 text-xs text-pulseops-muted">
                    {ep.lastResponseTimeMs != null && (
                      <>
                        <Clock size={11} />
                        <span className="font-mono">{ep.lastResponseTimeMs}ms</span>
                      </>
                    )}
                    {ep.lastStatusCode && (
                      <span className="font-mono">{ep.lastStatusCode}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <button
                    onClick={() => onToggleMonitoring(ep.id, !ep.monitored)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      ep.monitored
                        ? 'text-pulseops-success bg-pulseops-success/10 hover:bg-pulseops-success/20'
                        : 'text-pulseops-muted bg-pulseops-border/30 hover:bg-pulseops-border/50'
                    }`}
                  >
                    {ep.monitored ? <Eye size={12} /> : <EyeOff size={12} />}
                    {ep.monitored ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onCheck(ep.id)}
                      className="p-1.5 text-pulseops-muted hover:text-pulseops-cyan rounded-lg hover:bg-pulseops-cyan/10 transition-colors"
                      title="Check now"
                    >
                      <RefreshCw size={13} />
                    </button>
                    {confirmDelete === ep.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { onDelete(ep.id); setConfirmDelete(null); }}
                          className="p-1.5 text-pulseops-danger hover:bg-pulseops-danger/10 rounded-lg transition-colors"
                        >
                          <CheckCircle size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="p-1.5 text-pulseops-muted hover:bg-pulseops-border rounded-lg transition-colors"
                        >
                          <XCircle size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(ep.id)}
                        className="p-1.5 text-pulseops-muted hover:text-pulseops-danger rounded-lg hover:bg-pulseops-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete endpoint"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
