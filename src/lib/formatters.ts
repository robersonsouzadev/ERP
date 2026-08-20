/**
 * Utilitários centralizados de formatação para o Coliseu ERP.
 * Garante padronização total em tabelas, KPIs, drawers e relatórios.
 */

export const parseNumber = (val: number | string | null | undefined): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const sanitized = val.toString().replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return 'R$ 0,00';
  const num = parseNumber(val);
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatPercent = (val: number | string | null | undefined, includeSign = false): string => {
  if (val === null || val === undefined || val === '') return '0,0%';
  const num = parseNumber(val);
  const formatted = num.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  if (includeSign && num > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
};

export const formatDate = (dateStr: string | null | undefined, format: 'short' | 'long' | 'datetime' = 'short'): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (format === 'short') {
      return date.toLocaleDateString('pt-BR');
    }
    if (format === 'datetime') {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const formatCnpjCpf = (value: string | null | undefined): string => {
  if (!value) return '-';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};
