export type OperationalRole = 'administrativo' | 'mecanico' | 'recepcionista';

export interface SessionIdentity {
  readonly roles: readonly OperationalRole[];
}

const knownRoles: ReadonlySet<string> = new Set<OperationalRole>([
  'administrativo',
  'mecanico',
  'recepcionista',
]);

export const readSessionIdentity = (accessToken: string): SessionIdentity => {
  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return { roles: [] };
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown;
    if (!isRecord(payload) || !Array.isArray(payload['groups'])) return { roles: [] };
    const roles = payload['groups'].filter(
      (role): role is OperationalRole => typeof role === 'string' && knownRoles.has(role),
    );
    return { roles: [...new Set(roles)] };
  } catch {
    return { roles: [] };
  }
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(`${normalized}${padding}`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
