/** Convierte una fecha ISO 8601 a texto legible (ej. "05 de noviembre de 2026"). */
export function formatDate(iso: string, locale = 'es-ES'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
