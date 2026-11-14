#!/usr/bin/env python3
"""Suíte de testes de integração do RiftInfos contra as APIs públicas do RiftStream."""

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DIRETORIO_BASE = os.path.dirname(os.path.abspath(__file__))
URL_API_BASE = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com"
URL_SITE_JOGO = "https://riftstream.com.br/"
BUNDLE_REFERENCIA = "index-CXlW0_-D.js"

def requisicao_http(url, timeout=12):
    """Executa GET HTTP retornando (status, corpo_texto, headers)."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "RiftInfos-Integracao/1.0",
            "Accept": "application/json,text/html,application/javascript,*/*",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace"), dict(resp.headers)
    except urllib.error.HTTPError as err:
        corpo = err.read().decode("utf-8", errors="replace") if err.fp else ""
        return err.code, corpo, dict(err.headers or {})


def buscar_json(caminho, base=URL_API_BASE):
    """Obtém JSON de um endpoint retornando (status, objeto_ou_none)."""
    status, corpo, _ = requisicao_http(f"{base}{caminho}")
    if not corpo:
        return status, None
    try:
        return status, json.loads(corpo)
    except json.JSONDecodeError:
        return status, None


def calcular_fc_no_simulador(perfil):
    script = """
import { readFileSync } from "node:fs";
import { calcularFc, calcularStatusSimulados, inferirAtributosBase } from "./src/combate.mjs";

const perfil = JSON.parse(readFileSync(0, "utf8"));
const { cls, level, equipped } = perfil;
const atributos = inferirAtributosBase(perfil);
const stats = calcularStatusSimulados(cls, level, atributos, equipped);
console.log(calcularFc(cls, stats));
"""
    processo = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=DIRETORIO_BASE,
        input=json.dumps(perfil),
        capture_output=True,
        text=True,
        timeout=10,
        check=True,
    )
    return int(processo.stdout)


class ExecutorTestes:
    """Agrupa e executa verificações registrando falhas e avisos."""

    def __init__(self):
        self.passaram = 0
        self.falharam = 0
        self.avisos = []
        self.contexto = {}

    def afirmar(self, condicao, descricao, detalhe=""):
        if condicao:
            self.passaram += 1
            print(f"  [OK] {descricao}")
        else:
            self.falharam += 1
            msg = f"  [FALHA] {descricao}" + (f" -> {detalhe}" if detalhe else "")
            print(msg)

    def avisar(self, mensagem):
        self.avisos.append(mensagem)
        print(f"  [AVISO] {mensagem}")


def executar_suite_saude_e_globais(ex):
    print("\n1. Saúde da API e Endpoints Globais")
    status_h, corpo_h, _ = requisicao_http(f"{URL_API_BASE}/health")
    ex.afirmar(status_h == 200, "GET /health responde HTTP 200", f"HTTP {status_h}: {corpo_h[:100]}")

    status_rec, records = buscar_json("/api/ranking/records")
    ex.afirmar(status_rec == 200 and isinstance(records, dict), "GET /api/ranking/records retorna JSON", f"HTTP {status_rec}")
    if isinstance(records, dict):
        campos = ["totalPlayers", "playersNow", "bestRun", "topCharacter", "totalGoldInGame"]
        faltantes = [c for c in campos if c not in records]
        ex.afirmar(not faltantes, "Schema de /api/ranking/records completo", f"Faltando: {faltantes}")

    status_wiki, wiki = buscar_json("/api/wiki")
    ex.afirmar(
        status_wiki == 200 and isinstance(wiki, dict) and "fuseImmortalChance" in wiki and "fuseArcaneChance" in wiki,
        "GET /api/wiki retorna parâmetros oficiais de forja",
        f"HTTP {status_wiki}",
    )

    status_chg, changelog = buscar_json("/api/changelog")
    ex.afirmar(
        status_chg == 200 and isinstance(changelog, dict) and isinstance(changelog.get("entries"), list) and len(changelog["entries"]) > 0,
        "GET /api/changelog retorna lista de atualizações",
        f"HTTP {status_chg}",
    )

    status_not, notices = buscar_json("/api/notices")
    ex.afirmar(status_not == 200 and isinstance(notices, list), "GET /api/notices retorna lista válida", f"HTTP {status_not}")

    # Endpoints autenticados devem permanecer protegidos (401/403)
    status_shop, _ = buscar_json("/api/shop")
    ex.afirmar(status_shop in (401, 403), "GET /api/shop exige autenticação (401/403)", f"HTTP {status_shop}")


def executar_suite_rankings_e_lives(ex):
    print("\n2. Rankings, Lives Online e Sala do Canal")
    status_runs, runs = buscar_json("/api/ranking/runs?page=1&size=20&online=true")
    ex.afirmar(status_runs == 200 and isinstance(runs, dict), "GET /api/ranking/runs?online=true responde HTTP 200")
    lives = runs.get("items") if isinstance(runs, dict) else []
    ex.afirmar(isinstance(lives, list), "Lista de lives online presente")

    canal_teste = lives[0]["login"] if lives else "belky"
    status_ch, canal = buscar_json(f"/api/ranking/channel/{urllib.parse.quote(canal_teste)}")
    ex.afirmar(
        status_ch == 200 and isinstance(canal, dict) and "bestZone" in canal and "playersNow" in canal,
        f"GET /api/ranking/channel/{canal_teste} retorna estado da sala",
        f"HTTP {status_ch}",
    )

    status_bd, board = buscar_json(f"/api/ranking/channel/{urllib.parse.quote(canal_teste)}/board?board=now&page=1&size=25")
    ex.afirmar(
        status_bd == 200 and isinstance(board, dict) and isinstance(board.get("items"), list) and "total" in board,
        f"GET /api/ranking/channel/{canal_teste}/board?board=now retorna contrato paginado",
        f"HTTP {status_bd}",
    )

    top_por_classe = {}
    for cls in ("warrior", "cleric", "archer"):
        st_cls, rank_cls = buscar_json(f"/api/ranking/characters?page=1&size=5&cls={cls}")
        items = (rank_cls or {}).get("items") if isinstance(rank_cls, dict) else []
        ex.afirmar(st_cls == 200 and len(items) > 0, f"GET /api/ranking/characters?cls={cls} retorna Top players")
        if items:
            top_por_classe[cls] = items[0]
    ex.contexto["top_por_classe"] = top_por_classe


def executar_suite_perfis_e_matematica(ex):
    print("\n3 & 4. Schemas de Perfil (Twitch/Kick) e Fidelidade Matemática de FC")
    top_por_classe = ex.contexto.get("top_por_classe") or {}
    kick_testado = False

    for cls in ("warrior", "cleric", "archer"):
        candidato = top_por_classe.get(cls, {})
        login = candidato.get("login") or {"warrior": "otaldojorginho", "cleric": "shulalino", "archer": "isabxf"}[cls]
        if login.startswith("kick:"):
            kick_testado = True

        st, perfil = buscar_json(f"/api/profile/{urllib.parse.quote(login)}?cls={cls}")
        ex.afirmar(st == 200 and isinstance(perfil, dict), f"GET /api/profile/{login}?cls={cls} retorna HTTP 200", f"HTTP {st}")
        if not isinstance(perfil, dict):
            continue

        stats = perfil.get("stats") or {}
        counters = perfil.get("counters") or {}
        ex.afirmar(
            all(k in stats for k in ("atk", "def", "maxHp", "aspd", "crit", "critDmg")),
            f"Perfil {login} ({cls}) possui todos os stats esperados",
        )
        ex.afirmar(
            "fuse_epic_try" in counters and isinstance(perfil.get("equipped"), list),
            f"Perfil {login} ({cls}) possui counters de forja e lista equipped",
        )

        try:
            fc_calc = calcular_fc_no_simulador(perfil)
        except FileNotFoundError:
            ex.avisar("Node.js não encontrado. Não foi possível validar o cálculo de FC.")
            continue
        except (subprocess.SubprocessError, ValueError) as erro:
            ex.afirmar(False, f"Cálculo de FC no simulador para {login} ({cls})", str(erro))
            continue
        fc_api = float(perfil.get("power") or 0)
        erro_rel = abs(fc_calc - fc_api) / max(1.0, fc_api)
        ex.afirmar(
            erro_rel <= 0.002,
            f"Fidelidade de FC para {login} ({cls}): API={int(fc_api)} vs Calc={fc_calc} (erro {erro_rel*100:.3f}%)",
            f"Diferença acima de 0.2%: API={fc_api}, Calc={fc_calc}",
        )

    if not kick_testado:
        st_k, perfil_k = buscar_json(f"/api/profile/{urllib.parse.quote('kick:jeck-360')}")
        ex.afirmar(st_k == 200 and isinstance(perfil_k, dict), "Consulta com prefixo kick: (kick:jeck-360) funciona", f"HTTP {st_k}")

    st_404, _ = buscar_json("/api/profile/__usuario_inexistente_riftinfos_999__")
    ex.afirmar(st_404 == 404, "Usuário inexistente retorna HTTP 404 corretamente", f"HTTP {st_404}")


def executar_suite_bundle_jogo(ex):
    print("\n5. Monitor de Patch e Auditoria de Fórmulas no Bundle Oficial")
    st_html, html, _ = requisicao_http(URL_SITE_JOGO)
    ex.afirmar(st_html == 200 and "<html" in html.lower(), "Site oficial riftstream.com.br acessível (HTTP 200)", f"HTTP {st_html}")

    match_asset = re.search(r"/assets/(index-[A-Za-z0-9_-]+\.js)", html)
    ex.afirmar(bool(match_asset), "Tag do bundle JS principal encontrada no HTML oficial")
    if not match_asset:
        return

    nome_bundle = match_asset.group(1)
    if nome_bundle != BUNDLE_REFERENCIA:
        ex.avisar(
            f"NOVA VERSÃO DO JOGO DETECTADA! Referência={BUNDLE_REFERENCIA} -> Atual={nome_bundle}. "
            "Vale revisar o bundle para novos sets/armas/correções."
        )
    else:
        print(f"  [INFO] Versão do bundle inalterada: {nome_bundle}")

    st_js, js_bundle, _ = requisicao_http(f"{URL_SITE_JOGO}assets/{nome_bundle}", timeout=20)
    ex.afirmar(st_js == 200 and len(js_bundle) > 50000, f"Download do bundle {nome_bundle} concluído", f"HTTP {st_js}")
    if st_js != 200:
        return

    passiva = re.search(r"imHit\([^)]*\)\{([^}]+)\}", js_bundle)
    inicio_ciclo = js_bundle.find("immortalTick(e,a){")
    ciclo = js_bundle[inicio_ciclo:inicio_ciclo + 5500] if inicio_ciclo != -1 else ""
    ex.afirmar(
        passiva is not None
        and ".rollDamage(" in passiva[1]
        and len(re.findall(r"this\.imHit\(", ciclo)) >= 11,
        "Passivas de dano Imortais e Arcanas ainda usam a rolagem de dano",
        "O bundle mudou o fluxo de dano das passivas. Confira antes de atualizar o modelo.",
    )

    ex.afirmar("healPower(" in js_bundle and "singPctBoss:" in js_bundle, "Constantes esperadas (healPower, singPctBoss) presentes no bundle")


def executar_suite_local(ex, com_servidor=False):
    print("\n6. Integridade Local (Sintaxe JS, HTML/JS IDs e Proxy)")
    caminho_html = os.path.join(DIRETORIO_BASE, "index.html")
    caminho_js = os.path.join(DIRETORIO_BASE, "app.mjs")
    caminho_css = os.path.join(DIRETORIO_BASE, "style.css")

    ex.afirmar(os.path.isfile(caminho_html) and os.path.isfile(caminho_js) and os.path.isfile(caminho_css), "Arquivos index.html, style.css e app.mjs existem")

    arquivos_js = [Path(caminho_js), *sorted((Path(DIRETORIO_BASE) / "src").rglob("*.mjs"))]

    # Checa sintaxe e execução inicial JS com node se disponível
    try:
        erros_sintaxe = []
        for arquivo in arquivos_js:
            proc = subprocess.run(["node", "--check", str(arquivo)], capture_output=True, text=True, timeout=10)
            if proc.returncode:
                erros_sintaxe.append(proc.stderr.strip())
        ex.afirmar(not erros_sintaxe, "Validação sintática dos módulos JavaScript", "\n".join(erros_sintaxe))

        script_smoke = """
const { pathToFileURL } = require("node:url");
const { createRequire } = require("node:module");
function makeEl(id = "") {
  return {
    id, value: "", hidden: false, disabled: false, textContent: "", innerHTML: "", placeholder: "",
    dataset: {}, style: {}, classList: { toggle(){}, add(){}, remove(){} }, options: [],
    setAttribute(){}, removeAttribute(){}, addEventListener(){}, appendChild(){}, replaceChildren(){},
    querySelector: () => makeEl(), querySelectorAll: () => [], contains: () => false,
  };
}
global.window = { location: { href: "https://riftinfo.netlify.app/", protocol: "https:", search: "" }, history: { replaceState(){} }, scrollTo(){} };
global.HTMLElement = function(){};
global.Option = function(t, v){ this.text = t; this.value = v; };
global.document = { querySelector: (s) => makeEl(s), querySelectorAll: () => [], createElement: () => makeEl(), addEventListener(){} };
global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ items: [] }) });
const entrada = pathToFileURL(process.argv[1]);
const carregar = createRequire(entrada);
Object.assign(window, {
  RiftExplicacoes: carregar("./explicacoes.js"),
  RiftAnalise: carregar("./analise.js"),
  RiftHistorico: carregar("./historico.js"),
  RiftCompartilhamento: carregar("./compartilhamento.js"),
});
(async () => {
  await import(entrada);
  const { popularSeletorItensRadar } = await import(new URL("./src/radar.mjs", entrada));
  for (const classe of ["warrior", "cleric", "archer", ""]) popularSeletorItensRadar(classe);
})().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
"""
        proc_exec = subprocess.run(["node", "-e", script_smoke, caminho_js], capture_output=True, text=True, timeout=10)
        ex.afirmar(
            proc_exec.returncode == 0,
            "Execução inicial de app.mjs (Simulador, Monstros e Radar) sem ReferenceError/TypeError",
            proc_exec.stderr.strip(),
        )
    except FileNotFoundError:
        ex.avisar("Node.js não encontrado no PATH; validação 'node' ignorada.")

    # Confere IDs consultados pelos módulos, incluindo os gerados pelos templates.
    with open(caminho_html, "r", encoding="utf-8") as f:
        html_txt = f.read()
    js_txt = "\n".join(arquivo.read_text(encoding="utf-8") for arquivo in arquivos_js)

    ids_html = set(re.findall(r'\bid="([^"]+)"', html_txt))
    ids_dinamicos_js = set(re.findall(r'id="([a-zA-Z0-9_-]+)"', js_txt))
    ids_js = set(re.findall(r'querySelector\("#([^"]+)"\)', js_txt))
    ids_faltando = sorted(ids_js - (ids_html | ids_dinamicos_js))
    ex.afirmar(not ids_faltando, "Todos os IDs consultados pelos módulos existem em index.html (ou template JS)", f"Faltando: {ids_faltando}")

    if com_servidor:
        proc_srv = subprocess.Popen(
            [sys.executable, os.path.join(DIRETORIO_BASE, "servidor.py")],
            cwd=DIRETORIO_BASE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            pronto = False
            for _ in range(25):
                try:
                    st_l, _, _ = requisicao_http("http://127.0.0.1:4173/index.html", timeout=2)
                    if st_l == 200:
                        pronto = True
                        break
                except Exception:
                    pass
                time.sleep(0.2)

            ex.afirmar(pronto, "servidor.py respondeu http://127.0.0.1:4173/index.html com HTTP 200")
            if pronto:
                st_proxy, recs_proxy = buscar_json("/api/ranking/records", base="http://127.0.0.1:4173")
                ex.afirmar(
                    st_proxy == 200 and isinstance(recs_proxy, dict) and "playersNow" in recs_proxy,
                    "Proxy local /api/ranking/records via servidor.py funciona",
                    f"HTTP {st_proxy}",
                )
        finally:
            proc_srv.terminate()
            proc_srv.wait(timeout=5)


def main():
    parser = argparse.ArgumentParser(description="Testes de integração do RiftInfos.")
    parser.add_argument("--com-servidor", action="store_true", help="Sobe servidor.py temporariamente para testar proxy HTTP local.")
    args = parser.parse_args()

    print("=== RiftInfos · Testes de Integração ===")
    ex = ExecutorTestes()

    executar_suite_saude_e_globais(ex)
    executar_suite_rankings_e_lives(ex)
    executar_suite_perfis_e_matematica(ex)
    executar_suite_bundle_jogo(ex)
    executar_suite_local(ex, com_servidor=args.com_servidor)

    print("\n=== Resumo ===")
    print(f"Passaram: {ex.passaram} | Falharam: {ex.falharam} | Avisos: {len(ex.avisos)}")
    for av in ex.avisos:
        print(f" * {av}")

    sys.exit(0 if ex.falharam == 0 else 1)


if __name__ == "__main__":
    main()

