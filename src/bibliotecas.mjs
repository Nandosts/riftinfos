const escopoGlobal = typeof window !== "undefined" ? window : globalThis;
const Explicacoes =
  escopoGlobal.RiftExplicacoes ||
  {};
const Analise =
  escopoGlobal.RiftAnalise ||
  {};
const Historico =
  escopoGlobal.RiftHistorico ||
  {};
const Compartilhamento =
  escopoGlobal.RiftCompartilhamento ||
  {};

const CALCULATION_VERSION = Analise.VERSAO_CALCULO || "2026.11.18";

export {
  Analise,
  CALCULATION_VERSION,
  Compartilhamento,
  Explicacoes,
  Historico,
};
