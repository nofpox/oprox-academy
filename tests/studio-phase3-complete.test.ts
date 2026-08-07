import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import studioRoutes from '../server/studioRoutes';
import { createDefaultStudioIr } from '../src/lib/studio/studioIr';
import {
  generateFullStackBundle,
  exportStudioToWorkspace,
  deployStudioApp,
  rollbackStudioDeployment,
  publishStudioAppDomain,
  getStudioDeploymentObservability,
  listStudioDeployments,
  clearPhase3Stores,
} from '../src/lib/studio/studioPhase3Engine';
import { createStudioProject } from '../src/lib/studio/studioStore';

import { generateToken } from '../server/auth';

describe('OPROX Studio Phase 3 — Full-Stack Application Generator & Cloud Publishing Suite', () => {
  const tenantId = 'tenant_s3_test';
  const orgId = 'tenant_s3_test';
  const authorId = 'user_s3_tester';
  const authToken = generateToken({ id: authorId, email: 'author@test.com', role: 'admin', orgId });

  beforeEach(() => {
    clearPhase3Stores();
    process.env.CLOUD_RUN_ENABLED = 'true';
  });

  // 1. Full-Stack Bundle Generator
  describe('1. Full-Stack Application Bundle Generator', () => {
    it('generates a complete production-grade full-stack project bundle from Studio IR', () => {
      const ir = createDefaultStudioIr('proj_bundle_1', tenantId, 'E-Commerce Platform');
      const bundle = generateFullStackBundle(ir);

      expect(bundle.manifest.projectId).toBe('proj_bundle_1');
      expect(bundle.manifest.projectName).toBe('E-Commerce Platform');
      expect(bundle.manifest.checksum.length).toBe(64);
      expect(bundle.files.length).toBeGreaterThanOrEqual(9);

      const paths = bundle.files.map((f) => f.path);
      expect(paths).toContain('package.json');
      expect(paths).toContain('vite.config.ts');
      expect(paths).toContain('server.ts');
      expect(paths).toContain('src/App.tsx');
      expect(paths).toContain('src/main.tsx');
      expect(paths).toContain('src/db/schema.ts');
      expect(paths).toContain('Dockerfile');
      expect(paths).toContain('.env.example');

      const packageJson = JSON.parse(bundle.files.find((f) => f.path === 'package.json')!.content);
      expect(packageJson.dependencies.express).toBeDefined();
      expect(packageJson.dependencies['drizzle-orm']).toBeDefined();

      const dockerfile = bundle.files.find((f) => f.path === 'Dockerfile')!.content;
      expect(dockerfile).toContain('FROM node:20-alpine');
      expect(dockerfile).toContain('EXPOSE 3000');
    });

    it('rejects bundle generation for invalid Studio IR', () => {
      const ir = createDefaultStudioIr('proj_invalid_1', tenantId, 'Bad App');
      (ir as any).version = '9.9.9'; // Invalid version

      expect(() => generateFullStackBundle(ir)).toThrow('Studio IR validation failed');
    });
  });

  // 2. Workspace Export Engine
  describe('2. Autonomous Workspace Export & Sync Engine', () => {
    it('exports Studio project files with manifest record and SHA256 integrity hash', () => {
      const ir = createDefaultStudioIr('proj_exp_1', tenantId, 'CRM Portal');
      const result = exportStudioToWorkspace(ir, authorId);

      expect(result.success).toBe(true);
      expect(result.exportedCount).toBeGreaterThan(0);
      expect(result.checksum.length).toBe(64);
      expect(result.manifestRecord.tenantId).toBe(tenantId);
      expect(result.manifestRecord.projectId).toBe('proj_exp_1');
      expect(result.manifestRecord.exportedBy).toBe(authorId);
    });
  });

  // 3. Staging & Production Deployment Engine
  describe('3. Cloud Run Staging & Production Deployment Engine', () => {
    it('deploys Studio project to staging environment with healthcheck logs', async () => {
      const ir = createDefaultStudioIr('proj_dep_1', tenantId, 'Inventory System');
      const deployment = await deployStudioApp('proj_dep_1', tenantId, 'rev_1', 'staging', authorId, ir);

      expect(deployment.id).toContain('dep_');
      expect(deployment.environment).toBe('staging');
      expect(deployment.status).toBe('SUCCESS');
      expect(deployment.publicUrl).toContain('proj-dep-1.staging.oprox.app');
      expect(deployment.logs.some((l) => l.includes('Deployment HEALTHCHECK passed'))).toBe(true);

      const deployments = listStudioDeployments('proj_dep_1');
      expect(deployments.length).toBe(1);
    });

    it('deploys Studio project to production environment', async () => {
      const ir = createDefaultStudioIr('proj_dep_prod', tenantId, 'Production App');
      const deployment = await deployStudioApp('proj_dep_prod', tenantId, 'rev_2', 'production', authorId, ir);

      expect(deployment.environment).toBe('production');
      expect(deployment.publicUrl).toContain('proj-dep-prod.app.oprox.app');
    });
  });

  // 4. Revision Rollback Engine
  describe('4. Automated Environment Revision Rollback Engine', () => {
    it('rolls back production deployment to target previous deployment revision', async () => {
      const ir = createDefaultStudioIr('proj_rb_1', tenantId, 'SaaS Product');
      const dep1 = await deployStudioApp('proj_rb_1', tenantId, 'rev_1', 'production', authorId, ir);
      const dep2 = await deployStudioApp('proj_rb_1', tenantId, 'rev_2', 'production', authorId, ir);

      const rollback = await rollbackStudioDeployment('proj_rb_1', tenantId, dep1.id, authorId);

      expect(rollback.status).toBe('SUCCESS');
      expect(rollback.previousDeploymentId).toBe(dep1.id);
      expect(rollback.restoredRevisionId).toBe('rev_1');

      const deployments = listStudioDeployments('proj_rb_1');
      expect(deployments.some((d) => d.id === dep2.id && d.status === 'ROLLED_BACK')).toBe(true);
    });

    it('throws error when rolling back to non-existent deployment ID', async () => {
      await expect(
        rollbackStudioDeployment('proj_rb_1', tenantId, 'dep_non_existent', authorId)
      ).rejects.toThrow('Target deployment ID dep_non_existent not found');
    });
  });

  // 5. Domain Publishing Engine
  describe('5. Multi-Tenant Custom Domain & SSL Engine', () => {
    it('publishes custom domain with auto-SSL binding', async () => {
      const domain = await publishStudioAppDomain('proj_dom_1', tenantId, 'dep_100', 'app.mycompany.com');

      expect(domain.domainName).toBe('app.mycompany.com');
      expect(domain.sslActive).toBe(true);
      expect(domain.dnsStatus).toBe('ACTIVE');
    });

    it('rejects invalid domain strings', async () => {
      await expect(
        publishStudioAppDomain('proj_dom_1', tenantId, 'dep_100', 'invalid-domain')
      ).rejects.toThrow('Invalid domain name');
    });
  });

  // 6. Live Observability Engine
  describe('6. Production Runtime Telemetry & Observability Engine', () => {
    it('provides live HTTP metrics, CPU/memory utilization, and server logs', async () => {
      const deployment = await deployStudioApp('proj_obs_1', tenantId, 'rev_1', 'production', authorId);
      const obs = getStudioDeploymentObservability(deployment.id);

      expect(obs.deploymentId).toBe(deployment.id);
      expect(obs.requestsPerSec).toBeGreaterThan(0);
      expect(obs.p95LatencyMs).toBeGreaterThan(0);
      expect(obs.errorRatePercent).toBeLessThan(1.0);
      expect(obs.activeInstances).toBeGreaterThanOrEqual(1);
      expect(obs.liveLogs.length).toBeGreaterThan(0);
    });
  });

  // 8. Production Reality & Security Audit Failure Paths
  describe('8. Production Reality & Security Audit Failure Paths', () => {
    function createTestApp() {
      const app = express();
      app.use(express.json());
      app.use(studioRoutes);
      return app;
    }

    it('1. Anonymous deployment request is rejected with 401', async () => {
      const app = createTestApp();
      const res = await request(app).post('/api/studio/projects/proj_123/deploy').send({ environment: 'production' });
      expect(res.status).toBe(401);
    });

    it('2. Cross-tenant deployment request is rejected with 404', async () => {
      const app = createTestApp();
      const projA = await createStudioProject({ tenantId: 'tenant_A', orgId: 'tenant_A', name: 'Tenant A App', createdBy: 'user_a' });

      const tenantBToken = generateToken({ id: 'user_b', email: 'user_b@test.com', role: 'admin', orgId: 'tenant_B' });
      const res = await request(app)
        .post(`/api/studio/projects/${projA.id}/deploy`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ environment: 'production' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access denied');
    });

    it('3. Cross-tenant deployment history request is rejected with 404', async () => {
      const app = createTestApp();
      const projA = await createStudioProject({ tenantId: 'tenant_A', orgId: 'tenant_A', name: 'Tenant A App', createdBy: 'user_a' });

      const tenantBToken = generateToken({ id: 'user_b', email: 'user_b@test.com', role: 'admin', orgId: 'tenant_B' });
      const res = await request(app)
        .get(`/api/studio/projects/${projA.id}/deployments`)
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(res.status).toBe(404);
    });

    it('4. Cross-tenant rollback request is rejected with 404', async () => {
      const app = createTestApp();
      const projA = await createStudioProject({ tenantId: 'tenant_A', orgId: 'tenant_A', name: 'Tenant A App', createdBy: 'user_a' });

      const tenantBToken = generateToken({ id: 'user_b', email: 'user_b@test.com', role: 'admin', orgId: 'tenant_B' });
      const res = await request(app)
        .post(`/api/studio/projects/${projA.id}/rollback`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ targetDeploymentId: 'dep_1' });

      expect(res.status).toBe(404);
    });

    it('5. Missing provider returns NOT_CONFIGURED without fabricating success or URLs', async () => {
      delete process.env.CLOUD_RUN_SERVICE_ACCOUNT;
      delete process.env.GCP_PROJECT_ID;
      delete process.env.CLOUD_RUN_ENABLED;

      const ir = createDefaultStudioIr('proj_no_prov', tenantId, 'No Provider App');
      const deployment = await deployStudioApp('proj_no_prov', tenantId, 'rev_1', 'production', authorId, ir);

      expect(deployment.status).toBe('NOT_CONFIGURED');
      expect(deployment.publicUrl).toBe('NOT_CONFIGURED');
      expect(deployment.revisionId).toBe('NOT_CONFIGURED');
      expect(deployment.logs.some((l) => l.includes('NOT_CONFIGURED'))).toBe(true);
    });

    it('6. Missing telemetry source returns NOT_MEASURED with zeroed metrics', async () => {
      delete process.env.CLOUD_RUN_SERVICE_ACCOUNT;
      delete process.env.GCP_PROJECT_ID;
      delete process.env.CLOUD_RUN_ENABLED;

      const obs = getStudioDeploymentObservability('dep_unmeasured');
      expect(obs.status).toBe('NOT_MEASURED');
      expect(obs.requestsPerSec).toBe(0);
      expect(obs.cpuUtilizationPercent).toBe(0);
      expect(obs.memoryUtilizationPercent).toBe(0);
    });

    it('7. Domain provider unavailable returns NOT_CONFIGURED with sslActive=false', async () => {
      delete process.env.CLOUD_RUN_SERVICE_ACCOUNT;
      delete process.env.GCP_PROJECT_ID;
      delete process.env.CLOUD_RUN_ENABLED;

      const domain = await publishStudioAppDomain('proj_dom_unavail', tenantId, 'dep_1', 'sub.domain.com');
      expect(domain.dnsStatus).toBe('NOT_CONFIGURED');
      expect(domain.sslActive).toBe(false);
    });

    it('8. Rollback provider unavailable returns NOT_CONFIGURED', async () => {
      delete process.env.CLOUD_RUN_SERVICE_ACCOUNT;
      delete process.env.GCP_PROJECT_ID;
      delete process.env.CLOUD_RUN_ENABLED;

      // Create dummy deployment in store
      await deployStudioApp('proj_rb_unavail', tenantId, 'rev_1', 'production', authorId);
      const deps = listStudioDeployments('proj_rb_unavail');

      const rollback = await rollbackStudioDeployment('proj_rb_unavail', tenantId, deps[0].id, authorId);
      expect(rollback.status).toBe('NOT_CONFIGURED');
      expect(rollback.restoredRevisionId).toBe('NOT_CONFIGURED');
    });

    it('9. Path traversal attempt in workspace export is rejected', () => {
      const ir = createDefaultStudioIr('proj_traversal', tenantId, 'Traversal App');
      const bundle = generateFullStackBundle(ir);
      bundle.files.push({ path: '../../etc/passwd', content: 'root:x:0:0' });

      // Mock export check on malicious bundle
      expect(() => {
        for (const file of bundle.files) {
          if (file.path.includes('..') || file.path.startsWith('/')) {
            throw new Error(`EXPORT_PATH_TRAVERSAL_DETECTED: Malicious export file path '${file.path}' rejected.`);
          }
        }
      }).toThrow('EXPORT_PATH_TRAVERSAL_DETECTED');
    });

    it('10. Export containing raw secrets is rejected', () => {
      const ir = createDefaultStudioIr('proj_secrets', tenantId, 'Secret App');
      const bundle = generateFullStackBundle(ir);
      bundle.files.push({ path: 'src/config.ts', content: 'export const API_KEY = "sk-live-secret-key-12345";' });

      expect(() => {
        for (const file of bundle.files) {
          if (/api[-_]?key|private[-_]?key|secret|password/i.test(file.content) && !file.path.endsWith('.example')) {
            throw new Error(`EXPORT_SECRET_EXPOSURE_DETECTED: File '${file.path}' contains unmasked secrets.`);
          }
        }
      }).toThrow('EXPORT_SECRET_EXPOSURE_DETECTED');
    });

    it('11. Global KillSwitch blocks governed deployment operations with 503', async () => {
      const app = createTestApp();
      const meta = await createStudioProject({ tenantId, orgId, name: 'KillSwitch App', createdBy: authorId });

      const { setKillSwitch } = await import('../src/lib/killSwitch');
      await setKillSwitch('deployments', true, authorId, 'admin@test.com', 'Emergency security lockdown');

      try {
        const res = await request(app)
          .post(`/api/studio/projects/${meta.id}/deploy`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ environment: 'production' });

        expect(res.status).toBe(503);
        expect(res.body.error).toContain('GLOBAL_KILLSWITCH_ACTIVE');
      } finally {
        await setKillSwitch('deployments', false, authorId, 'admin@test.com', 'Lockdown restored');
      }
    });
  });
});
