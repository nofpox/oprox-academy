import { logStructured } from './logger';
import crypto from 'crypto';

export type RepositoryProviderType = 'github' | 'gitlab' | 'bitbucket' | 'git';

export type ConnectionStatusType = 'CONFIGURED' | 'NOT_CONFIGURED' | 'UNSUPPORTED' | 'FAILED';

export interface RepositoryConnectionDetails {
  id: string;
  provider: RepositoryProviderType;
  repoIdentifier: string;
  repoOwner: string;
  defaultBranch: string;
  connectionStatus: ConnectionStatusType;
  accountRef?: string;
  maskedToken?: string;
  details?: Record<string, any>;
}

export function maskCredential(secret?: string): string {
  if (!secret) return '[NONE]';
  if (secret.length <= 8) return '****';
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

export class RepositoryProviderAdapterFactory {
  static getAdapter(provider: RepositoryProviderType) {
    switch (provider) {
      case 'github':
        return new GitHubRepositoryAdapter();
      case 'gitlab':
        return new GitLabRepositoryAdapter();
      case 'bitbucket':
        return new BitbucketRepositoryAdapter();
      case 'git':
        return new GenericGitRepositoryAdapter();
      default:
        return new UnsupportedRepositoryAdapter(provider);
    }
  }
}

export interface CheckConnectionResult {
  status: ConnectionStatusType;
  reason?: string;
  accountRef?: string;
}

export interface IRepositoryProviderAdapter {
  checkConnectionStatus(token?: string, repoIdentifier?: string): Promise<CheckConnectionResult>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}

export class GitHubRepositoryAdapter implements IRepositoryProviderAdapter {
  async checkConnectionStatus(token?: string, repoIdentifier?: string) {
    const activeToken = token || process.env.GITHUB_TOKEN || process.env.GH_PAT;
    if (!activeToken) {
      return {
        status: 'NOT_CONFIGURED' as ConnectionStatusType,
        reason: 'GitHub token (GITHUB_TOKEN or GH_PAT) is not configured in the environment or request',
      };
    }
    // Simple verification check
    return {
      status: 'CONFIGURED' as ConnectionStatusType,
      accountRef: `github-user-${maskCredential(activeToken)}`,
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    } catch {
      return false;
    }
  }
}

export class GitLabRepositoryAdapter implements IRepositoryProviderAdapter {
  async checkConnectionStatus(token?: string, repoIdentifier?: string) {
    const activeToken = token || process.env.GITLAB_TOKEN;
    if (!activeToken) {
      return {
        status: 'NOT_CONFIGURED' as ConnectionStatusType,
        reason: 'GitLab token (GITLAB_TOKEN) is not configured in the environment or request',
      };
    }
    return {
      status: 'CONFIGURED' as ConnectionStatusType,
      accountRef: `gitlab-user-${maskCredential(activeToken)}`,
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    return signature === secret;
  }
}

export class BitbucketRepositoryAdapter implements IRepositoryProviderAdapter {
  async checkConnectionStatus(token?: string, repoIdentifier?: string) {
    const activeToken = token || process.env.BITBUCKET_TOKEN;
    if (!activeToken) {
      return {
        status: 'NOT_CONFIGURED' as ConnectionStatusType,
        reason: 'Bitbucket token (BITBUCKET_TOKEN) is not configured in the environment or request',
      };
    }
    return {
      status: 'CONFIGURED' as ConnectionStatusType,
      accountRef: `bitbucket-user-${maskCredential(activeToken)}`,
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    return signature === secret;
  }
}

export class GenericGitRepositoryAdapter implements IRepositoryProviderAdapter {
  async checkConnectionStatus(token?: string, repoIdentifier?: string) {
    return {
      status: 'CONFIGURED' as ConnectionStatusType,
      accountRef: 'local-git-repository',
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    return true;
  }
}

export class UnsupportedRepositoryAdapter implements IRepositoryProviderAdapter {
  constructor(private provider: string) {}

  async checkConnectionStatus() {
    return {
      status: 'UNSUPPORTED' as ConnectionStatusType,
      reason: `Provider '${this.provider}' is not supported by OPROX Repository Engine`,
    };
  }

  verifyWebhookSignature(): boolean {
    return false;
  }
}
