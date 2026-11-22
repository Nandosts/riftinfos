import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { obterBundleOficial } from "./lib/bundle_jogo.mjs";

const RAIZ = process.cwd();
const ARQUIVO_PADRAO = path.join(RAIZ, "relatorio-diagnostico.md");

function analisarArgumentos(argv) {
  const opcoes = {
    saida: ARQUIVO_PADRAO,
    bundleLocal: null,
    aplicar: false,
    comE2e: false,
    paginasCurvas: 3,
    maxPerfisCurvas: 150,
    pularCurvas: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--saida=")) opcoes.saida = path.resolve(arg.slice("--saida=".length));
    else if (arg.startsWith("--bundle=")) opcoes.bundleLocal = arg.slice("--bundle=".length);
    else if (arg === "--aplicar") opcoes.aplicar = true;
    else if (arg === "--com-e2e") opcoes.comE2e = true;
    else if (arg === "--pular-curvas") opcoes.pularCurvas = true;
    else if (arg.startsWith("--paginas=")) opcoes.paginasCurvas = Math.max(1, Number(arg.slice("--paginas=".length)) || 3);
    else if (arg.startsWith("--max-perfis=")) opcoes.maxPerfisCurvas = Math.max(10, Number(arg.slice("--max-perfis=".length)) || 150);
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/rodar_diagnostico.mjs [opções]

Executa todos os scripts de manutenção em sequência (reaproveitando o mesmo
download do bundle) e salva um relatório consolidado em Markdown.

Opções:
  --saida=CAMINHO    Caminho do relatório gerado (padrão: relatorio-diagnostico.md)
  --bundle=CAMINHO   Usa um bundle JS local em vez de baixar de riftstream.com.br
  --aplicar          Aplica atualizações de sprites.js/PNGs e cache-bust (padrão: somente diagnóstico)
  --com-e2e          Inclui a suíte Playwright no verificar_release
  --paginas=N        Páginas do ranking na calibração de curvas (padrão: 3)
  --max-perfis=N     Limite de perfis na calibração de curvas (padrão: 150)
  --pular-curvas     Pula a varredura de perfis na API pública`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  return opcoes;
}

function executarEtapa(titulo, scriptRelativo, args) {
  const inicio = Date.now();
  const proc = spawnSync(process.execPath, [path.join(RAIZ, scriptRelativo), ...args], {
    cwd: RAIZ,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const duracaoMs = Date.now() - inicio;
  const saida = [proc.stdout || "", proc.stderr || ""].filter((s) => s.trim()).join("\n").trim();
  const codigo = proc.status ?? 1;
  const status = codigo === 0 ? "OK" : codigo === 2 ? "ALERTA" : "ERRO";
  return { titulo, comando: `node ${scriptRelativo} ${args.join(" ")}`.trim(), status, codigo, duracaoMs, saida };
}

async function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const inicioTotal = Date.now();
  const dataIso = new Date().toISOString();

  console.log("Baixando/carregando bundle oficial do RiftStream...");
  const bundle = await obterBundleOficial(opcoes.bundleLocal);

  const dirTmp = fs.mkdtempSync(path.join(os.tmpdir(), "rift-diag-"));
  const arquivoBundleTmp = path.join(dirTmp, path.basename(bundle.asset) || "bundle.js");
  fs.writeFileSync(arquivoBundleTmp, bundle.codigo, "utf8");

  const etapas = [];
  try {
    const plano = [
      ["1. Verificação de Patch", "scripts/verificar_patch.mjs", [`--bundle=${arquivoBundleTmp}`]],
      ["2. Auditoria de Monstros & Chefes", "scripts/auditar_monstros.mjs", [`--bundle=${arquivoBundleTmp}`]],
      [
        opcoes.aplicar ? "3. Atualização de Sprites e PNGs" : "3. Validação de Sprites e PNGs",
        "scripts/atualizar_sprites.mjs",
        [`--bundle=${arquivoBundleTmp}`, ...(opcoes.aplicar ? [] : ["--validar"])],
      ],
      ...(opcoes.pularCurvas
        ? []
        : [[
            "4. Calibração de Curvas via API Pública",
            "scripts/calibrar_curvas.mjs",
            [`--paginas=${opcoes.paginasCurvas}`, `--max-perfis=${opcoes.maxPerfisCurvas}`],
          ]]),
      [
        "5. Verificação de Release e Testes",
        "scripts/verificar_release.mjs",
        [
          ...(opcoes.aplicar ? ["--atualizar-cache-bust"] : []),
          ...(opcoes.comE2e ? ["--com-e2e"] : []),
        ],
      ],
    ];

    for (const [titulo, script, args] of plano) {
      console.log(`→ Executando: ${titulo}...`);
      const res = executarEtapa(titulo, script, args);
      etapas.push(res);
      const icone = res.status === "OK" ? "✅" : res.status === "ALERTA" ? "⚠️" : "❌";
      console.log(`  ${icone} ${res.status} (${(res.duracaoMs / 1000).toFixed(1)}s)`);
    }
  } finally {
    fs.rmSync(dirTmp, { recursive: true, force: true });
  }

  const duracaoTotalSeg = ((Date.now() - inicioTotal) / 1000).toFixed(1);
  const linhas = [
    "# Relatório de Diagnóstico · RiftInfos",
    "",
    `- **Gerado em:** \`${dataIso}\``,
    `- **Modo:** ${opcoes.aplicar ? "Aplicar atualizações (`--aplicar`)" : "Somente diagnóstico (sem alterar arquivos do projeto)"}`,
    `- **Bundle oficial:** \`${bundle.asset}\` (${bundle.codigo.length.toLocaleString("pt-BR")} bytes)`,
    `- **Duração total:** ${duracaoTotalSeg}s`,
    "",
    "## Resumo",
    "",
    "| Etapa | Status | Tempo |",
    "| --- | :---: | ---: |",
    ...etapas.map((e) => {
      const icone = e.status === "OK" ? "✅ OK" : e.status === "ALERTA" ? "⚠️ ALERTA" : "❌ ERRO";
      return `| ${e.titulo} | ${icone} | ${(e.duracaoMs / 1000).toFixed(1)}s |`;
    }),
    "",
    "---",
    "",
  ];

  for (const e of etapas) {
    linhas.push(`## ${e.titulo}`);
    linhas.push("");
    linhas.push(`- **Status:** ${e.status} (código ${e.codigo})`);
    linhas.push(`- **Duração:** ${(e.duracaoMs / 1000).toFixed(1)}s`);
    linhas.push("");
    linhas.push("```text");
    linhas.push(e.saida || "(sem saída)");
    linhas.push("```");
    linhas.push("");
  }

  fs.writeFileSync(opcoes.saida, linhas.join("\n"), "utf8");
  const relativo = path.relative(RAIZ, opcoes.saida) || opcoes.saida;
  console.log(`\n📄 Relatório salvo em: ${relativo} (${duracaoTotalSeg}s)`);

  if (etapas.some((e) => e.status === "ERRO")) {
    process.exitCode = 1;
  } else if (etapas.some((e) => e.status === "ALERTA")) {
    process.exitCode = 2;
  }
}

main().catch((erro) => {
  console.error("Erro no diagnóstico:", erro.message);
  process.exit(1);
});
