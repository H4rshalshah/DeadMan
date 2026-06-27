import axios from 'axios';

export interface DetectedEndpoint {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  fullUrl: string;
  description: string | null;
  authRequired: boolean;
  expectedStatusCode: number;
  detectionMethod: 'auto_scan' | 'openapi' | 'github' | 'manual';
}

// Common API endpoint patterns to scan
const commonEndpoints: { path: string; methods: Array<{ method: DetectedEndpoint['method']; desc: string }> }[] = [
  { path: '/health', methods: [{ method: 'GET', desc: 'Health check endpoint' }] },
  { path: '/healthz', methods: [{ method: 'GET', desc: 'Kubernetes health check' }] },
  { path: '/readyz', methods: [{ method: 'GET', desc: 'Kubernetes readiness probe' }] },
  { path: '/api', methods: [{ method: 'GET', desc: 'API root' }] },
  { path: '/api/health', methods: [{ method: 'GET', desc: 'API health check' }] },
  { path: '/api/v1', methods: [{ method: 'GET', desc: 'API v1 root' }] },
  { path: '/api/v1/health', methods: [{ method: 'GET', desc: 'API v1 health' }] },
  { path: '/api/users', methods: [{ method: 'GET', desc: 'List users' }, { method: 'POST', desc: 'Create user' }] },
  { path: '/api/users/:id', methods: [{ method: 'GET', desc: 'Get user' }, { method: 'PUT', desc: 'Update user' }, { method: 'DELETE', desc: 'Delete user' }, { method: 'PATCH', desc: 'Partial update user' }] },
  { path: '/api/auth/login', methods: [{ method: 'POST', desc: 'User login' }] },
  { path: '/api/auth/register', methods: [{ method: 'POST', desc: 'User registration' }] },
  { path: '/api/auth/logout', methods: [{ method: 'POST', desc: 'User logout' }] },
  { path: '/api/auth/refresh', methods: [{ method: 'POST', desc: 'Refresh token' }] },
  { path: '/api/auth/me', methods: [{ method: 'GET', desc: 'Get current user profile' }] },
  { path: '/api/projects', methods: [{ method: 'GET', desc: 'List projects' }, { method: 'POST', desc: 'Create project' }] },
  { path: '/api/projects/:id', methods: [{ method: 'GET', desc: 'Get project' }, { method: 'PUT', desc: 'Update project' }, { method: 'DELETE', desc: 'Delete project' }] },
  { path: '/api/incidents', methods: [{ method: 'GET', desc: 'List incidents' }, { method: 'POST', desc: 'Create incident' }] },
  { path: '/api/incidents/:id', methods: [{ method: 'GET', desc: 'Get incident' }, { method: 'PATCH', desc: 'Update incident' }] },
  { path: '/api/webhooks', methods: [{ method: 'POST', desc: 'Receive webhook' }] },
  { path: '/api/webhooks/:id', methods: [{ method: 'GET', desc: 'Get webhook' }, { method: 'DELETE', desc: 'Delete webhook' }] },
  { path: '/api/notifications', methods: [{ method: 'GET', desc: 'List notifications' }] },
  { path: '/api/notifications/:id/read', methods: [{ method: 'POST', desc: 'Mark notification as read' }] },
  { path: '/api/settings', methods: [{ method: 'GET', desc: 'Get settings' }, { method: 'PUT', desc: 'Update settings' }] },
  { path: '/api/analytics', methods: [{ method: 'GET', desc: 'Get analytics' }] },
  { path: '/api/monitors', methods: [{ method: 'GET', desc: 'List monitors' }, { method: 'POST', desc: 'Create monitor' }] },
  { path: '/api/monitors/:id', methods: [{ method: 'GET', desc: 'Get monitor' }, { method: 'PUT', desc: 'Update monitor' }, { method: 'DELETE', desc: 'Delete monitor' }] },
  { path: '/api/runbooks', methods: [{ method: 'GET', desc: 'List runbooks' }, { method: 'POST', desc: 'Create runbook' }] },
  { path: '/api/runbooks/:id', methods: [{ method: 'GET', desc: 'Get runbook' }, { method: 'PUT', desc: 'Update runbook' }, { method: 'DELETE', desc: 'Delete runbook' }] },
  { path: '/api/teams', methods: [{ method: 'GET', desc: 'List teams' }, { method: 'POST', desc: 'Create team' }] },
  { path: '/api/teams/:id', methods: [{ method: 'GET', desc: 'Get team' }, { method: 'PUT', desc: 'Update team' }, { method: 'DELETE', desc: 'Delete team' }] },
  { path: '/api/teams/:id/members', methods: [{ method: 'GET', desc: 'List team members' }, { method: 'POST', desc: 'Add team member' }] },
  { path: '/metrics', methods: [{ method: 'GET', desc: 'Prometheus metrics' }] },
  { path: '/swagger.json', methods: [{ method: 'GET', desc: 'Swagger/OpenAPI spec' }] },
  { path: '/api-docs', methods: [{ method: 'GET', desc: 'API documentation' }] },
  { path: '/openapi.json', methods: [{ method: 'GET', desc: 'OpenAPI JSON spec' }] },
  { path: '/version', methods: [{ method: 'GET', desc: 'Service version info' }] },
];

export class ApiDetectionService {
  /**
   * Scan a base URL for common API endpoints without actually hitting them
   * (uses known API patterns based on the base URL)
   */
  static async detectFromBaseUrl(baseUrl: string): Promise<DetectedEndpoint[]> {
    const detected: DetectedEndpoint[] = [];
    const normalizedBase = baseUrl.replace(/\/+$/, '');

    for (const ep of commonEndpoints) {
      for (const method of ep.methods) {
        // Skip parameterized routes for auto-detection (they need manual setup)
        if (ep.path.includes(':id')) {
          // Add a representative sample instead
          detected.push({
            name: method.desc,
            path: ep.path.replace(':id', '{id}'),
            method: method.method,
            fullUrl: `${normalizedBase}${ep.path.replace(':id', 'example-id')}`,
            description: method.desc,
            authRequired: method.method !== 'GET',
            expectedStatusCode: method.method === 'POST' || method.method === 'PUT' ? 201 : 200,
            detectionMethod: 'auto_scan',
          });
          continue;
        }

        detected.push({
          name: method.desc,
          path: ep.path,
          method: method.method,
          fullUrl: `${normalizedBase}${ep.path}`,
          description: method.desc,
          authRequired: method.method !== 'GET',
          expectedStatusCode: method.method === 'POST' || method.method === 'PUT' ? 201 : 200,
          detectionMethod: 'auto_scan',
        });
      }
    }

    return detected;
  }

  /**
   * Try to detect endpoints from an OpenAPI/Swagger specification
   */
  static async detectFromOpenApi(baseUrl: string): Promise<DetectedEndpoint[]> {
    const detected: DetectedEndpoint[] = [];
    const normalizedBase = baseUrl.replace(/\/+$/, '');

    // Try common OpenAPI spec locations
    const specUrls = [
      `${normalizedBase}/openapi.json`,
      `${normalizedBase}/swagger.json`,
      `${normalizedBase}/api-docs`,
      `${normalizedBase}/v3/api-docs`,
      `${normalizedBase}/swagger/v1/swagger.json`,
    ];

    for (const specUrl of specUrls) {
      try {
        const response = await axios.get(specUrl, { timeout: 5000, validateStatus: () => true });
        if (response.status === 200 && response.data) {
          const spec = response.data;

          // OpenAPI 3.x
          if (spec.openapi || spec.swagger === '3.0') {
            const paths = spec.paths || {};
            for (const [path, methods] of Object.entries(paths)) {
              const methodsObj = methods as Record<string, unknown>;
              for (const [method, details] of Object.entries(methodsObj)) {
                const detail = details as Record<string, unknown>;
                const summary = (detail.summary as string) || '';
                detected.push({
                  name: summary || `${method.toUpperCase()} ${path}`,
                  path,
                  method: method.toUpperCase() as DetectedEndpoint['method'],
                  fullUrl: `${normalizedBase}${path}`,
                  description: (detail.description as string) || null,
                  authRequired: !!(detail as Record<string, unknown>).security,
                  expectedStatusCode: 200,
                  detectionMethod: 'openapi',
                });
              }
            }
            if (detected.length > 0) break;
          }

          // Swagger 2.0
          if (spec.swagger === '2.0') {
            const paths = spec.paths || {};
            for (const [path, methods] of Object.entries(paths)) {
              const methodsObj = methods as Record<string, unknown>;
              for (const [method, details] of Object.entries(methodsObj)) {
                const detail = details as Record<string, unknown>;
                detected.push({
                  name: (detail.summary as string) || `${method.toUpperCase()} ${path}`,
                  path,
                  method: method.toUpperCase() as DetectedEndpoint['method'],
                  fullUrl: `${normalizedBase}${path}`,
                  description: (detail.description as string) || null,
                  authRequired: false,
                  expectedStatusCode: 200,
                  detectionMethod: 'openapi',
                });
              }
            }
            if (detected.length > 0) break;
          }
        }
      } catch {
        // Continue to next spec URL
        continue;
      }
    }

    return detected;
  }

  /**
   * Comprehensive detection: try OpenAPI first, then fall back to pattern scanning
   */
  static async detectAll(baseUrl: string): Promise<{ endpoints: DetectedEndpoint[]; method: string }> {
    // Try OpenAPI first
    const openApiEndpoints = await this.detectFromOpenApi(baseUrl);
    if (openApiEndpoints.length > 0) {
      return { endpoints: openApiEndpoints, method: 'openapi' };
    }

    // Fall back to pattern scanning
    const scannedEndpoints = await this.detectFromBaseUrl(baseUrl);
    return { endpoints: scannedEndpoints, method: 'auto_scan' };
  }
}
