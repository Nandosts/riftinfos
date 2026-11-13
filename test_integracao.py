#!/usr/bin/env python3
"""Suíte de testes de integração do RiftInfos contra as APIs públicas do RiftStream."""

import argparse
import json
import math
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DIRETORIO_BASE = os.path.dirname(os.path.abspath(__file__))
URL_API_BASE = "https://z6ywq6r3ub.execute-api.us-east-1.amazonaws.com"
URL_SITE_JOGO = "https://riftstream.com.br/"
BUNDLE_REFERENCIA = "index-Bw4Xm9JJ.js"

DADOS_CLASSES = {
    "warrior": {
        "k": 0.6,
        "base": {"hp": 120.0, "atk": 9.0, "def": 4.0, "aspd": 0.95},
        "growth": {"hp": 19.0, "atk": 1.6, "def": 1.1},
    },
    "cleric": {
        "k": 0.84,
        "base": {"hp": 85.0, "atk": 6.0, "def": 2.0, "aspd": 0.8},
        "growth": {"hp": 9.0, "atk": 1.1, "def": 0.5},
    },
    "archer": {
        "k": 0.75,
        "base": {"hp": 70.0, "atk": 11.0, "def": 1.5, "aspd": 1.1},
        "growth": {"hp": 8.0, "atk": 1.9, "def": 0.4},
    },
}

BONUS_CONJUNTOS = {
    "berserker": ({"atk": 0.12}, {"hp": 0.15, "crit": 6}),
    "lunar": ({"hp": 0.12, "def": 0.1}, {"atk": 0.15, "spd": 0.1}),
    "wind": ({"atk": 0.1, "spd": 0.05}, {"crit": 6, "spd": 0.1}),
    "volcano": ({"atk": 0.15, "def": 0.1}, {"hp": 0.2, "atk": 0.12, "crit": 5}),
    "reaperset": ({"atk": 0.1, "crit": 6}, {"atk": 0.2, "spd": 0.1}),
    "dawn": ({"hp": 0.18, "def": 0.1}, {"atk": 0.25, "hp": 0.12}),
    "abyss": ({"atk": 0.15, "crit": 5}, {"atk": 0.2, "spd": 0.12}),
    "stellar": ({"atk": 0.12, "spd": 0.08}, {"crit": 8, "atk": 0.15}),
    "cosmicvan": ({"atk": 0.1, "def": 0.08}, {"hp": 0.15, "atk": 0.1}),
    "oracle": ({"hp": 0.12, "atk": 0.08}, {"atk": 0.15, "spd": 0.1}),
    "etehunter": ({"atk": 0.1, "crit": 5}, {"crit": 8, "spd": 0.1}),
    "prism": ({"atk": 0.12, "crit": 6}, {"hp": 0.1, "atk": 0.2, "spd": 0.1}),
    "ember": ({"hp": 0.2, "def": 0.15}, {"atk": 0.3, "hp": 0.25}),
    "gore": ({"atk": 0.25, "crit": 8}, {"atk": 0.4, "spd": 0.15}),
    "echo": ({"hp": 0.2, "atk": 0.15}, {"atk": 0.35, "spd": 0.2}),
    "communion": ({"hp": 0.25, "def": 0.15}, {"atk": 0.3, "hp": 0.25}),
    "predator": ({"atk": 0.2, "crit": 8}, {"atk": 0.3, "crit": 10, "spd": 0.1}),
    "tempest": ({"atk": 0.2, "spd": 0.12}, {"atk": 0.3, "spd": 0.25}),
    "chrono": ({"def": 0.15, "spd": 0.12}, {"atk": 0.3, "spd": 0.2, "hp": 0.15}),
    "singular": ({"atk": 0.25, "crit": 6}, {"atk": 0.4, "hp": 0.2, "crit": 10}),
    "constel": ({"hp": 0.22, "def": 0.15}, {"atk": 0.3, "hp": 0.25, "spd": 0.1}),
    "worldtree": ({"hp": 0.3, "atk": 0.1}, {"atk": 0.4, "atk": 0.25}),
    "luna": ({"atk": 0.22, "spd": 0.1}, {"atk": 0.35, "crit": 8, "spd": 0.1}),
    "dragon": ({"atk": 0.2, "crit": 8}, {"atk": 0.4, "hp": 0.15, "crit": 10}),
    "tamer": ({"atk": 0.3, "hp": 0.2}, {"atk": 0.55, "hp": 0.25, "spd": 0.15}),
    "strongman": ({"hp": 0.35, "def": 0.25}, {"atk": 0.5, "hp": 0.4, "crit": 10}),
    "illusion": ({"hp": 0.3, "atk": 0.25}, {"atk": 0.5, "hp": 0.3, "spd": 0.2}),
    "fortune": ({"hp": 0.35, "def": 0.2}, {"atk": 0.35, "hp": 0.55}),
    "trapeze": ({"atk": 0.3, "spd": 0.15}, {"atk": 0.5, "crit": 12, "spd": 0.25}),
    "firework": ({"atk": 0.3, "crit": 10}, {"atk": 0.6, "crit": 15, "hp": 0.15}),
    "obsidian": ({"hp": 0.3, "def": 0.3}, {"atk": 0.45, "hp": 0.45, "def": 0.15}),
    "thunderlord": ({"atk": 0.35, "crit": 10}, {"atk": 0.6, "crit": 15, "spd": 0.15}),
    "seraphgold": ({"hp": 0.35, "atk": 0.25}, {"hp": 0.55, "atk": 0.4, "spd": 0.1}),
    "eclipsepriest": ({"atk": 0.3, "def": 0.2}, {"atk": 0.55, "hp": 0.3, "spd": 0.2}),
    "auroraborealis": ({"atk": 0.25, "spd": 0.2}, {"atk": 0.45, "spd": 0.2, "hp": 0.2}),
    "abysshunter": ({"atk": 0.35, "crit": 12}, {"atk": 0.6, "crit": 18, "hp": 0.1}),
}


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


def inferir_e_calcular_fc(perfil):
    """Replica exatamente inferirAtributosBase + calcularStatusSimulados + calcularFc do app.js."""
    cls = perfil["cls"]
    dados = DADOS_CLASSES[cls]
    nivel = perfil["level"]
    r = max(0, nivel - 1)
    st = perfil["stats"]

    fixos = {"atk": 0.0, "def": 0.0, "hp": 0.0, "crit": 0.0, "spd": 0.0}
    gemas_fixas = {"atk": 0.0, "def": 0.0, "hp": 0.0, "crit": 0.0, "spd": 0.0}
    gemas_pct = {"atk": 0.0, "def": 0.0, "hp": 0.0, "crit": 0.0, "spd": 0.0}
    contagem_sets = {}

    for item in perfil.get("equipped") or []:
        if not item or item.get("slot") == "cosmetic":
            continue
        for k in fixos:
            fixos[k] += float(item.get(k) or 0)
        s = item.get("set")
        if s:
            contagem_sets[s] = contagem_sets.get(s, 0) + 1
        for gema in item.get("gems") or []:
            for k_stat, k_val, k_pct in [("stat", "value", "pct"), ("stat2", "value2", "pct2")]:
                gs = gema.get(k_stat)
                gv = float(gema.get(k_val) or 0)
                if gs in fixos:
                    if gema.get(k_pct):
                        gemas_pct[gs] += gv
                    else:
                        gemas_fixas[gs] += gv

    mult_sets = {"atk": 1.0, "def": 1.0, "hp": 1.0, "spd": 1.0}
    crit_set = 0.0
    for chave_set, qtd in contagem_sets.items():
        if chave_set not in BONUS_CONJUNTOS:
            continue
        b2, b3 = BONUS_CONJUNTOS[chave_set]
        if qtd >= 2:
            for k in mult_sets:
                mult_sets[k] *= 1.0 + b2.get(k, 0.0)
            crit_set += b2.get("crit", 0.0)
        if qtd >= 3:
            for k in mult_sets:
                mult_sets[k] *= 1.0 + b3.get(k, 0.0)
            crit_set += b3.get("crit", 0.0)

    def resolver_quad(base, ganho, mult, alvo):
        a = 0.015 * ganho
        b = ganho + 0.015 * base
        c = base - alvo / max(0.0001, mult)
        disc = max(0.0, b * b - 4 * a * c)
        x = (-b + math.sqrt(disc)) / (2 * a)
        return max(0, round(x))

    forca = resolver_quad(
        dados["base"]["atk"] + dados["growth"]["atk"] * r + fixos["atk"] + gemas_fixas["atk"],
        1.5,
        mult_sets["atk"] * (1.0 + gemas_pct["atk"] / 1000.0),
        st["atk"],
    )
    vit = resolver_quad(
        dados["base"]["hp"] + dados["growth"]["hp"] * r + fixos["hp"] + gemas_fixas["hp"],
        10.0,
        mult_sets["hp"] * (1.0 + gemas_pct["hp"] / 1000.0),
        st["maxHp"],
    )
    defesa = resolver_quad(
        dados["base"]["def"] + dados["growth"]["def"] * r + fixos["def"] + gemas_fixas["def"],
        0.8,
        mult_sets["def"] * (1.0 + gemas_pct["def"] / 1000.0),
        st["def"],
    )
    spd_mult = (1.0 + (fixos["spd"] + gemas_fixas["spd"]) / 100.0) * mult_sets["spd"]
    agi = max(0, round(((st["aspd"] / (dados["base"]["aspd"] * spd_mult)) - 1.0) / 0.02))
    crit_total = st["crit"] + (st.get("critDmg") or 0.0) / 0.03
    luk = max(0, round((crit_total - 5.0 - fixos["crit"] - gemas_fixas["crit"] - crit_set) / 0.4))

    atk_sim = round(
        (dados["base"]["atk"] + dados["growth"]["atk"] * r + forca * 1.5 + fixos["atk"] + gemas_fixas["atk"])
        * (1.0 + forca * 0.015)
        * mult_sets["atk"]
        * (1.0 + gemas_pct["atk"] / 1000.0)
        * 10
    ) / 10.0
    hp_sim = round(
        (dados["base"]["hp"] + dados["growth"]["hp"] * r + vit * 10.0 + fixos["hp"] + gemas_fixas["hp"])
        * (1.0 + vit * 0.015)
        * mult_sets["hp"]
        * (1.0 + gemas_pct["hp"] / 1000.0)
    )
    def_sim = round(
        (dados["base"]["def"] + dados["growth"]["def"] * r + defesa * 0.8 + fixos["def"] + gemas_fixas["def"])
        * (1.0 + defesa * 0.015)
        * mult_sets["def"]
        * (1.0 + gemas_pct["def"] / 1000.0)
        * 10
    ) / 10.0
    aspd_sim = round(
        dados["base"]["aspd"]
        * (1.0 + agi * 0.02)
        * (1.0 + (fixos["spd"] + gemas_fixas["spd"]) / 100.0)
        * mult_sets["spd"]
        * 100
    ) / 100.0
    crit_bruto = 5.0 + luk * 0.4 + fixos["crit"] + gemas_fixas["crit"] + crit_set
    crit_sim = min(60.0, round(crit_bruto * 10) / 10.0)
    crit_dmg_sim = round(max(0.0, crit_bruto - 60.0) * 0.03 * 1000) / 1000.0

    dps = atk_sim * aspd_sim * (1.0 + (crit_sim / 100.0) * (0.5 + crit_dmg_sim))
    ehp = hp_sim * (1.0 + def_sim * 0.04)
    fc_sim = round(dados["k"] * math.sqrt(max(0.0, dps * ehp)))
    return fc_sim, {"str": forca, "vit": vit, "def": defesa, "agi": agi, "luk": luk}


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

        fc_calc, _ = inferir_e_calcular_fc(perfil)
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

    # Checa se o bug conhecido em immortalTick ainda está presente ou foi corrigido pelo dev
    pos_immortal = js_bundle.find("immortalTick(e,a){")
    if pos_immortal == -1:
        pos_immortal = js_bundle.find("immortalTick(")
    if pos_immortal != -1:
        trecho = js_bundle[pos_immortal:pos_immortal + 5500]
        bugs_hit = re.findall(r"this\.hit\([^)]*e\.atk\*[^)]*!1", trecho)
        if bugs_hit:
            print(
                f"  [INFO] Bug conhecido de dano fixo em armas Arcanas ('this.hit(..., e.atk*..., !1)' sem crítico/aspd) "
                f"confirmado ativo em {len(bugs_hit)} trechos de immortalTick."
            )
        else:
            ex.avisar(
                "CORREÇÃO DETECTADA NO JOGO! Não foram encontradas chamadas diretas 'this.hit(..., e.atk*..., !1)' em immortalTick. "
                "Atualize a tag de bug no catalogoArmas de app.js!"
            )

    ex.afirmar("healPower(" in js_bundle and "singPctBoss:" in js_bundle, "Constantes esperadas (healPower, singPctBoss) presentes no bundle")


def executar_suite_local(ex, com_servidor=False):
    print("\n6. Integridade Local (Sintaxe JS, HTML/JS IDs e Proxy)")
    caminho_html = os.path.join(DIRETORIO_BASE, "index.html")
    caminho_js = os.path.join(DIRETORIO_BASE, "app.js")
    caminho_css = os.path.join(DIRETORIO_BASE, "style.css")

    ex.afirmar(os.path.isfile(caminho_html) and os.path.isfile(caminho_js) and os.path.isfile(caminho_css), "Arquivos index.html, style.css e app.js existem")

    # Checa sintaxe JS com node --check se disponível
    try:
        proc = subprocess.run(["node", "--check", caminho_js], capture_output=True, text=True, timeout=10)
        ex.afirmar(proc.returncode == 0, "Validação sintática node --check app.js sem erros", proc.stderr.strip())
    except FileNotFoundError:
        ex.avisar("Node.js não encontrado no PATH; validação 'node --check' ignorada.")

    # Garante que todos os IDs referenciados via #id em app.js existem em index.html
    with open(caminho_html, "r", encoding="utf-8") as f:
        html_txt = f.read()
    with open(caminho_js, "r", encoding="utf-8") as f:
        js_txt = f.read()

    ids_html = set(re.findall(r'\bid="([^"]+)"', html_txt))
    ids_dinamicos_js = set(re.findall(r'id="([a-zA-Z0-9_-]+)"', js_txt))
    ids_js = set(re.findall(r'querySelector\("#([^"]+)"\)', js_txt))
    ids_faltando = sorted(ids_js - (ids_html | ids_dinamicos_js))
    ex.afirmar(not ids_faltando, "Todos os IDs consultados em app.js existem em index.html (ou template JS)", f"Faltando: {ids_faltando}")

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

