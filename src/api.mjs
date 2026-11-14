import { nomesClasses } from "./dados.mjs";

const apiRemota = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com";

function montarRotasTentativa(caminhoApi) {
  const caminhoLimpo = caminhoApi.startsWith("/") ? caminhoApi : `/${caminhoApi}`;
  const urlAws = `${apiRemota}${caminhoLimpo}`;
  const rotas = [];

  if (window.location.protocol !== "file:") {
    rotas.push(caminhoLimpo);
  } else {
    rotas.push(`http://127.0.0.1:4173${caminhoLimpo}`);
  }
  rotas.push(urlAws);
  return { rotas, urlAws };
}

async function buscarRespostaApi(caminhoApi, sinalAborto, timeoutMs = 9500) {
  const { rotas, urlAws } = montarRotasTentativa(caminhoApi);
  let ultimoErro;
  let statusServidor;

  for (const rota of rotas) {
    if (sinalAborto?.aborted) break;
    const controlador = new AbortController();
    const cancelar = () => controlador.abort(sinalAborto.reason);
    const timer = setTimeout(() => controlador.abort(), timeoutMs);
    sinalAborto?.addEventListener("abort", cancelar, { once: true });
    try {
      const resposta = await fetch(rota, {
        credentials: "omit",
        signal: controlador.signal,
      });
      if (resposta.ok || resposta.status === 404) {
        const dados = await resposta.json();
        if (sinalAborto?.aborted) throw sinalAborto.reason;
        if (resposta.ok || (typeof dados?.error === "string" && caminhoApi.startsWith("/api/profile/"))) {
          return { resposta, dados, urlPublica: new URL(urlAws) };
        }
      }
      if (resposta.status >= 500 && (rota === urlAws || rota === rotas[0])) {
        statusServidor = resposta.status;
      }
    } catch (erro) {
      ultimoErro = erro;
    } finally {
      clearTimeout(timer);
      sinalAborto?.removeEventListener("abort", cancelar);
    }
  }

  if (sinalAborto?.aborted) throw sinalAborto.reason;

  if (statusServidor) {
    throw new Error(`A API do RiftStream está indisponível (HTTP ${statusServidor}). Tente novamente em instantes.`);
  }
  throw ultimoErro || new Error("Falha ao comunicar com os servidores do RiftStream.");
}

async function buscarJsonApi(caminhoApi, sinalAborto, timeoutMs = 9500) {
  const { resposta, dados } = await buscarRespostaApi(caminhoApi, sinalAborto, timeoutMs);
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status} em ${caminhoApi}`);
  }
  return dados;
}

async function buscarRespostaPerfil(loginApi, classeDesejada, sinalAborto) {
  const params = classeDesejada ? `?cls=${encodeURIComponent(classeDesejada)}` : "";
  const loginCodificado = encodeURIComponent(loginApi);
  return buscarRespostaApi(`/api/profile/${loginCodificado}${params}`, sinalAborto);
}

function validarPerfilApi(perfil, login, classe) {
  if (typeof perfil?.login !== "string" || perfil.login.toLowerCase() !== login.toLowerCase() ||
      !Object.hasOwn(nomesClasses, perfil.cls) || (classe && perfil.cls !== classe)) {
    throw new Error("O RiftStream retornou um personagem diferente do solicitado.");
  }

  const stats = perfil.stats;
  if (!Number.isInteger(perfil.level) || perfil.level < 1 ||
      !["maxHp", "atk", "def", "aspd", "crit"].every((stat) => Number.isFinite(stats?.[stat])) ||
      !Array.isArray(perfil.equipped) ||
      perfil.equipped.some((item) => !item || typeof item !== "object" ||
        (item.gems != null && !Array.isArray(item.gems)) ||
        ["atk", "def", "hp", "crit", "spd"].some((stat) => item[stat] != null && !Number.isFinite(item[stat]))) ||
      (perfil.classes != null && (!Array.isArray(perfil.classes) ||
        perfil.classes.some((item) => !item || !Object.hasOwn(nomesClasses, item.cls))))) {
    throw new Error("O RiftStream enviou dados incompletos do personagem. Tente novamente em instantes.");
  }
  return perfil;
}

export {
  buscarJsonApi,
  buscarRespostaPerfil,
  validarPerfilApi,
};
