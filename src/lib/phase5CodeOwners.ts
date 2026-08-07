export interface CodeOwnerRule {
  id: string;
  tenantId: string;
  projectId: string;
  pathPattern: string; // e.g. "/server/**", "/src/db/**"
  ownerType: 'team' | 'role' | 'member';
  ownerTarget: string; // teamId, role name, or userId
}

export function matchesPathPattern(filePath: string, pattern: string): boolean {
  const normFile = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const normPattern = pattern.startsWith('/') ? pattern : `/${pattern}`;

  if (normPattern.endsWith('/**')) {
    const prefix = normPattern.slice(0, -3);
    return normFile.startsWith(prefix);
  }

  if (normPattern.endsWith('/*')) {
    const prefix = normPattern.slice(0, -2);
    if (!normFile.startsWith(prefix)) return false;
    const remainder = normFile.slice(prefix.length + 1);
    return !remainder.includes('/');
  }

  return normFile === normPattern;
}

export function resolveRequiredCodeOwners(
  filesChanged: { path: string }[],
  rules: CodeOwnerRule[]
): {
  requiredOwners: CodeOwnerRule[];
  affectedPaths: string[];
  orphanedRules: CodeOwnerRule[];
} {
  const matchedRulesSet = new Set<CodeOwnerRule>();
  const affectedPathsSet = new Set<string>();

  for (const file of filesChanged) {
    for (const rule of rules) {
      if (matchesPathPattern(file.path, rule.pathPattern)) {
        matchedRulesSet.add(rule);
        affectedPathsSet.add(file.path);
      }
    }
  }

  // Detect orphaned rules (rules with empty ownerTarget or invalid format)
  const orphanedRules = rules.filter(
    (r) => !r.ownerTarget || r.ownerTarget.trim() === '' || !['team', 'role', 'member'].includes(r.ownerType)
  );

  return {
    requiredOwners: Array.from(matchedRulesSet),
    affectedPaths: Array.from(affectedPathsSet),
    orphanedRules,
  };
}
