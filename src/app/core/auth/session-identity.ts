export type OperationalRole = 'administrativo' | 'mecanico' | 'recepcionista';

export interface SessionIdentity {
  readonly roles: readonly OperationalRole[];
  readonly maskedSubject: string | null;
}

const knownRoles: ReadonlySet<string> = new Set<OperationalRole>([
  'administrativo',
  'mecanico',
  'recepcionista',
]);

export const readSessionIdentity = (accessToken: string): SessionIdentity => {
  try {
    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return emptyIdentity;
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown;
    if (!isRecord(payload)) return emptyIdentity;
    const groups = Array.isArray(payload['groups']) ? payload['groups'] : [];
    const roles = groups.filter(
      (role): role is OperationalRole => typeof role === 'string' && knownRoles.has(role),
    );
    return {
      roles: [...new Set(roles)],
      maskedSubject: maskSubject(payload['sub']),
    };
  } catch {
    return emptyIdentity;
  }
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(`${normalized}${padding}`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const maskSubject = (value: unknown): string | null =>
  typeof value === 'string' && /^\d{11}$/.test(value) ? `***.***.***-${value.slice(-2)}` : null;

const emptyIdentity: SessionIdentity = { roles: [], maskedSubject: null };
