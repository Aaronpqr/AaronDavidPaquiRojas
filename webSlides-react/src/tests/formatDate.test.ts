import { describe, expect, it } from '@jest/globals';
import { formatDate } from '../utils/formatDate';

describe('formatDate', () => {
  it('formatea una fecha ISO en español con el año', () => {
    expect(formatDate('2026-11-05T15:00:00.000Z')).toContain('2026');
  });

  it('devuelve cadena vacía si la fecha es inválida', () => {
    expect(formatDate('no-es-fecha')).toBe('');
  });
});