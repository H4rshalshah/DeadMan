export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'mitigating' | 'resolved';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type StepType = 'http' | 'shell' | 'slack' | 'aws' | 'wait' | 'condition';
export type UserRole = 'owner' | 'admin' | 'engineer' | 'viewer';
export type ProjectEnvironment = 'production' | 'staging' | 'development';
export type ProjectStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

// Auth / User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: string;
  emailVerified: boolean;
  currentWorkspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  invitedBy: string | null;
  joinedAt: string | null;
  user?: User;
  createdAt: string;
}

export interface Invite {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  environment: ProjectEnvironment;
  baseUrl: string | null;
  healthCheckUrl: string | null;
  repositoryUrl: string | null;
  status: ProjectStatus;
  webhookToken: string;
  healthCheckInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: string | null;
  service_name: string | null;
  runbook_id: string | null;
  created_at: string;
  resolved_at: string | null;
  mttr_seconds: number | null;
  situation_report: SituationReport | null;
  metadata: Record<string, unknown> | null;
  executions?: ActionExecution[];
  runbook?: Runbook | null;
}

export interface RunbookStep {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, unknown>;
  on_failure: 'continue' | 'stop' | 'escalate';
  timeout_ms: number;
}

export interface Runbook {
  id: string;
  name: string;
  description: string | null;
  trigger_conditions: Record<string, unknown> | null;
  steps: RunbookStep[];
  is_active: boolean;
  dry_run_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActionExecution {
  id: string;
  incident_id: string;
  runbook_id: string | null;
  step_id: string;
  step_name: string;
  action_type: string;
  status: ExecutionStatus;
  dry_run: boolean;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
  executed_at: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  interval_seconds: number;
  timeout_ms: number;
  expected_status: number;
  is_active: boolean;
  last_checked_at: string | null;
  last_status: string | null;
}

export interface SituationReport {
  generatedAt: string;
  incidentSummary: Incident;
  recentDeployments: { sha: string; message: string; author: string; date: string }[];
  errorRateData: { timestamp: string; rate: number }[];
  affectedServices: string[];
  similarPastIncidents: Incident[];
  recommendedActions: string[];
}

export interface DashboardSummary {
  active_incidents: number;
  avg_mttr: number | null;
  incidents_today: number;
  resolved_today: number;
  active_runbooks: number;
  actions_today: number;
}

export interface MTTRDataPoint {
  date: string;
  avg_mttr: number | null;
  incident_count: number;
}

export interface IncidentsByDay {
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SourceData {
  source: string;
  count: number;
}

export interface StepUpdate {
  stepId: string;
  stepName: string;
  status: ExecutionStatus;
  dryRun?: boolean;
  message?: string;
  durationMs?: number;
}

// Auth response types
export interface AuthTokensResponse {
  accessToken: string;
  user: User;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  devResetLink?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
}

export interface VerifyEmailResponse {
  success: boolean;
}

export interface LogoutResponse {
  success: boolean;
}
