import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const URL_RIFTSTREAM = "https://riftstream.com.br/";
const URL_API_PUBLICA = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com";

async function obterBundleOficial(caminhoLocal = null) {
  if (caminhoLocal) {
    const resolvido = path.resolve(caminhoLocal);
    const codigo = fs.readFileSync(resolvido, "utf8");
    const matchNome = path.basename(resolvido).match(/index-[^.]+\.js/);
    return {
      origem: resolvido,
      asset: matchNome ? `/assets/${matchNome[0]}` : path.basename(resolvido),
      codigo,
    };
  }
  const respHtml = await fetch(URL_RIFTSTREAM);
  if (!respHtml.ok) {
    throw new Error(`Falha ao consultar ${URL_RIFTSTREAM}: HTTP ${respHtml.status}`);
  }
  const html = await respHtml.text();
  const matchAsset = html.match(/\/assets\/(index-[^"'\s]+\.js)/);
  if (!matchAsset) {
    throw new Error("Não foi possível localizar /assets/index-*.js no HTML do RiftStream.");
  }
  const asset = `/assets/${matchAsset[1]}`;
  const urlAsset = `${URL_RIFTSTREAM}assets/${matchAsset[1]}`;
  const respJs = await fetch(urlAsset);
  if (!respJs.ok) {
    throw new Error(`Falha ao baixar ${urlAsset}: HTTP ${respJs.status}`);
  }
  return { origem: urlAsset, asset, codigo: await respJs.text() };
}

function exigirRegex(texto, regex, descricao) {
  const match = texto.match(regex);
  if (!match) {
    throw new Error(`Âncora não encontrada no bundle do jogo: ${descricao}`);
  }
  return match;
}

function avaliarExpressaoSegura(expressao, contexto = {}) {
  const sandbox = { Math, Array, Object, Set, Map, Number, String, Boolean, ...contexto };
  vm.createContext(sandbox);
  return vm.runInContext(`(${expressao})`, sandbox, { timeout: 1000 });
}

function extrairBlocoBalanceado(texto, indiceAbertura, abre = "{", fecha = "}") {
  if (texto[indiceAbertura] !== abre) {
    throw new Error(`Caractere esperado '${abre}' na posição ${indiceAbertura}`);
  }
  let profundidade = 0;
  let emString = null;
  let escapado = false;
  for (let i = indiceAbertura; i < texto.length; i++) {
    const ch = texto[i];
    if (emString) {
      if (escapado) escapado = false;
      else if (ch === "\\") escapado = true;
      else if (ch === emString) emString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      emString = ch;
    } else if (ch === abre) {
      profundidade++;
    } else if (ch === fecha) {
      profundidade--;
      if (profundidade === 0) return texto.slice(indiceAbertura, i + 1);
    }
  }
  throw new Error(`Bloco '${abre}...${fecha}' iniciado em ${indiceAbertura} não foi fechado.`);
}

export {
  URL_API_PUBLICA,
  URL_RIFTSTREAM,
  avaliarExpressaoSegura,
  exigirRegex,
  extrairBlocoBalanceado,
  obterBundleOficial,
};
