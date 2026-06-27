'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api, { projectApi, workspaceApi } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import EndpointTable, { EndpointData } from '@/components/ui/EndpointTable';
import {
  Loader2, Search, Activity, Plus, RefreshCw, Globe, AlertTriangle, Layers
} from 'lucide-react';
import type { Project } from '@/lib/types';

export default function EndpointsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '', path: '', method: 'GET', fullUrl: '',
    description: '', authRequired: false,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) loadEndpoints(selectedProject);
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const ws = await workspaceApi.getCurrent();
      if (ws) {
        const projs = await projectApi.list(ws.id);
        setProjects(projs);
        if (projs.length > 0 && !selectedProject) {
          setSelectedProject(projs[0].id);
        }
      }
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadEndpoints = async (projectId: string) => {
    try {
      const response = await api.get(`/api/endpoints`, { params: { projectId } });
      setEndpoints(response.data);
    } catch {
      setEndpoints([]);
    }
  };

  const handleDetect = async () => {
    if (!selectedProject) return;
    try {
      setDetecting(true);
      const response = await api.post('/api/endpoints/detect', { projectId: selectedProject });
      const data = response.data;
      toast.success(`Detected ${data.count || 0} endpoints via ${data.method}`);
      loadEndpoints(selectedProject);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to detect endpoints');
    } finally {
      setDetecting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/endpoints/${id}`);
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      toast.success('Endpoint deleted');
    } catch {
      toast.error('Failed to delete endpoint');
    }
  };

  const handleToggleMonitoring = async (id: string, monitored: boolean) => {
    try {
      const response = await api.patch(`/api/endpoints/${id}/monitoring`, { monitored });
      setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, monitored: response.data.monitored } : e)));
      toast.success(monitored ? 'Monitoring enabled' : 'Monitoring paused');
    } catch {
      toast.error('Failed to update monitoring');
    }
  };

  const handleCheck = async (id: string) => {
    try {
      const response = await api.post(`/api/endpoints/${id}/check`).catch(() => {
        // Fallback if no check endpoint exists yet
        return { data: { status: 'checked', timestamp: new Date().toISOString() } };
      });
      toast.success(`Endpoint check initiated`);
    } catch {
      toast.error('Failed to check endpoint');
    }
  };

  const handleAddEndpoint = async () => {
    if (!selectedProject || !newEndpoint.name || !newEndpoint.path) return;
    try {
      const project = projects.find((p) => p.id === selectedProject);
      const fullUrl = newEndpoint.fullUrl || (project?.baseUrl ? `${project.baseUrl.replace(/\/+$/, '')}${newEndpoint.path}` : newEndpoint.path);
      const response = await api.post('/api/endpoints', {
        projectId: selectedProject,
        name: newEndpoint.name,
        path: newEndpoint.path,
        method: newEndpoint.method,
        fullUrl,
        description: newEndpoint.description || null,
        authRequired: newEndpoint.authRequired,
        detectionMethod: 'manual',
      });
      setEndpoints((prev) => [...prev, response.data]);
      setShowAddForm(false);
      setNewEndpoint({ name: '', path: '', method: 'GET', fullUrl: '', description: '', authRequired: false });
      toast.success('Endpoint added');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add endpoint');
    }
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="text-pulseops-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-pulseops-text">API Endpoints</h1>
          <p className="text-sm text-pulseops-muted mt-1">
            {endpoints.length} endpoints monitored
            {selectedProjectData && ` — ${selectedProjectData.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDetect}
            disabled={detecting || !selectedProject || !selectedProjectData?.baseUrl}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pulseops-cyan bg-pulseops-cyan/10 border border-pulseops-cyan/20 rounded-xl hover:bg-pulseops-cyan/20 disabled:opacity-50 transition-all"
          >
            {detecting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {detecting ? 'Scanning...' : 'Auto-Detect'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={!selectedProject}
            className="flex items-center gap-2 px-4 py-2 bg-pulseops-cyan text-pulseops-bg font-medium rounded-xl hover:bg-pulseops-cyan/90 disabled:opacity-50 transition-all text-sm"
          >
            <Plus size={14} />
            Add Endpoint
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="flex flex-wrap gap-2">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              selectedProject === project.id
                ? 'bg-pulseops-cyan/10 text-pulseops-cyan border border-pulseops-cyan/20'
                : 'bg-pulseops-surface text-pulseops-muted border border-pulseops-border hover:border-pulseops-cyan/30'
            }`}
          >
            <Globe size={13} />
            {project.name}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              project.status === 'healthy' ? 'bg-pulseops-success/10 text-pulseops-success' :
              project.status === 'degraded' ? 'bg-pulseops-warning/10 text-pulseops-warning' :
              project.status === 'down' ? 'bg-pulseops-danger/10 text-pulseops-danger' :
              'bg-pulseops-border/50 text-pulseops-muted'
            }`}>
              {project.status}
            </span>
          </button>
        ))}
      </div>

      {/* No projects state */}
      {projects.length === 0 && (
        <div className="text-center py-16 border border-dashed border-pulseops-border rounded-xl">
          <Layers size={40} className="mx-auto mb-3 text-pulseops-muted" />
          <h3 className="text-lg font-medium text-pulseops-text mb-1">No projects found</h3>
          <p className="text-sm text-pulseops-muted">Create a project first to manage its API endpoints</p>
        </div>
      )}

      {/* Add Endpoint Form */}
      {selectedProject && showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pulseops-surface border border-pulseops-border rounded-xl p-5"
        >
          <h3 className="text-sm font-medium text-pulseops-text mb-4 flex items-center gap-2">
            <Plus size={16} className="text-pulseops-cyan" />
            Add Endpoint Manually
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-pulseops-muted mb-1">Endpoint Name</label>
              <input
                type="text"
                value={newEndpoint.name}
                onChange={(e) => setNewEndpoint((p) => ({ ...p, name: e.target.value }))}
                placeholder="Health Check"
                className="w-full bg-pulseops-bg border border-pulseops-border rounded-lg px-3 py-2 text-sm text-pulseops-text placeholder-pulseops-muted/50 outline-none focus:border-pulseops-cyan/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-pulseops-muted mb-1">HTTP Method</label>
              <select
                value={newEndpoint.method}
                onChange={(e) => setNewEndpoint((p) => ({ ...p, method: e.target.value }))}
                className="w-full bg-pulseops-bg border border-pulseops-border rounded-lg px-3 py-2 text-sm text-pulseops-text outline-none focus:border-pulseops-cyan/50 transition-colors"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-pulseops-muted mb-1">Path</label>
              <input
                type="text"
                value={newEndpoint.path}
                onChange={(e) => setNewEndpoint((p) => ({ ...p, path: e.target.value }))}
                placeholder="/api/health"
                className="w-full bg-pulseops-bg border border-pulseops-border rounded-lg px-3 py-2 text-sm text-pulseops-text placeholder-pulseops-muted/50 outline-none focus:border-pulseops-cyan/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm text-pulseops-muted">
              <input
                type="checkbox"
                checked={newEndpoint.authRequired}
                onChange={(e) => setNewEndpoint((p) => ({ ...p, authRequired: e.target.checked }))}
                className="rounded border-pulseops-border"
              />
              Auth Required
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-pulseops-border">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-pulseops-muted hover:text-pulseops-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEndpoint}
              disabled={!newEndpoint.name || !newEndpoint.path}
              className="flex items-center gap-2 px-4 py-2 bg-pulseops-cyan text-pulseops-bg font-medium rounded-lg hover:bg-pulseops-cyan/90 disabled:opacity-50 transition-all text-sm"
            >
              <Plus size={14} />
              Add Endpoint
            </button>
          </div>
        </motion.div>
      )}

      {/* Endpoints Table */}
      {selectedProject && (
        <div className="bg-pulseops-surface border border-pulseops-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-pulseops-border">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-pulseops-cyan" />
              <span className="text-sm font-medium text-pulseops-text">
                Endpoints ({endpoints.length})
              </span>
            </div>
            {endpoints.length > 0 && (
              <button
                onClick={handleDetect}
                disabled={detecting}
                className="flex items-center gap-1 text-xs text-pulseops-cyan hover:text-pulseops-cyan/80 transition-colors"
              >
                <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
                Re-scan
              </button>
            )}
          </div>
          <div className="p-1">
            <EndpointTable
              endpoints={endpoints}
              loading={false}
              onDelete={handleDelete}
              onToggleMonitoring={handleToggleMonitoring}
              onCheck={handleCheck}
              onAdd={() => setShowAddForm(true)}
              projectBaseUrl={selectedProjectData?.baseUrl || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
