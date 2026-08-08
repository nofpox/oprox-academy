import { AuthRequest } from '../../auth';

export function getTenantId(req: AuthRequest): string {
  return (
    req.user?.orgId ||
    req.user?.id ||
    (req.headers['x-tenant-id'] as string) ||
    'default-tenant'
  );
}
