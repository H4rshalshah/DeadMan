'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import MetricCard from '@/components/dashboard/MetricCard';
import IncidentFeed from '@/components/incidents/IncidentFeed';
import IncidentTimeline from '@/components/dashboard/IncidentTimeline';
import { useDashboardSummary, useIncidents } from '@/hooks/useIncidents';
import { useWebSocket } from '@/hooks/useWebSocket';
import { analyticsApi, webhooksApi, incidentsApi, workspaceApi, authApi } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import type { Incident, MTTRDataPoint, Workspace, User } from '@/lib/types';
import {
  Webhook, Plus, RefreshCw, Loader2, Users, Server, Activity, Bell,
  ArrowRight, Layout, ChevronDown, UserPlus, Settings
} from 'lucide-react';

const MTTRChart = dynamic(() => import('@/components/dashboard/MTTRChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-pulseops-surface border border-pulseops-border rounded-xl animate-pulse flex items-center justify-center"><Loader2 size={20} className="text-pulseops-cyan animate-spin" /></div>,
});

export default function DashboardPage() {
  const router = useRouter();
  const { summary, loading: summaryLoading, refetch: refetchSummary } = useDashboardSummary();
  const { incidents, refetch: refetchIncidents } = useIncidents({ status: 'open', limit: '10' });
  const [mttrData, setMttrData] = useState<MTTRDataPoint[] | undefined>(undefined);
  const [latestIncidents, setLatestIncidents] = useState<Incident[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<(Workspace & { role?: string })[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showWorkspaceCreate, setShowWorkspaceCreate] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showWsDropdown, setShowWsDropdown] = useState(false);

  useEffect(() => {
    analyticsApi.getMTTR().then(setMttrData).catch(() => {});
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      const [userData, wsList, currentWs] = await Promise.all([
        authApi.me(),
        workspaceApi.list(),
        workspaceApi.getCurrent(),
      ]);
      setUser(userData);
      setWorkspaces(wsList);
      setCurrentWorkspace(currentWs);
    } catch {
      // Allow dashboard to render without user data
    } finally {
      setLoadingUser(false);
    }
  };

  // WebSocket for real-time updates
  useWebSocket({
    onIncidentNew: (incident) => {
      setLatestIncidents((prev) => [incident, ...prev].slice(0, 20));
      toast.warning(`New incident: ${incident.title}`, { duration: 6000 });
      refetchSummary();
      refetchIncidents();
    },
    onIncidentUpdated: () => {
      refetchSummary();
      refetchIncidents();
    },
  });

  const handleTestWebhook = async () => {
    try {
      await webhooksApi.ingest({
        title: 'Test Alert - High CPU detected',
        message: 'CPU usage exceeded 90% on api-server-01 in production',
        severity: 'critical',
        source: 'manual-test',
        service_name: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
      toast.success('Test webhook sent! Incident created.');
      refetchSummary();
      refetchIncidents();
    } catch {
      toast.error('Failed to send test webhook');
    }
  };

  const handleManualIncident = async () => {
    try {
      await incidentsApi.create({
        title: 'Manual Test Incident',
        description: 'Created from dashboard quick action',
        severity: 'high',
        source: 'manual',
        service_name: 'testing',
      });
      toast.success('Manual incident created');
      refetchSummary();
      refetchIncidents();
    } catch {
      toast.error('Failed to create incident');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      setCreatingWorkspace(true);
      const ws = await workspaceApi.create(newWorkspaceName.trim());
      setWorkspaces((prev) => [...prev, ws]);
      setCurrentWorkspace(ws);
      setShowWorkspaceCreate(false);
      setNewWorkspaceName('');
      toast.success(`Workspace "${ws.name}" created`);
      loadUserData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create workspace');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleSwitchWorkspace = async (ws: Workspace) => {
    try {
      await workspaceApi.switchWorkspace(ws.id);
      setCurrentWorkspace(ws);
      setShowWsDropdown(false);
      toast.success(`Switched to ${ws.name}`);
      loadUserData();
    } catch {
      toast.error('Failed to switch workspace');
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hasWorkspace = !!currentWorkspace;

  const quickActions = [
    { icon: Layout, label: 'Create Workspace', href: '#', onClick: () => setShowWorkspaceCreate(true), color: 'text-pulseops-cyan' },
    { icon: Server, label: 'Add Project', href: '/projects', color: 'text-pulseops-success' },
    { icon: Activity, label: 'Configure Monitoring', href: '/projects', color: 'text-pulseops-warning' },
    { icon: UserPlus, label: 'Invite Team Members', href: '/team', color: 'text-pulseops-danger' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-pulseops-text">
            {loadingUser ? 'Welcome back' : `Welcome back, ${firstName}`}
          </h1>
          <p className="text-sm text-pulseops-muted mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestWebhook}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pulseops-warning bg-pulseops-warning/10 border border-pulseops-warning/20 rounded-xl hover:bg-pulseops-warning/20 transition-all"
          >
            <Webhook size={14} />
            Test Webhook
          </button>
          <button
            onClick={handleManualIncident}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pulseops-bg bg-pulseops-cyan rounded-xl hover:bg-pulseops-cyan/90 transition-all"
          >
            <Plus size={14} />
            Trigger Incident
          </button>
        </div>
      </div>

      {/* Workspace Selector + Create */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowWsDropdown(!showWsDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-pulseops-surface border border-pulseops-border rounded-xl text-sm text-pulseops-text hover:border-pulseops-cyan/30 transition-all"
          >
            <Layout size={14} className="text-pulseops-cyan" />
            <span className="font-medium">
              {loadingUser ? 'Loading...' : currentWorkspace?.name || 'No workspace'}
            </span>
            <ChevronDown size={14} className={`text-pulseops-muted transition-transform ${showWsDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showWsDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowWsDropdown(false)} />
              <div className="absolute left-0 top-full mt-2 w-64 bg-pulseops-surface border border-pulseops-border rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-medium text-pulseops-muted uppercase tracking-wider border-b border-pulseops-border">
                  Workspaces
                </div>
                {workspaces.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-pulseops-muted">
                    No workspaces yet
                  </div>
                ) : (
                  workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleSwitchWorkspace(ws)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-pulseops-cyan/10 ${
                        ws.id === currentWorkspace?.id ? 'text-pulseops-cyan bg-pulseops-cyan/10' : 'text-pulseops-text'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-pulseops-cyan/20 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-pulseops-cyan">{ws.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{ws.name}</p>
                        <p className="text-[10px] text-pulseops-muted capitalize">{ws.role || 'member'}</p>
                      </div>
                      {ws.id === currentWorkspace?.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pulseops-cyan shrink-0" />
                      )}
                    </button>
                  ))
                )}
                <div className="border-t border-pulseops-border p-2">
                  <button
                    onClick={() => { setShowWsDropdown(false); setShowWorkspaceCreate(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-pulseops-cyan hover:bg-pulseops-cyan/10 rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    Create Workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Workspace Form */}
      {showWorkspaceCreate && (
        <div className="bg-pulseops-surface border border-pulseops-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-pulseops-text mb-4 flex items-center gap-2">
            <Layout size={16} className="text-pulseops-cyan" />
            Create New Workspace
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="My Production Team"
              className="flex-1 bg-pulseops-bg border border-pulseops-border rounded-lg px-4 py-2.5 text-sm text-pulseops-text placeholder-pulseops-muted/50 outline-none focus:border-pulseops-cyan/50 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            />
            <button
              onClick={handleCreateWorkspace}
              disabled={creatingWorkspace || !newWorkspaceName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-pulseops-cyan text-pulseops-bg font-medium rounded-lg hover:bg-pulseops-cyan/90 disabled:opacity-50 transition-all text-sm"
            >
              {creatingWorkspace ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create
            </button>
            <button
              onClick={() => setShowWorkspaceCreate(false)}
              className="px-4 py-2.5 text-sm text-pulseops-muted hover:text-pulseops-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => {
                if (action.onClick) action.onClick();
                else if (action.href.startsWith('/')) router.push(action.href);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-pulseops-surface border border-pulseops-border rounded-xl text-sm hover:border-pulseops-cyan/30 transition-all group"
            >
              <Icon size={15} className={action.color} />
              <span className="text-pulseops-text group-hover:text-pulseops-cyan transition-colors">{action.label}</span>
              <ArrowRight size={13} className="text-pulseops-muted group-hover:translate-x-0.5 transition-transform" />
            </button>
          );
        })}
      </div>

      {/* Onboarding for new users */}
      {!loadingUser && !hasWorkspace && (
        <div className="bg-gradient-to-r from-pulseops-cyanLight/10 to-pulseops-surface border border-pulseops-cyan/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-pulseops-cyan/20 flex items-center justify-center shrink-0">
              <Bell size={20} className="text-pulseops-cyan" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-heading font-bold text-pulseops-text mb-1">Welcome to PulseOps!</h3>
              <p className="text-sm text-pulseops-muted mb-4">
                Get started by creating your first workspace. Workspaces let you organize projects, team members, and incident response workflows.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowWorkspaceCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-pulseops-cyan text-pulseops-bg font-medium rounded-xl hover:bg-pulseops-cyan/90 transition-all text-sm"
                >
                  <Plus size={14} />
                  Create Workspace
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2 px-4 py-2 border border-pulseops-border text-pulseops-muted rounded-xl hover:text-pulseops-text transition-all text-sm"
                >
                  <Settings size={14} />
                  Configure Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Incidents"
          value={summary?.active_incidents ?? '—'}
          subtitle={summaryLoading ? undefined : `${summary?.incidents_today ?? 0} today`}
          icon="incidents"
        />
        <MetricCard
          title="Average MTTR"
          value={summary?.avg_mttr ? `${Math.round(summary.avg_mttr / 60)}m` : '—'}
          subtitle="Mean time to resolve"
          icon="mttr"
        />
        <MetricCard
          title="Runbooks Active"
          value={summary?.active_runbooks ?? '—'}
          subtitle="Automated workflows"
          icon="actions"
        />
        <MetricCard
          title="Actions Today"
          value={summary?.actions_today ?? '—'}
          subtitle="Runbook steps executed"
          icon="active"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Feed */}
        <div className="lg:col-span-2">
          <IncidentFeed incidents={incidents} latestIncidents={latestIncidents} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Overview */}
          <div className="bg-pulseops-surface border border-pulseops-border rounded-xl p-5">
            <h3 className="text-sm font-medium text-pulseops-text mb-4">Quick Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Resolved Today', value: summary?.resolved_today ?? 0, color: 'text-pulseops-success' },
                { label: 'Avg Response Time', value: summary?.avg_mttr ? `${Math.round(summary.avg_mttr / 60)}m` : '—', color: 'text-pulseops-cyan' },
                { label: 'System Status', value: 'Operational', color: 'text-pulseops-success' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-pulseops-border last:border-0">
                  <span className="text-sm text-pulseops-muted">{stat.label}</span>
                  <span className={`text-sm font-mono font-medium ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-4 py-3 bg-pulseops-surface border border-pulseops-border rounded-xl">
            <span className="w-2 h-2 bg-pulseops-success rounded-full animate-pulse" />
            <span className="text-xs text-pulseops-muted">WebSocket connected — live updates active</span>
            <RefreshCw size={12} className="ml-auto text-pulseops-muted" />
          </div>
        </div>
      </div>

      {/* MTTR Chart - lazy loaded */}
      <MTTRChart data={mttrData} />

      {/* Recent Incidents Timeline */}
      <IncidentTimeline incidents={incidents} />
    </div>
  );
}
