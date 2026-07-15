import { describe, expect, it } from 'vitest';

import { readSessionIdentity } from './session-identity';

const tokenWith = (payload: object): string =>
  `header.${btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}.signature`;

describe('readSessionIdentity', () => {
  it('aceita apenas papéis operacionais conhecidos e remove duplicatas', () => {
    expect(
      readSessionIdentity(
        tokenWith({
          sub: '84191404067',
          groups: ['administrativo', 'mecanico', 'administrativo', 'externo'],
        }),
      ),
    ).toEqual({ roles: ['administrativo', 'mecanico'], maskedSubject: '***.***.***-67' });
  });

  it('não concede papel quando o token é inválido', () => {
    expect(readSessionIdentity('token-invalido')).toEqual({ roles: [], maskedSubject: null });
  });
});
