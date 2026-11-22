import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RAIZ = process.cwd();
const PAGINAS_HTML = ["index.html", "tierlist.html", "alquimia.html", "ranking.html"];

function analisarArgumentos(argv) {
  const opcoes = {
    atualizarCacheBust: false,
    comE2e: false,
    semTestes: false,
    json: false,
  };
  for (const arg of argv) {
    if (arg === "--atualizar-cache-bust") opcoes.atualizarCacheBust = true;
    else if (arg === "--com-e2e") opcoes.comE2e = true;
    else if (arg === "--sem-testes") opcoes.semTestes = true;
    else if (arg === "--json") opcoes.json = true;
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/verificar_release.mjs [opções]

Verifica assets locais referenciados nos HTMLs/JS, valida todos os imports e
exports dos módulos .mjs (arquivos existentes e símbolos exportados), confere
cache-bust (?v=...) para arquivos alterados no Git e executa os testes.

Opções:
  --atualizar-cache-bust  Incrementa ?v=YYYYMMDDx nos HTMLs para arquivos alterados no Git
  --com-e2e               Também executa a suíte Playwright (npm run test:e2e)
  --sem-testes            Pula a execução de npm test / Playwright
  --json                  Imprime o resultado em JSON`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  return opcoes;
}

function listarArquivosAlteradosGit() {
  try {
    const saida = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" });
    return saida
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.slice(3).trim().replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

function coletarModulosMjs(dir) {
  const arquivos = [];
  if (!fs.existsSync(dir)) return arquivos;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      arquivos.push(...coletarModulosMjs(caminho));
    } else if (entrada.isFile() && entrada.name.endsWith(".mjs")) {
      arquivos.push(caminho);
    }
  }
  return arquivos;
}

function removerComentariosEPreprocessar(codigo) {
  // Remove comentários de linha e bloco preservando strings simples/duplas/template
  return codigo.replace(/\/\*[\s\S]*?\*\/|(?<![:\\])\/\/[^\n]*/g, "");
}

function extrairExportsModulo(caminhoArquivo, visitados = new Set()) {
  const resolvido = path.resolve(caminhoArquivo);
  if (visitados.has(resolvido) || !fs.existsSync(resolvido)) return new Set();
  visitados.add(resolvido);

  const codigo = removerComentariosEPreprocessar(fs.readFileSync(resolvido, "utf8"));
  const nomes = new Set();

  // export function foo / export async function foo / export class Foo / export const|let|var foo
  const regexDecl = /\bexport\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  let m;
  while ((m = regexDecl.exec(codigo)) !== null) nomes.add(m[1]);

  if (/\bexport\s+default\b/.test(codigo)) nomes.add("default");

  // export { a, b as c } (com ou sem from "...")
  const regexLista = /\bexport\s*\{([^}]+)\}(?:\s*from\s*["']([^"']+)["'])?/g;
  while ((m = regexLista.exec(codigo)) !== null) {
    for (const item of m[1].split(",")) {
      const limpo = item.trim();
      if (!limpo) continue;
      const partes = limpo.split(/\s+as\s+/);
      nomes.add((partes[1] || partes[0]).trim());
    }
  }

  // export * from "./outro.mjs" (pela spec ESM, export * não reexporta default)
  const regexStar = /\bexport\s*\*\s*from\s*["']([^"']+)["']/g;
  while ((m = regexStar.exec(codigo)) !== null) {
    const spec = m[1].split(/[?#]/)[0];
    if (spec.startsWith(".")) {
      const destino = path.resolve(path.dirname(resolvido), spec);
      for (const nome of extrairExportsModulo(destino, visitados)) {
        if (nome !== "default") nomes.add(nome);
      }
    }
  }

  return nomes;
}

function verificarImportsEExportsModulos() {
  const modulos = new Set();
  const appMjs = path.join(RAIZ, "app.mjs");
  if (fs.existsSync(appMjs)) modulos.add(appMjs);
  for (const m of coletarModulosMjs(path.join(RAIZ, "src"))) modulos.add(m);

  // Também inclui qualquer <script type="module" src="..."> dos HTMLs
  const regexModHtml = /<script[^>]*type="module"[^>]*src="([^"]+)"/g;
  for (const htmlFile of PAGINAS_HTML) {
    const caminhoHtml = path.join(RAIZ, htmlFile);
    if (!fs.existsSync(caminhoHtml)) continue;
    const html = fs.readFileSync(caminhoHtml, "utf8");
    let match;
    while ((match = regexModHtml.exec(html)) !== null) {
      const semQuery = match[1].split(/[?#]/)[0];
      if (!/^https?:/.test(semQuery)) {
        const destino = path.resolve(RAIZ, semQuery);
        if (fs.existsSync(destino)) modulos.add(destino);
      }
    }
  }

  const erros = [];
  const cacheExports = new Map();
  const obterExports = (caminho) => {
    if (!cacheExports.has(caminho)) cacheExports.set(caminho, extrairExportsModulo(caminho));
    return cacheExports.get(caminho);
  };

  for (const modulo of [...modulos].sort()) {
    const rel = path.relative(RAIZ, modulo);
    const codigo = removerComentariosEPreprocessar(fs.readFileSync(modulo, "utf8"));

    // 1. import ... from "..."  e  export ... from "..."
    const regexImportExport = /\b(import|export)\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
    let m;
    while ((m = regexImportExport.exec(codigo)) !== null) {
      const tipoDecl = m[1];
      const clausula = m[2].trim();
      const specBruto = m[3];
      if (/^(?:node:|https?:)/.test(specBruto) || !specBruto.startsWith(".")) continue;
      const spec = specBruto.split(/[?#]/)[0];
      const destino = path.resolve(path.dirname(modulo), spec);
      if (!fs.existsSync(destino)) {
        erros.push({ origem: rel, tipo: "import_inexistente", detalhe: `${specBruto} não encontrado` });
        continue;
      }

      const exportsAlvo = obterExports(destino);

      // Valida import default: import Foo from "...", import Foo, { a } from "...", import Foo, * as NS from "..."
      if (tipoDecl === "import") {
        const matchDefault = clausula.match(/^([A-Za-z_$][A-Za-z0-9_$]*)(?:\s*,|$)/);
        if (matchDefault && !exportsAlvo.has("default")) {
          erros.push({
            origem: rel,
            tipo: "export_default_ausente",
            detalhe: `import default '${matchDefault[1]}' de ${specBruto}, mas ${path.relative(RAIZ, destino)} não possui export default`,
          });
        }
      }

      // Valida símbolos nomeados { a, b as c }
      const matchChaves = clausula.match(/\{([^}]+)\}/);
      if (matchChaves) {
        for (const item of matchChaves[1].split(",")) {
          const limpo = item.trim();
          if (!limpo) continue;
          const nomeOriginal = limpo.split(/\s+as\s+/)[0].trim();
          if (nomeOriginal && !exportsAlvo.has(nomeOriginal)) {
            erros.push({
              origem: rel,
              tipo: "export_ausente",
              detalhe: `'${nomeOriginal}' importado de ${specBruto}, mas não é exportado por ${path.relative(RAIZ, destino)}`,
            });
          }
        }
      }
    }

    // 2. import "./efeito-colateral.mjs"
    const regexSideEffect = /\bimport\s+["'](\.[^"']+)["']/g;
    while ((m = regexSideEffect.exec(codigo)) !== null) {
      const spec = m[1].split(/[?#]/)[0];
      const destino = path.resolve(path.dirname(modulo), spec);
      if (!fs.existsSync(destino)) {
        erros.push({ origem: rel, tipo: "import_inexistente", detalhe: `${m[1]} não encontrado` });
      }
    }
  }

  return { totalModulos: modulos.size, erros };
}

function verificarReferenciasLocais() {
  const faltando = [];
  const regexAtributo = /\b(?:src|href)="([^"]+)"/g;

  for (const htmlFile of PAGINAS_HTML) {
    const caminhoHtml = path.join(RAIZ, htmlFile);
    if (!fs.existsSync(caminhoHtml)) continue;
    const conteudo = fs.readFileSync(caminhoHtml, "utf8");
    let match;
    while ((match = regexAtributo.exec(conteudo)) !== null) {
      const ref = match[1];
      if (/^(?:https?:|mailto:|data:|#|\/api\/)/.test(ref)) continue;
      const semQuery = ref.split(/[?#]/)[0];
      if (!semQuery) continue;
      const destino = path.resolve(RAIZ, semQuery);
      if (!fs.existsSync(destino)) {
        faltando.push({ origem: htmlFile, referencia: ref });
      }
    }
  }

  const caminhoFicha = path.join(RAIZ, "src", "tierlist-ficha.mjs");
  if (fs.existsSync(caminhoFicha)) {
    const conteudo = fs.readFileSync(caminhoFicha, "utf8");
    const regexRetrato = /"((?:warrior|cleric|archer)\/[^"]+\.png)"/g;
    let m;
    while ((m = regexRetrato.exec(conteudo)) !== null) {
      const destino = path.join(RAIZ, "exports", "herois", m[1]);
      if (!fs.existsSync(destino)) {
        faltando.push({ origem: "src/tierlist-ficha.mjs", referencia: `exports/herois/${m[1]}` });
      }
    }
  }

  return faltando;
}

function checarOuAtualizarCacheBust(alterados, aplicar) {
  const alteradosSet = new Set(alterados);
  const agora = new Date();
  const hoje = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
  ].join("");

  const pendentes = [];
  const atualizados = [];

  for (const htmlFile of PAGINAS_HTML) {
    const caminhoHtml = path.join(RAIZ, htmlFile);
    if (!fs.existsSync(caminhoHtml)) continue;
    const original = fs.readFileSync(caminhoHtml, "utf8");
    let modificado = original;

    const regexRef = /\b(src|href)="([^"?#]+\.(?:js|mjs|css))(\?v=(\d{8})([a-z]))?"/g;
    modificado = original.replace(regexRef, (completo, attr, arquivo, query, dataAnt, letraAnt) => {
      const normalizado = arquivo.replace(/^\.\//, "");
      if (!alteradosSet.has(normalizado)) return completo;
      if (!query) return completo;
      let novaVersao = `${hoje}a`;
      if (dataAnt === hoje && letraAnt) {
        const prox = String.fromCharCode(Math.min(122, letraAnt.charCodeAt(0) + 1));
        novaVersao = `${hoje}${prox}`;
      }
      if (!aplicar) {
        pendentes.push({ html: htmlFile, arquivo: normalizado, atual: `${dataAnt}${letraAnt}`, sugerido: novaVersao });
        return completo;
      }
      atualizados.push({ html: htmlFile, arquivo: normalizado, de: `${dataAnt}${letraAnt}`, para: novaVersao });
      return `${attr}="${arquivo}?v=${novaVersao}"`;
    });

    if (aplicar && modificado !== original) {
      fs.writeFileSync(caminhoHtml, modificado, "utf8");
    }
  }

  return { pendentes, atualizados };
}

function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const alterados = listarArquivosAlteradosGit();
  const faltando = verificarReferenciasLocais();
  const grafoModulos = verificarImportsEExportsModulos();
  const cacheBust = checarOuAtualizarCacheBust(alterados, opcoes.atualizarCacheBust);

  let testesUnitariosOk = null;
  let testesE2eOk = null;

  if (!opcoes.semTestes) {
    try {
      execFileSync("npm", ["test"], { stdio: opcoes.json ? "pipe" : "inherit" });
      testesUnitariosOk = true;
    } catch {
      testesUnitariosOk = false;
    }
    if (opcoes.comE2e && testesUnitariosOk) {
      try {
        execFileSync("npm", ["run", "test:e2e"], { stdio: opcoes.json ? "pipe" : "inherit" });
        testesE2eOk = true;
      } catch {
        testesE2eOk = false;
      }
    }
  }

  const problemas =
    faltando.length > 0 ||
    grafoModulos.erros.length > 0 ||
    testesUnitariosOk === false ||
    testesE2eOk === false;

  if (opcoes.json) {
    console.log(JSON.stringify({
      arquivosAlterados: alterados.length,
      referenciasFaltando: faltando,
      modulosVerificados: grafoModulos.totalModulos,
      errosModulos: grafoModulos.erros,
      cacheBust,
      testesUnitariosOk,
      testesE2eOk,
      ok: !problemas,
    }, null, 2));
  } else {
    console.log("\n=== Verificação de Release ===");
    console.log(`Arquivos alterados no Git: ${alterados.length}`);
    if (faltando.length === 0) {
      console.log("✅ Todas as referências locais em HTML/JS existem no disco.");
    } else {
      console.log(`❌ ${faltando.length} referência(s) local(is) ausente(s):`);
      for (const f of faltando) console.log(`  - ${f.origem}: ${f.referencia}`);
    }
    if (grafoModulos.erros.length === 0) {
      console.log(`✅ Imports e exports validados em ${grafoModulos.totalModulos} módulo(s) .mjs.`);
    } else {
      console.log(`❌ ${grafoModulos.erros.length} erro(s) de import/export em módulos .mjs:`);
      for (const e of grafoModulos.erros) console.log(`  - ${e.origem} [${e.tipo}]: ${e.detalhe}`);
    }
    if (cacheBust.atualizados.length) {
      console.log(`🔄 Cache-bust atualizado (${cacheBust.atualizados.length}):`);
      for (const item of cacheBust.atualizados) {
        console.log(`  - ${item.html} -> ${item.arquivo} (${item.de} → ${item.para})`);
      }
    } else if (cacheBust.pendentes.length) {
      console.log(`⚠️ ${cacheBust.pendentes.length} arquivo(s) alterado(s) com ?v=... ainda sem bump (rode com --atualizar-cache-bust):`);
      for (const item of cacheBust.pendentes) {
        console.log(`  - ${item.html} -> ${item.arquivo} (atual: ${item.atual}, sugerido: ${item.sugerido})`);
      }
    } else {
      console.log("✅ Nenhum cache-bust pendente para arquivos modificados.");
    }
    if (testesUnitariosOk !== null) {
      console.log(testesUnitariosOk ? "✅ Testes unitários passaram." : "❌ Testes unitários falharam.");
    }
    if (testesE2eOk !== null) {
      console.log(testesE2eOk ? "✅ Testes E2E (Playwright) passaram." : "❌ Testes E2E falharam.");
    }
  }

  if (problemas) process.exitCode = 1;
}

main();
