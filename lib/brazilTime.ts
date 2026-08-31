// Vercel roda em UTC. Este helper converte para o horário de São Paulo.

export function agoraBrasil(): Date {
  const agora = new Date();
  const utc = agora.getTime() + agora.getTimezoneOffset() * 60000;
  return new Date(utc - 3 * 60 * 60000);
}

export function formatarHoraBrasil(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data));
}

export function formatarDataHoraBrasil(data: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(data));
}
