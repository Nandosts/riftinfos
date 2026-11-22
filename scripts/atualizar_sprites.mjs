import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { catalogoAneis, catalogoArmas, catalogoConjuntos } from "../src/dados.mjs";

const RAIZ = process.cwd();
const DIR_EXPORTS = path.join(RAIZ, "exports");
const URL_SITE = "https://riftstream.com.br/";
const ESCALA_PNG = 4;

const NOMES_TEMAS_EXPORT = {
  0: "t00_floresta",
  1: "t01_gelo",
  2: "t02_deserto",
  3: "t03_vulcao",
  4: "t04_pantano",
  5: "t05_eletrico",
  6: "t06_natal",
  7: "t07_cyberpunk",
  8: "t08_espaco",
  9: "t09_cameo",
  10: "t10_circo",
  11: "t11_raid_vexxaris",
  12: "t12_cidade_mecanica",
};

const ARQUIVOS_CACHE_BUST = ["index.html", "tierlist.html"];

function analisarArgumentos(argv) {
  const opcoes = {
    bundleLocal: null,
    somenteSprites: false,
    somentePngs: false,
    comGifs: false,
    semCacheBust: false,
    somenteValidar: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--bundle=")) opcoes.bundleLocal = arg.slice("--bundle=".length);
    else if (arg === "--somente-sprites") opcoes.somenteSprites = true;
    else if (arg === "--somente-pngs") opcoes.somentePngs = true;
    else if (arg === "--com-gifs") opcoes.comGifs = true;
    else if (arg === "--sem-cache-bust") opcoes.semCacheBust = true;
    else if (arg === "--validar") opcoes.somenteValidar = true;
    else if (arg === "--ajuda" || arg === "-h") {
      console.log(`Uso: node scripts/atualizar_sprites.mjs [opções]

Opções:
  --bundle=CAMINHO   Usa um arquivo JS local em vez de baixar de riftstream.com.br
  --somente-sprites  Atualiza apenas sprites.js e o cache-bust nos HTMLs
  --somente-pngs     Exporta apenas os PNGs em exports/ (sem reescrever sprites.js)
  --com-gifs         Também gera GIFs animados (requer ImageMagick / comando "magick")
  --sem-cache-bust   Não altera o parâmetro ?v=... de sprites.js nos HTMLs
  --validar          Extrai e valida em memória sem gravar arquivos em disco`);
      process.exit(0);
    } else {
      throw new Error(`Opção desconhecida: ${arg}`);
    }
  }
  return opcoes;
}

// --- Encoder PNG puro (sem dependências externas) ---
const TABELA_CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  TABELA_CRC[n] = c >>> 0;
}
function calcularCrc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ TABELA_CRC[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}
function criarBlocoPng(tipo, dados) {
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length, 0);
  const nome = Buffer.from(tipo, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calcularCrc32(Buffer.concat([nome, dados])), 0);
  return Buffer.concat([tam, nome, dados, crc]);
}
function escalarRgbaVizinhoMaisProximo(rgba, w, h, escala) {
  if (escala <= 1) return { rgba, w, h };
  const nw = w * escala;
  const nh = h * escala;
  const saida = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const a = rgba[si + 3];
      if (a === 0) continue;
      const r = rgba[si];
      const g = rgba[si + 1];
      const b = rgba[si + 2];
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const di = ((y * escala + dy) * nw + (x * escala + dx)) * 4;
          saida[di] = r;
          saida[di + 1] = g;
          saida[di + 2] = b;
          saida[di + 3] = a;
        }
      }
    }
  }
  return { rgba: saida, w: nw, h: nh };
}
function codificarPng(rgba, w, h, escala = ESCALA_PNG) {
  const esc = escalarRgbaVizinhoMaisProximo(rgba, w, h, escala);
  const bytesLinha = esc.w * 4 + 1;
  const bruto = Buffer.alloc(bytesLinha * esc.h);
  for (let y = 0; y < esc.h; y++) {
    bruto[y * bytesLinha] = 0;
    esc.rgba.copy(bruto, y * bytesLinha + 1, y * esc.w * 4, (y + 1) * esc.w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(esc.w, 0);
  ihdr.writeUInt32BE(esc.h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(bruto, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    criarBlocoPng("IHDR", ihdr),
    criarBlocoPng("IDAT", idat),
    criarBlocoPng("IEND", Buffer.alloc(0)),
  ]);
}
function salvarPngSeAlterado(caminho, rgba, w, h, escala = ESCALA_PNG, somenteValidar = false) {
  const conteudo = codificarPng(rgba, w, h, escala);
  const existe = fs.existsSync(caminho);
  if (existe && fs.readFileSync(caminho).equals(conteudo)) {
    return "inalterado";
  }
  if (!somenteValidar) {
    fs.mkdirSync(path.dirname(caminho), { recursive: true });
    fs.writeFileSync(caminho, conteudo);
  }
  return existe ? "atualizado" : "criado";
}
function criarGifAnimado(caminhoGif, framesRgba, w, h, duracoesSeg, escala = ESCALA_PNG) {
  fs.mkdirSync(path.dirname(caminhoGif), { recursive: true });
  const tmpDir = fs.mkdtempSync("/tmp/riftgif_");
  try {
    const args = ["-dispose", "Background", "-loop", "0"];
    framesRgba.forEach((rgba, idx) => {
      const f = path.join(tmpDir, `f_${String(idx).padStart(3, "0")}.png`);
      fs.writeFileSync(f, codificarPng(rgba, w, h, escala));
      const delay = Math.max(4, Math.round((duracoesSeg[idx] ?? 0.25) * 100));
      args.push("-delay", String(delay), f);
    });
    args.push(caminhoGif);
    execFileSync("magick", args, { stdio: "ignore" });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
function gerarSlug(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// --- Mock mínimo de Canvas 2D para validar e exportar em Node ---
function criarCanvasMock() {
  const canvas = {
    width: 0,
    height: 0,
    _rgba: null,
    getContext() {
      return {
        imageSmoothingEnabled: false,
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
        fillStyle: "#000",
        setTransform() {},
        clearRect() {},
        fillRect() {},
        save() {},
        restore() {},
        createLinearGradient() {
          return { addColorStop() {} };
        },
        drawImage(src) {
          if (src?._rgba) {
            canvas._rgba = Buffer.from(src._rgba);
            canvas.width = src.width;
            canvas.height = src.height;
          }
        },
        createImageData(w, h) {
          return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
        },
        putImageData(img) {
          canvas._rgba = Buffer.from(img.data);
          canvas.width = img.width;
          canvas.height = img.height;
        },
        getImageData(x, y, w, h) {
          const out = new Uint8ClampedArray(w * h * 4);
          if (canvas._rgba) out.set(canvas._rgba.subarray(0, out.length));
          return { data: out, width: w, height: h };
        },
      };
    },
  };
  return canvas;
}
class ImageDataMock {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

async function obterBundleOficial(caminhoLocal) {
  if (caminhoLocal) {
    const resolvido = path.resolve(caminhoLocal);
    return { origem: resolvido, codigo: fs.readFileSync(resolvido, "utf8") };
  }
  const respHtml = await fetch(URL_SITE);
  if (!respHtml.ok) throw new Error(`Falha ao consultar ${URL_SITE}: HTTP ${respHtml.status}`);
  const html = await respHtml.text();
  const matchAsset = html.match(/\/assets\/(index-[^"'\s]+\.js)/);
  if (!matchAsset) throw new Error("Não foi possível localizar /assets/index-*.js no HTML do RiftStream.");
  const urlAsset = `${URL_SITE}assets/${matchAsset[1]}`;
  const respJs = await fetch(urlAsset);
  if (!respJs.ok) throw new Error(`Falha ao baixar ${urlAsset}: HTTP ${respJs.status}`);
  return { origem: urlAsset, codigo: await respJs.text() };
}

function exigirRegex(texto, regex, descricao) {
  const m = texto.match(regex);
  if (!m) throw new Error(`Âncora não encontrada no bundle do jogo: ${descricao}`);
  return m;
}

function extrairConstantesGlobais(codigoBundle, idxAnim) {
  const inicioConst = codigoBundle.lastIndexOf("const ", idxAnim);
  if (inicioConst < 0 || idxAnim - inicioConst > 800) {
    throw new Error("Bloco de constantes de temas/dimensões não encontrado antes das animações.");
  }
  const trecho = codigoBundle.slice(inicioConst, idxAnim);
  const pares = {};
  const regexNum = /(?:^|[,;\s])([A-Za-z_$][A-Za-z0-9_$]*)=(\d+(?:\.\d+)?|\.\d+)(?=[,;\s]|$)/g;
  let m;
  while ((m = regexNum.exec(trecho)) !== null) {
    pares[m[1]] = Number(m[2]);
  }
  return pares;
}

function extrairBlocosDoBundle(bundle) {
  // Bloco 1: Definições de animações
  const matchAnimInicio = exigirRegex(
    bundle,
    /\b([A-Za-z_$][A-Za-z0-9_$]*)=\(t,e\)=>Array\.from\(\{length:t\},\(\)=>e\)/,
    "início do bloco de animações (Array.from)"
  );
  const idxB1Inicio = matchAnimInicio.index;
  const matchAnimFim = exigirRegex(
    bundle.slice(idxB1Inicio, idxB1Inicio + 4000),
    /function\s+[A-Za-z_$][A-Za-z0-9_$]*\(t,e,a\)\{const\s+[A-Za-z_$][A-Za-z0-9_$]*=[A-Za-z_$][A-Za-z0-9_$]*\[t\]\[e\]/,
    "fim do bloco de animações"
  );
  const idxB1Fim = idxB1Inicio + matchAnimFim.index;
  const blocoAnim = "const " + bundle.slice(idxB1Inicio, idxB1Fim);
  const constantesGlobais = extrairConstantesGlobais(bundle, idxB1Inicio);

  // Bloco 2: Motor de pixel art (classe PixelBuffer + conjuntos + gerador de herói)
  const matchB2Inicio = exigirRegex(
    bundle,
    /const\s+[A-Za-z_$][A-Za-z0-9_$]*=t=>\(4278190080\|\(t&255\)<<16/,
    "início do motor de pixel art (4278190080)"
  );
  const idxB2Inicio = matchB2Inicio.index;
  const matchB2Fim = exigirRegex(
    bundle.slice(idxB2Inicio),
    /const\s+[A-Za-z_$][A-Za-z0-9_$]*=\[\{melee:"Esqueleto"/,
    "fim do bloco de conjuntos/heróis (melee:\"Esqueleto\")"
  );
  const idxB2Fim = idxB2Inicio + matchB2Fim.index;
  const blocoHerois = bundle.slice(idxB2Inicio, idxB2Fim);

  // Bloco 3: Sheets de heróis/inimigos + auras e shaders
  const matchB3Inicio = exigirRegex(
    bundle,
    /\b([A-Za-z_$][A-Za-z0-9_$]*)=\{warrior:11,cleric:11,archer:10,skeleton:10,goblin:11,boss:24\}/,
    "início do bloco de sheets e auras (warrior:11)"
  );
  const idxB3Inicio = matchB3Inicio.index;
  const matchB3Fim = exigirRegex(
    bundle.slice(idxB3Inicio),
    /globalCompositeOperation="source-over",t\.drawImage\([^)]+\)\}/,
    "fim do bloco de shaders/auras (source-over)"
  );
  const idxB3Fim = idxB3Inicio + matchB3Fim.index + matchB3Fim[0].length;
  const blocoSheetsAuras = "const " + bundle.slice(idxB3Inicio, idxB3Fim);

  // Motor completo de inimigos (para exportar chefes/lacaios também)
  const blocoMotorCompleto = bundle.slice(idxB2Inicio, idxB3Fim);

  // Bloco 4: Auras de anéis/conjuntos, aparência e catálogos oficiais
  const matchB4Inicio = exigirRegex(
    bundle,
    /const\s+[A-Za-z_$][A-Za-z0-9_$]*=\{ringgold:\{aura:2/,
    "início do bloco de catálogos/aparência (ringgold)"
  );
  const idxB4Inicio = matchB4Inicio.index;
  const matchB4Fim = exigirRegex(
    bundle.slice(idxB4Inicio),
    /function\s+[A-Za-z_$][A-Za-z0-9_$]*\(t\)\{const\s+[A-Za-z_$][A-Za-z0-9_$]*=\{\};for\(const\s+[A-Za-z_$][A-Za-z0-9_$]*\s+of\s+t\)[A-Za-z_$][A-Za-z0-9_$]*\.equipped&&[A-Za-z_$][A-Za-z0-9_$]*\.set/,
    "fim do bloco de catálogos oficiais (contagem de conjuntos)"
  );
  const idxB4Fim = idxB4Inicio + matchB4Fim.index;
  const blocoCatalogos = bundle.slice(idxB4Inicio, idxB4Fim);

  // Bloco 5: Ícones 16x16 de todos os itens
  const matchB5Inicio = exigirRegex(
    bundle,
    /const\s+[A-Za-z_$][A-Za-z0-9_$]*=1314846,[A-Za-z_$][A-Za-z0-9_$]*=16/,
    "início do bloco de ícones 16x16 (1314846,16)"
  );
  const idxB5Inicio = matchB5Inicio.index;
  const matchB5Fim = exigirRegex(
    bundle.slice(idxB5Inicio),
    /function\s+[A-Za-z_$][A-Za-z0-9_$]*\(\{slot:t,cls:e/,
    "fim do bloco de ícones 16x16 (componente de ícone)"
  );
  const idxB5Fim = idxB5Inicio + matchB5Fim.index;
  const blocoIcones = bundle.slice(idxB5Inicio, idxB5Fim);

  // Bloco 6: Ícones de gemas T1..T6
  const matchB6Inicio = exigirRegex(
    bundle,
    /const\s+[A-Za-z_$][A-Za-z0-9_$]*=\{ruby:14690364,sapphire:3111648/,
    "início do bloco de gemas (ruby:14690364)"
  );
  const idxB6Inicio = matchB6Inicio.index;
  const matchB6Fim = exigirRegex(
    bundle.slice(idxB6Inicio),
    /const\s+[A-Za-z_$][A-Za-z0-9_$]*=\["atk","def","hp","crit","spd"\]/,
    "fim do bloco de gemas"
  );
  const idxB6Fim = idxB6Inicio + matchB6Fim.index;
  const blocoGemas = bundle.slice(idxB6Inicio, idxB6Fim);

  // Descoberta dinâmica dos símbolos minificados usados pelo wrapper
  const simbolos = {
    helperCampo: exigirRegex(blocoHerois, /constructor\(e,a\)\{([A-Za-z_$][A-Za-z0-9_$]*)\(this,"w"\)/, "helper de campo de classe")[1],
    mapLendarios: exigirRegex(blocoHerois, /const\s+([A-Za-z_$][A-Za-z0-9_$]*)=\{volcano:\[255,110,30\]/, "mapa de auras lendárias")[1],
    mapImortais: exigirRegex(blocoHerois, /([A-Za-z_$][A-Za-z0-9_$]*)=\{ember:\{rgb:\[255,90,20\]/, "mapa de auras imortais/arcanas")[1],
    fnSpriteHeroi: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e=\{\}\)\{const\s+[A-Za-z_$][A-Za-z0-9_$]*=`h\|/, "função de sprite do herói")[1],
    fnSpriteInimigo: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a=0\)\{if\(e===/, "função de sprite de inimigos")[1],
    fnCorFagulha: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t\)\{return\s+t<\.2\?"#fff3a0"/, "função de cor de fagulha")[1],
    fnAuraAnel: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s,r=2\)\{/, "função de aura de anel")[1],
    fnAuraLendario: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s,r,n\)\{e=Math\.round\(e\);const\s+[A-Za-z_$][A-Za-z0-9_$]*=r\.join\(","\)/, "função de aura lendária")[1],
    fnAuraImortal: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s,r,n\)\{e=Math\.round\(e\);const\s+[A-Za-z_$][A-Za-z0-9_$]*=r\.rgb\.join\(","\)/, "função de aura imortal/arcana")[1],
    fnChamaInferno: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s,r,n,l\)\{const\s+[A-Za-z_$][A-Za-z0-9_$]*=Math\.max\(2,Math\.round\(s\*\(1-r\*\.55\)\)\)/, "função de chama inferno")[1],
    setEfeitosEspeciais: exigirRegex(blocoSheetsAuras, /const\s+([A-Za-z_$][A-Za-z0-9_$]*)=new\s+Set\(\["storm"/, "conjunto de efeitos especiais")[1],
    fnEfeitoEspecial: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s,r,n,l=0\)\{/, "função de efeito especial")[1],
    fnTemShader: exigirRegex(blocoSheetsAuras, /([A-Za-z_$][A-Za-z0-9_$]*)=t=>!!t&&t\s+in\s+[A-Za-z_$][A-Za-z0-9_$]*/, "verificador de shader animado")[1],
    fnDesenharComShader: exigirRegex(blocoSheetsAuras, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s,r,n,l,i,f,h,m\)\{/, "função de desenho com shader")[1],
    fnMontarAparencia: exigirRegex(blocoCatalogos, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t\)\{if\(!t\)return;const\s+[A-Za-z_$][A-Za-z0-9_$]*=\{\};t\.weaponSkill&&/, "função de montagem de aparência")[1],
    fnExtrairVisual: exigirRegex(blocoCatalogos, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t\)\{const\s+[A-Za-z_$][A-Za-z0-9_$]*=[A-Za-z_$][A-Za-z0-9_$]*=>t\.find\(/, "função de extração de visual dos itens")[1],
    mapaKindsOficial: exigirRegex(blocoCatalogos, /const\s+([A-Za-z_$][A-Za-z0-9_$]*)=\{\.\.\.Object\.fromEntries\(Object\.entries\(/, "mapa oficial de kinds")[1],
    listaAneisImortais: exigirRegex(blocoCatalogos, /([A-Za-z_$][A-Za-z0-9_$]*)=\[\{look:10,/, "lista oficial de anéis imortais")[1],
    listaAneisArcanos: exigirRegex(blocoCatalogos, /([A-Za-z_$][A-Za-z0-9_$]*)=\[\{look:14,/, "lista oficial de anéis arcanos")[1],
    mapaConjuntosOficial: exigirRegex(blocoCatalogos, /([A-Za-z_$][A-Za-z0-9_$]*)=\{berserker:\{name:"Fúria do Berserker"/, "mapa oficial de conjuntos")[1],
    fnIconeItem: exigirRegex(blocoIcones, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e,a,s=5810431,r="",n=0\)\{switch\(r\)\{case"axe":/, "função de ícone 16x16 de item")[1],
    fnIconeGema: exigirRegex(blocoGemas, /function\s+([A-Za-z_$][A-Za-z0-9_$]*)\(t,e\)\{const\s+[A-Za-z_$][A-Za-z0-9_$]*=Math\.max\(1,Math\.min\(6,e\)\)/, "função de ícone de gema")[1],
  };

  return {
    blocoAnim,
    blocoHerois,
    blocoSheetsAuras,
    blocoMotorCompleto,
    blocoCatalogos,
    blocoIcones,
    blocoGemas,
    constantesGlobais,
    simbolos,
  };
}

function montarCodigoSpritesJs(extraido) {
  const s = extraido.simbolos;
  const wrapper = `
  const CORES_RARIDADE = ["#9aa0b8","#6be07b","#58a8ff","#c77dff","#ffae34","#ff4a5a","#00e5ff","#eb34b1"];
  const cacheIconeItem = new Map();
  const cacheIconeGema = new Map();
  const cacheHeroiAnim = new Map();
  let timerPalcoAtivo = null;

  function obterCanvasIconeItem(slot, cls, look, raridade, kind, tier) {
    const corHex = CORES_RARIDADE[raridade] || "#58a8ff";
    const chave = [slot, cls, look || 0, corHex, kind || "", tier || 0].join("|");
    let cv = cacheIconeItem.get(chave);
    if (!cv) {
      const corInt = parseInt(corHex.slice(1), 16);
      const spr = ${s.fnIconeItem}(slot || "weapon", cls || "cleric", look || 0, corInt, kind || "", tier || 0);
      cv = spr.toCanvas();
      cacheIconeItem.set(chave, cv);
    }
    return cv;
  }

  function desenharIconeItem(canvas, item, cls, escala = 3) {
    if (!canvas || !item) return;
    const tam = 16 * escala;
    if (canvas.width !== tam) canvas.width = tam;
    if (canvas.height !== tam) canvas.height = tam;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, tam, tam);
    const kind = item.vKind || item.kind || "";
    const look = item.vLook ?? item.look ?? 0;
    const tier = item.vTier ?? item.tier ?? 0;
    const raridade = item.rarity ?? 0;
    const src = obterCanvasIconeItem(item.slot || "weapon", cls || "cleric", look, raridade, kind, tier);
    ctx.drawImage(src, 0, 0, tam, tam);
  }

  function desenharIconeGema(canvas, tipo, tier = 5, escala = 2) {
    if (!canvas || !tipo) return;
    const tierVis = Math.max(1, Math.min(6, Number(tier) || 1));
    const chave = tipo + "|" + tierVis;
    let src = cacheIconeGema.get(chave);
    if (!src) {
      src = ${s.fnIconeGema}(tipo, tierVis).toCanvas();
      cacheIconeGema.set(chave, src);
    }
    const tam = 16 * escala;
    if (canvas.width !== tam) canvas.width = tam;
    if (canvas.height !== tam) canvas.height = tam;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, tam, tam);
    ctx.drawImage(src, 0, 0, tam, tam);
  }

  function iniciarPalcoHeroi(canvas, cls, itensEquipados, escala = 6) {
    if (timerPalcoAtivo) {
      window.clearInterval(timerPalcoAtivo);
      timerPalcoAtivo = null;
    }
    if (!canvas) return;
    const tam = 32 * escala;
    if (canvas.width !== tam) canvas.width = tam;
    if (canvas.height !== tam) canvas.height = tam;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const listaEquipados = (itensEquipados || []).map((it) => Object.assign({}, it, { equipped: true }));
    const look = ${s.fnExtrairVisual}(listaEquipados);
    const appearance = ${s.fnMontarAparencia}(look) || {};
    const classeHeroi = cls || "cleric";
    const chaveHeroi = classeHeroi + "::" + JSON.stringify(appearance);
    let heroi = cacheHeroiAnim.get(chaveHeroi);
    if (!heroi) {
      heroi = ${s.fnSpriteHeroi}(classeHeroi, appearance);
      cacheHeroiAnim.set(chaveHeroi, heroi);
    }

    const l = appearance.aura ?? 0;
    const i = appearance.fx === "fire";
    const d = appearance.fx === "inferno";
    const f = appearance.lg && ${s.mapLendarios}[appearance.lg] ? appearance.lg : "";
    const m = appearance.lgn ?? 1;
    const p = appearance.im && ${s.mapImortais}[appearance.im] ? appearance.im : "";
    const x = appearance.imn ?? 1;
    const v = appearance.fx && ${s.setEfeitosEspeciais}.has(appearance.fx) ? appearance.fx : "";

    const inicio = performance.now();
    let ultimo = inicio;
    const particulasT = [];
    const particulasC = [];

    const renderizarFrame = () => {
      if (!document.body.contains(canvas)) {
        if (timerPalcoAtivo) {
          window.clearInterval(timerPalcoAtivo);
          timerPalcoAtivo = null;
        }
        return;
      }
      const agora = performance.now();
      const tSeg = (agora - inicio) / 1000;
      const dt = Math.min(0.1, (agora - ultimo) / 1000);
      ultimo = agora;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(escala, 0, 0, escala, 0, 0);

      if (i) {
        ${s.fnAuraAnel}(ctx, 16, 32, tSeg, 5);
        for (let r = 0; r < 3; r++) {
          const vida = 0.45 + Math.random() * 0.4;
          particulasT.push({
            x: 16 + (Math.random() - 0.5) * 14,
            y: 31 - Math.random() * 20,
            vx: (Math.random() - 0.5) * 12,
            vy: -(16 + Math.random() * 22),
            life: vida,
            max: vida,
            size: Math.random() < 0.3 ? 3 : 2,
            front: Math.random() < 0.45
          });
        }
        for (const pt of particulasT) {
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
        }
        for (let r = particulasT.length - 1; r >= 0; r--) {
          if (particulasT[r].life <= 0) particulasT.splice(r, 1);
        }
      }

      if (d) {
        ${s.fnAuraAnel}(ctx, 16, 32, tSeg, 6);
        for (let r = 0; r < 2; r++) {
          const vida = 0.5 + Math.random() * 0.4;
          const alto = Math.random() < 0.35;
          particulasC.push({
            x: 16 + (Math.random() - 0.5) * 18,
            y: 31 - (alto ? 10 + Math.random() * 12 : Math.random() * 5),
            vx: (Math.random() - 0.5) * 10,
            vy: -(10 + Math.random() * 14),
            life: vida,
            max: vida,
            size: alto ? 5 + Math.floor(Math.random() * 3) : 7 + Math.floor(Math.random() * 5),
            front: Math.random() < 0.4,
            seed: Math.random() * 6
          });
        }
        if (Math.random() < 0.5) {
          particulasT.push({
            x: 16 + (Math.random() - 0.5) * 20,
            y: 30 - Math.random() * 22,
            vx: (Math.random() - 0.5) * 14,
            vy: -(26 + Math.random() * 36),
            life: 0.7,
            max: 0.7,
            size: 1,
            front: true
          });
        }
        for (const pcItem of particulasC) {
          pcItem.life -= dt;
          pcItem.x += pcItem.vx * dt;
          pcItem.y += pcItem.vy * dt;
        }
        for (let r = particulasC.length - 1; r >= 0; r--) {
          if (particulasC[r].life <= 0) particulasC.splice(r, 1);
        }
        for (const pt of particulasT) {
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
        }
        for (let r = particulasT.length - 1; r >= 0; r--) {
          if (particulasT[r].life <= 0) particulasT.splice(r, 1);
        }
      }

      const desenharChamasC = (frente) => {
        for (const pcItem of particulasC) {
          if (pcItem.front === frente) {
            ctx.globalAlpha = Math.max(0, Math.min(1, pcItem.life / (pcItem.max * 0.5)));
            ${s.fnChamaInferno}(ctx, pcItem.x, pcItem.y, pcItem.size, 1 - pcItem.life / pcItem.max, pcItem.seed, tSeg);
          }
        }
        ctx.globalAlpha = 1;
      };

      const desenharFagulhasT = (frente) => {
        for (const pt of particulasT) {
          if (pt.front !== frente) continue;
          const prog = 1 - pt.life / pt.max;
          const tamPt = Math.max(1, Math.round(pt.size * (1 - prog * 0.7)));
          ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / (pt.max * 0.5)));
          ctx.fillStyle = ${s.fnCorFagulha}(prog);
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), tamPt, tamPt);
        }
        ctx.globalAlpha = 1;
      };

      if (v) ${s.fnEfeitoEspecial}(ctx, v, 16, 32, tSeg, true, 0);
      else if (l && !d) ${s.fnAuraAnel}(ctx, 16, 32, tSeg, l);
      if (f && !p && !v && !d) ${s.fnAuraLendario}(ctx, 16, 32, tSeg, ${s.mapLendarios}[f], m);
      if (p && !v && !d) ${s.fnAuraImortal}(ctx, 16, 32, tSeg, ${s.mapImortais}[p], x);

      desenharChamasC(false);
      desenharFagulhasT(false);

      const frameIdx = Math.floor(tSeg * 2) % heroi.anims.idle.length;
      if (p && ${s.fnTemShader}(p) && !v && !d) {
        ${s.fnDesenharComShader}(ctx, heroi.anims.idle[frameIdx].n, 12, 0, 32, 32, 0, 0, p, tSeg, x);
      } else {
        ctx.drawImage(heroi.anims.idle[frameIdx].n, 12, 0, 32, 32, 0, 0, 32, 32);
      }

      desenharFagulhasT(true);
      desenharChamasC(true);
      if (v) ${s.fnEfeitoEspecial}(ctx, v, 16, 32, tSeg, false, 0);
    };

    renderizarFrame();
    const intervalo = l || i || d || v || f || p ? 60 : 250;
    timerPalcoAtivo = window.setInterval(renderizarFrame, intervalo);
  }

  window.RiftSprites = {
    desenharIconeItem,
    desenharIconeGema,
    iniciarPalcoHeroi,
    obterSpriteHeroi: (cls, opts) => ${s.fnSpriteHeroi}(cls, opts),
    catalogoConjuntosOficial: ${s.mapaConjuntosOficial},
    catalogoKindsOficial: ${s.mapaKindsOficial},
    aneisImortaisOficial: ${s.listaAneisImortais},
    aneisArcanosOficial: ${s.listaAneisArcanos}
  };
})();
`;

  return [
    "/* Gerador Oficial de Pixel Art 2D — RiftStream Character Sheet */",
    "(function () {",
    '  "use strict";',
    `  const ${s.helperCampo} = (obj, key, val) => { obj[key] = val; };`,
    `  ${extraido.blocoAnim}`,
    `  ${extraido.blocoHerois}`,
    `  ${extraido.blocoSheetsAuras}`,
    `  ${extraido.blocoCatalogos}`,
    `  ${extraido.blocoIcones}`,
    `  ${extraido.blocoGemas}`,
    wrapper.trimStart(),
  ].join("\n");
}

function carregarSpritesEmSandbox(codigoSprites) {
  const windowObj = { setInterval: () => 1, clearInterval: () => {} };
  const sandbox = {
    Math, Array, Object, Map, Set, Uint32Array, Uint8ClampedArray, Buffer, Number, String, Boolean,
    ImageData: ImageDataMock,
    performance: { now: () => 1000 },
    window: windowObj,
    document: { createElement: () => criarCanvasMock(), body: { contains: () => true } },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(codigoSprites, sandbox);
  return windowObj.RiftSprites;
}

function carregarMotorInimigosEmSandbox(extraido) {
  const s = extraido.simbolos;
  const sandbox = {
    Math, Array, Object, Map, Set, Uint32Array, Uint8ClampedArray, Buffer, Number, String, Boolean,
    ImageData: ImageDataMock,
    [s.helperCampo]: (obj, key, val) => { obj[key] = val; },
    ...extraido.constantesGlobais,
    document: { createElement: () => criarCanvasMock() },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(
    `${extraido.blocoAnim}\n${extraido.blocoMotorCompleto}\n;globalThis.__obterInimigo = ${s.fnSpriteInimigo};`,
    sandbox
  );
  return sandbox.__obterInimigo;
}

function validarSprites(RiftSprites) {
  const falhas = [];
  for (const [key, info] of Object.entries(catalogoConjuntos)) {
    const rar = info.raridadePadrao || 6;
    const itens = [
      { slot: "weapon", kind: info.armaKind, rarity: rar, set: key },
      { slot: "helmet", kind: info.elmoKind, rarity: rar, set: key },
      { slot: "armor", kind: info.armaduraKind, rarity: rar, set: key },
    ];
    try {
      const palco = criarCanvasMock();
      RiftSprites.iniciarPalcoHeroi(palco, info.classe, itens, 1);
      for (const it of itens) {
        const cv = criarCanvasMock();
        RiftSprites.desenharIconeItem(cv, it, info.classe, 1);
        if (!cv._rgba) falhas.push(`Ícone vazio para ${key}:${it.kind}`);
      }
    } catch (erro) {
      falhas.push(`Conjunto ${key}: ${erro.message}`);
    }
  }
  for (const [kind, info] of Object.entries(catalogoArmas)) {
    const cv = criarCanvasMock();
    RiftSprites.desenharIconeItem(cv, { slot: "weapon", kind, rarity: info.raridade || 6, look: 0 }, info.classe, 1);
    if (!cv._rgba) falhas.push(`Arma vazia: ${kind}`);
  }
  const maiorLookAnel = Math.max(19, ...Object.keys(catalogoAneis).map(Number).filter(Number.isFinite));
  for (let look = 0; look <= maiorLookAnel; look++) {
    const cv = criarCanvasMock();
    RiftSprites.desenharIconeItem(cv, { slot: "ring", rarity: 7, look }, "warrior", 1);
    if (!cv._rgba) falhas.push(`Anel vazio: look ${look}`);
  }
  for (const tipo of ["ruby", "sapphire", "topaz", "emerald", "amethyst"]) {
    for (let tier = 1; tier <= 6; tier++) {
      const cv = criarCanvasMock();
      RiftSprites.desenharIconeGema(cv, tipo, tier, 1);
      if (!cv._rgba) falhas.push(`Gema vazia: ${tipo} T${tier}`);
    }
  }
  if (falhas.length > 0) {
    throw new Error(`Validação do sprites.js falhou (${falhas.length} erro(s)):\n- ${falhas.join("\n- ")}`);
  }
}

function atualizarCacheBustHtmls(somenteValidar) {
  const agora = new Date();
  const dataStamp = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
  ].join("");
  const atualizados = [];

  for (const arquivo of ARQUIVOS_CACHE_BUST) {
    const caminho = path.join(RAIZ, arquivo);
    if (!fs.existsSync(caminho)) continue;
    const original = fs.readFileSync(caminho, "utf8");
    const m = original.match(/sprites\.js\?v=(\d{8})([a-z])/);
    if (!m) continue;
    let novaVersao = `${dataStamp}a`;
    if (m[1] === dataStamp) {
      const proximaLetra = String.fromCharCode(Math.min(122, m[2].charCodeAt(0) + 1));
      novaVersao = `${dataStamp}${proximaLetra}`;
    }
    const atualizado = original.replace(/sprites\.js\?v=\d{8}[a-z]/g, `sprites.js?v=${novaVersao}`);
    if (atualizado !== original) {
      if (!somenteValidar) fs.writeFileSync(caminho, atualizado, "utf8");
      atualizados.push(`${arquivo} (v=${novaVersao})`);
    }
  }
  return atualizados;
}

function exportarTodosPngs(RiftSprites, obterInimigo, opcoes) {
  const resumo = { criado: 0, atualizado: 0, inalterado: 0, gifs: 0 };
  const registrar = (status) => { resumo[status] = (resumo[status] || 0) + 1; };

  // 1. Armas oficiais
  for (const [kind, info] of Object.entries(catalogoArmas)) {
    const conjunto = Object.values(catalogoConjuntos).find((c) => c.armaKind === kind);
    const raridade = info.raridade || conjunto?.raridadePadrao || 6;
    const c = criarCanvasMock();
    RiftSprites.desenharIconeItem(c, { slot: "weapon", kind, rarity: raridade, look: 0 }, info.classe, 1);
    if (c._rgba) {
      const dest = path.join(DIR_EXPORTS, "itens", info.classe, "armas", `${kind}_${gerarSlug(info.nome)}.png`);
      registrar(salvarPngSeAlterado(dest, c._rgba, c.width, c.height, ESCALA_PNG, opcoes.somenteValidar));
    }
  }

  // 2. Elmos e armaduras de conjuntos
  for (const [, info] of Object.entries(catalogoConjuntos)) {
    const rar = info.raridadePadrao || 6;
    for (const [slot, kindKey, nomeKey, pasta] of [
      ["helmet", "elmoKind", "elmoNome", "elmos"],
      ["armor", "armaduraKind", "armaduraNome", "armaduras"],
    ]) {
      const c = criarCanvasMock();
      RiftSprites.desenharIconeItem(c, { slot, kind: info[kindKey], rarity: rar, look: 0 }, info.classe, 1);
      if (c._rgba) {
        const dest = path.join(DIR_EXPORTS, "itens", info.classe, pasta, `${info[kindKey]}_${gerarSlug(info[nomeKey])}.png`);
        registrar(salvarPngSeAlterado(dest, c._rgba, c.width, c.height, ESCALA_PNG, opcoes.somenteValidar));
      }
    }
  }

  // 3. Anéis
  const maiorLookAnel = Math.max(19, ...Object.keys(catalogoAneis).map(Number).filter(Number.isFinite));
  for (let look = 0; look <= maiorLookAnel; look++) {
    const info = catalogoAneis[look];
    const rar = info?.raridadeMin ?? (look >= 14 ? 7 : look >= 10 ? 6 : look >= 7 ? 5 : 4);
    const c = criarCanvasMock();
    RiftSprites.desenharIconeItem(c, { slot: "ring", rarity: rar, look }, "warrior", 1);
    if (c._rgba) {
      const nome = info ? `${String(look).padStart(2, "0")}_${gerarSlug(info.nome)}` : `${String(look).padStart(2, "0")}_anel_base`;
      const dest = path.join(DIR_EXPORTS, "itens", "aneis", `${nome}.png`);
      registrar(salvarPngSeAlterado(dest, c._rgba, c.width, c.height, ESCALA_PNG, opcoes.somenteValidar));
    }
  }

  // 4. Gemas (5 tipos × tiers 1..5)
  for (const tipo of ["ruby", "sapphire", "topaz", "emerald", "amethyst"]) {
    for (let tier = 1; tier <= 5; tier++) {
      const c = criarCanvasMock();
      RiftSprites.desenharIconeGema(c, tipo, tier, 1);
      if (c._rgba) {
        const dest = path.join(DIR_EXPORTS, "gemas", `${tipo}_tier${tier}.png`);
        registrar(salvarPngSeAlterado(dest, c._rgba, c.width, c.height, ESCALA_PNG, opcoes.somenteValidar));
      }
    }
  }

  // 5. Heróis (base + todos os conjuntos)
  const presetsHerois = [
    { nome: "00_base", cls: "warrior", opts: {} },
    { nome: "00_base", cls: "archer", opts: {} },
    { nome: "00_base", cls: "cleric", opts: {} },
    ...Object.entries(catalogoConjuntos).map(([setKey, info]) => {
      const t = info.raridadePadrao || 6;
      return {
        nome: `${setKey}_${gerarSlug(info.nome)}`,
        cls: info.classe,
        opts: { wk: info.armaKind, hk: info.elmoKind, ak: info.armaduraKind, wt: t, ht: t, at: t },
      };
    }),
  ];
  for (const ph of presetsHerois) {
    const sp = RiftSprites.obterSpriteHeroi(ph.cls, ph.opts);
    const idle = sp?.anims?.idle;
    if (!idle?.[0]?.n?._rgba) continue;
    const dest = path.join(DIR_EXPORTS, "herois", ph.cls, `${ph.nome}.png`);
    registrar(salvarPngSeAlterado(dest, idle[0].n._rgba, sp.w, sp.h, ESCALA_PNG, opcoes.somenteValidar));
    if (opcoes.comGifs && !opcoes.somenteValidar) {
      const frames = [...idle.map((f) => f.n._rgba), ...(sp.anims.attack || []).map((f) => f.n._rgba)];
      const durs = [...idle.map(() => 0.45), ...(sp.anims.attack || []).map(() => 0.14)];
      criarGifAnimado(path.join(DIR_EXPORTS, "herois", ph.cls, `${ph.nome}.gif`), frames, sp.w, sp.h, durs);
      resumo.gifs++;
    }
  }

  // 6. Chefes e inimigos de todos os temas (0..12+, detectando variantes únicas)
  if (obterInimigo) {
    const vistos = new Set();
    const maiorTema = Math.max(12, ...Object.keys(NOMES_TEMAS_EXPORT).map(Number));
    for (let tema = 0; tema <= maiorTema; tema++) {
      const prefixo = NOMES_TEMAS_EXPORT[tema] || `t${String(tema).padStart(2, "0")}_tema`;
      for (const tipo of ["skeleton", "goblin", "boss"]) {
        for (let vari = 0; vari <= 4; vari++) {
          let sp;
          try {
            sp = obterInimigo(tipo, tema, vari);
          } catch {
            continue;
          }
          const idle = sp?.anims?.idle;
          if (!idle?.[0]?.n?._rgba) continue;
          const assinatura = `${tipo}_${sp.w}x${sp.h}_${calcularCrc32(idle[0].n._rgba)}`;
          if (vistos.has(assinatura)) continue;
          vistos.add(assinatura);
          const pasta = tipo === "boss" ? "chefes" : "inimigos";
          const dest = path.join(DIR_EXPORTS, pasta, `${prefixo}_${tipo}_v${vari}.png`);
          registrar(salvarPngSeAlterado(dest, idle[0].n._rgba, sp.w, sp.h, ESCALA_PNG, opcoes.somenteValidar));
          if (opcoes.comGifs && !opcoes.somenteValidar) {
            const frames = [...idle.map((f) => f.n._rgba), ...(sp.anims.attack || []).map((f) => f.n._rgba)];
            const durs = [...idle.map(() => 0.4), ...(sp.anims.attack || []).map(() => 0.15)];
            criarGifAnimado(path.join(DIR_EXPORTS, pasta, `${prefixo}_${tipo}_v${vari}.gif`), frames, sp.w, sp.h, durs);
            resumo.gifs++;
          }
        }
      }
    }
  }

  return resumo;
}

async function main() {
  const opcoes = analisarArgumentos(process.argv.slice(2));
  const { origem, codigo } = await obterBundleOficial(opcoes.bundleLocal);
  console.log(`Bundle carregado: ${origem} (${codigo.length.toLocaleString("pt-BR")} bytes)`);

  const extraido = extrairBlocosDoBundle(codigo);
  const codigoSprites = montarCodigoSpritesJs(extraido);
  const RiftSprites = carregarSpritesEmSandbox(codigoSprites);
  validarSprites(RiftSprites);

  const qtdConjuntosOficiais = Object.keys(RiftSprites.catalogoConjuntosOficial || {}).length;
  const qtdKindsOficiais = Object.keys(RiftSprites.catalogoKindsOficial || {}).length;
  console.log(`Validação OK: ${Object.keys(catalogoConjuntos).length} conjuntos locais, ${qtdConjuntosOficiais} conjuntos oficiais e ${qtdKindsOficiais} kinds no motor.`);

  if (!opcoes.somentePngs) {
    const caminhoSprites = path.join(RAIZ, "sprites.js");
    const atual = fs.existsSync(caminhoSprites) ? fs.readFileSync(caminhoSprites, "utf8") : "";
    if (atual === codigoSprites) {
      console.log("sprites.js já estava atualizado (nenhuma alteração).");
    } else {
      if (!opcoes.somenteValidar) fs.writeFileSync(caminhoSprites, codigoSprites, "utf8");
      console.log(`${opcoes.somenteValidar ? "[dry-run] Atualizaria" : "Atualizado"} sprites.js (${codigoSprites.length.toLocaleString("pt-BR")} bytes).`);
      if (!opcoes.semCacheBust) {
        const htmls = atualizarCacheBustHtmls(opcoes.somenteValidar);
        if (htmls.length) {
          console.log(`${opcoes.somenteValidar ? "[dry-run] Atualizaria cache-bust em" : "Cache-bust atualizado em"}: ${htmls.join(", ")}`);
        }
      }
    }
  }

  if (!opcoes.somenteSprites) {
    const obterInimigo = carregarMotorInimigosEmSandbox(extraido);
    const resumo = exportarTodosPngs(RiftSprites, obterInimigo, opcoes);
    console.log(
      `PNGs em exports/: ${resumo.criado} criado(s), ${resumo.atualizado} atualizado(s), ${resumo.inalterado} inalterado(s)` +
      (resumo.gifs ? ` | ${resumo.gifs} GIF(s)` : "")
    );
  }
}

main().catch((erro) => {
  console.error("Erro ao atualizar sprites:", erro.message);
  process.exit(1);
});
