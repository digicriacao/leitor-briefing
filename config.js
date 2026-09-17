/**
 * CONFIGURACAO DO LEITOR DE BRIEFING
 *
 * ATENCAO: qualquer chave inserida aqui ficara visivel para quem abrir
 * as ferramentas de desenvolvedor do navegador. Use apenas em ambiente
 * controlado e com chave dedicada, limites de uso e faturamento.
 */
window.BRIEFING_CONFIG = {
  provider: 'openai', // 'openai' ou 'gemini'

  openai: {
    apiKey: 'COLE_SUA_CHAVE_OPENAI_AQUI',
    model: 'gpt-4.1-mini'
  },

  gemini: {
    apiKey: 'COLE_SUA_CHAVE_GEMINI_AQUI',
    model: 'gemini-2.5-flash'
  },

  app: {
    name: 'Briefing Reader',
    brand: 'PAUTA',
    maxFileSizeMB: 35
  }
};
