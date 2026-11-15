import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { catalogoArmas, catalogoConjuntos, catalogoAneis } from "../src/dados.mjs";

const RAIZ = process.cwd();
const DIR_EXPORTS = path.join(RAIZ, "exports");
const ESCALA = 4;

// --- Encoder PNG puro (sem dependências externas) ---
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}
function chunkPng(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function escalarRgbaNearest(rgba, w, h, escala) {
  if (escala <= 1) return { rgba, w, h };
  const nw = w * escala;
  const nh = h * escala;
  const out = Buffer.alloc(nw * nh * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const r = rgba[si], g = rgba[si + 1], b = rgba[si + 2], a = rgba[si + 3];
      if (a === 0) continue;
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const di = ((y * escala + dy) * nw + (x * escala + dx)) * 4;
          out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = a;
        }
      }
    }
  }
  return { rgba: out, w: nw, h: nh };
}
function encodePNG(rgba, w, h, escala = 1) {
  const esc = escalarRgbaNearest(rgba, w, h, escala);
  const rowBytes = esc.w * 4 + 1;
  const raw = Buffer.alloc(rowBytes * esc.h);
  for (let y = 0; y < esc.h; y++) {
    raw[y * rowBytes] = 0;
    esc.rgba.copy(raw, y * rowBytes + 1, y * esc.w * 4, (y + 1) * esc.w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(esc.w, 0);
  ihdr.writeUInt32BE(esc.h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunkPng("IHDR", ihdr),
    chunkPng("IDAT", idat),
    chunkPng("IEND", Buffer.alloc(0)),
  ]);
}
function salvarPng(caminho, rgba, w, h, escala = ESCALA) {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  fs.writeFileSync(caminho, encodePNG(rgba, w, h, escala));
}
function hashBuffer(buf) {
  return zlib.crc32 ? zlib.crc32(buf) : crc32(buf);
}

// --- Mock de Canvas para capturar pixels RGBA ---
function criarMockCanvas() {
  const canvas = {
    width: 0,
    height: 0,
    _rgba: null,
    getContext() {
      return {
        imageSmoothingEnabled: false,
        clearRect() {},
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

function carregarSpritesLocais() {
  const codigo = fs.readFileSync(path.join(RAIZ, "sprites.js"), "utf8");
  const windowObj = { setInterval: () => 0, clearInterval: () => {} };
  const sandbox = {
    Math, Array, Object, Map, Set, Uint32Array, Uint8ClampedArray, Buffer, Number, String, Boolean,
    ImageData: ImageDataMock,
    window: windowObj,
    document: { createElement: () => criarMockCanvas() },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox);
  return windowObj.RiftSprites;
}

async function carregarMotorOficial() {
  const cachePath = "/tmp/rift_bundle.js";
  let js;
  if (fs.existsSync(cachePath)) {
    js = fs.readFileSync(cachePath, "utf8");
  } else {
    const html = await (await fetch("https://riftstream.com.br/")).text();
    const m = html.match(/\/assets\/(index-[^"'\s]+\.js)/);
    if (!m) throw new Error("Bundle não encontrado");
    js = await (await fetch(`https://riftstream.com.br/assets/${m[1]}`)).text();
    fs.writeFileSync(cachePath, js);
  }
  const mwStart = js.indexOf("Mw={");
  const uoEnd = js.indexOf(",ww=", mwStart);
  const uoCode = "const " + js.slice(mwStart, uoEnd) + ";";
  const start = js.indexOf("const Gm=t=>");
  const end = js.indexOf("const M8={", start);
  const trecho = js.slice(start, end);

  const sandbox = {
    Math, Array, Object, Map, Set, Uint32Array, Uint8ClampedArray, Buffer, Number, String, Boolean,
    ImageData: ImageDataMock,
    ve: (o, k, v) => { o[k] = v; },
    Mo: (t, e) => Array(t).fill(e),
    th: 8, Xl: 1, eg: 5, tg: 6, ki: 7, zr: 8, Ep: 9, on: 10, Gn: 11, Lt: 70,
    document: { createElement: () => criarMockCanvas() },
  };
  vm.createContext(sandbox);
  vm.runInContext(uoCode + "\n" + trecho + "\n;globalThis.__exp = { $p, jg, Jm, uo };", sandbox);
  return sandbox.__exp;
}

function criarGifAnimado(caminhoGif, framesRgba, w, h, delaysCs, escala = ESCALA) {
  fs.mkdirSync(path.dirname(caminhoGif), { recursive: true });
  const tmpDir = fs.mkdtempSync("/tmp/riftgif_");
  try {
    const args = ["-dispose", "Background", "-loop", "0"];
    framesRgba.forEach((rgba, idx) => {
      const f = path.join(tmpDir, `f_${String(idx).padStart(3, "0")}.png`);
      fs.writeFileSync(f, encodePNG(rgba, w, h, escala));
      const delay = Math.max(4, Math.round((delaysCs[idx] ?? 0.25) * 100));
      args.push("-delay", String(delay), f);
    });
    args.push(caminhoGif);
    execFileSync("magick", args, { stdio: "ignore" });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function slug(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function main() {
  fs.rmSync(DIR_EXPORTS, { recursive: true, force: true });
  fs.mkdirSync(DIR_EXPORTS, { recursive: true });

  const RiftSprites = carregarSpritesLocais();
  const oficial = await carregarMotorOficial();
  let totalPngs = 0;
  let totalGifs = 0;

  // 1. Armas oficiais (separadas por classe)
  for (const [kind, info] of Object.entries(catalogoArmas)) {
    const c = criarMockCanvas();
    const raridade = info.raridade || (["tamerwhip","strongmallet","obsidblade","thunderaxe","trapezebow","fireworkbow","aurorabow","abyssbow","magewand","crystalball","serafscepter","eclipsestaff"].includes(kind) ? 7 : 6);
    RiftSprites.desenharIconeItem(c, { slot: "weapon", kind, rarity: raridade, look: 0 }, info.classe, 1);
    if (c._rgba) {
      salvarPng(path.join(DIR_EXPORTS, "itens", info.classe, "armas", `${kind}_${slug(info.nome)}.png`), c._rgba, c.width, c.height);
      totalPngs++;
    }
  }
  // Armas básicas por classe, raridade (1..7) e look (0..3)
  for (let r = 1; r <= 7; r++) {
    for (let look = 0; look <= 3; look++) {
      for (const cls of ["warrior", "archer", "cleric"]) {
        const c = criarMockCanvas();
        RiftSprites.desenharIconeItem(c, { slot: "weapon", rarity: r, look }, cls, 1);
        if (c._rgba) {
          salvarPng(path.join(DIR_EXPORTS, "itens", cls, "basicos_armas", `r${r}_look${look}.png`), c._rgba, c.width, c.height);
          totalPngs++;
        }
      }
    }
  }

  // 2. Elmos e Armaduras dos Conjuntos (por classe) + Básicos (compartilhados)
  for (const [setKey, info] of Object.entries(catalogoConjuntos)) {
    const rar = info.raridadePadrao || 6;
    for (const [slot, kindKey, nomeKey, pasta] of [
      ["helmet", "elmoKind", "elmoNome", "elmos"],
      ["armor", "armaduraKind", "armaduraNome", "armaduras"],
    ]) {
      const c = criarMockCanvas();
      RiftSprites.desenharIconeItem(c, { slot, kind: info[kindKey], rarity: rar, look: 0 }, info.classe, 1);
      if (c._rgba) {
        salvarPng(path.join(DIR_EXPORTS, "itens", info.classe, pasta, `${info[kindKey]}_${slug(info[nomeKey])}.png`), c._rgba, c.width, c.height);
        totalPngs++;
      }
    }
  }
  for (let r = 1; r <= 7; r++) {
    for (let look = 0; look <= 3; look++) {
      for (const slot of ["helmet", "armor"]) {
        const c = criarMockCanvas();
        RiftSprites.desenharIconeItem(c, { slot, rarity: r, look }, "warrior", 1);
        if (c._rgba) {
          salvarPng(path.join(DIR_EXPORTS, "itens", slot === "helmet" ? "basicos_elmos" : "basicos_armaduras", `r${r}_look${look}.png`), c._rgba, c.width, c.height);
          totalPngs++;
        }
      }
    }
  }

  // 3. Anéis (todos os looks 0..19)
  for (let look = 0; look <= 19; look++) {
    const info = catalogoAneis[look];
    const rar = look >= 14 ? 7 : look >= 10 ? 6 : look >= 7 ? 5 : 4;
    const c = criarMockCanvas();
    RiftSprites.desenharIconeItem(c, { slot: "ring", rarity: rar, look }, "warrior", 1);
    if (c._rgba) {
      const nome = info ? `${String(look).padStart(2, "0")}_${slug(info.nome)}` : `${String(look).padStart(2, "0")}_anel_base`;
      salvarPng(path.join(DIR_EXPORTS, "itens/aneis", `${nome}.png`), c._rgba, c.width, c.height);
      totalPngs++;
    }
  }

  // 4. Gemas (5 tipos × 5 tiers)
  for (const tipo of ["ruby", "sapphire", "topaz", "emerald", "amethyst"]) {
    for (let tier = 1; tier <= 5; tier++) {
      const c = criarMockCanvas();
      RiftSprites.desenharIconeGema(c, tipo, tier, 1);
      if (c._rgba) {
        salvarPng(path.join(DIR_EXPORTS, "gemas", `${tipo}_tier${tier}.png`), c._rgba, c.width, c.height);
        totalPngs++;
      }
    }
  }

  // 5. Objetos (coin, chest, portal)
  const objs = oficial.Jm();
  if (objs.coin?.length) {
    salvarPng(path.join(DIR_EXPORTS, "objetos/coin.png"), objs.coin[0]._rgba, objs.coin[0].width, objs.coin[0].height);
    totalPngs++;
    criarGifAnimado(path.join(DIR_EXPORTS, "objetos/coin.gif"), objs.coin.map(f => f._rgba), objs.coin[0].width, objs.coin[0].height, objs.coin.map(() => 0.14));
    totalGifs++;
  }
  if (objs.chest?._rgba) {
    salvarPng(path.join(DIR_EXPORTS, "objetos/chest.png"), objs.chest._rgba, objs.chest.width, objs.chest.height);
    totalPngs++;
  }
  if (objs.portal?.length) {
    salvarPng(path.join(DIR_EXPORTS, "objetos/portal.png"), objs.portal[0]._rgba, objs.portal[0].width, objs.portal[0].height);
    totalPngs++;
    criarGifAnimado(path.join(DIR_EXPORTS, "objetos/portal.gif"), objs.portal.map(f => f._rgba), objs.portal[0].width, objs.portal[0].height, objs.portal.map(() => 0.15));
    totalGifs++;
  }

  // 6. Inimigos e Chefes de todos os temas (0..11) + variantes únicas
  const nomesTemas = {
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
  };
  const vistos = new Set();
  for (let tema = 0; tema <= 11; tema++) {
    for (const tipo of ["skeleton", "goblin", "boss"]) {
      for (let vari = 0; vari <= 4; vari++) {
        let sp;
        try { sp = oficial.$p(tipo, tema, vari); } catch { continue; }
        const idle = sp?.anims?.idle;
        if (!idle?.length || !idle[0]?.n?._rgba) continue;
        const hash = `${tipo}_${sp.w}x${sp.h}_${hashBuffer(idle[0].n._rgba)}`;
        if (vistos.has(hash)) continue;
        vistos.add(hash);

        const sub = tipo === "boss" ? "chefes" : "inimigos";
        const baseNome = `${nomesTemas[tema]}_${tipo}_v${vari}`;
        salvarPng(path.join(DIR_EXPORTS, sub, `${baseNome}.png`), idle[0].n._rgba, sp.w, sp.h);
        totalPngs++;

        // GIF animado (idle + attack para mostrar o movimento completo)
        const frames = [...idle.map(f => f.n._rgba)];
        const durs = [...(oficial.uo[tipo]?.idle?.dur || idle.map(() => 0.4))];
        const atk = sp?.anims?.attack;
        if (atk?.length) {
          frames.push(...atk.map(f => f.n._rgba));
          durs.push(...(oficial.uo[tipo]?.attack?.dur || atk.map(() => 0.15)));
        }
        criarGifAnimado(path.join(DIR_EXPORTS, sub, `${baseNome}.gif`), frames, sp.w, sp.h, durs);
        totalGifs++;
      }
    }
  }

  // 7. Heróis (classes base + todos os 36 conjuntos completos separados por classe)
  const presetsHerois = [
    { nome: "00_base", cls: "warrior", opts: {} },
    { nome: "00_base", cls: "archer", opts: {} },
    { nome: "00_base", cls: "cleric", opts: {} },
    ...Object.entries(catalogoConjuntos).map(([setKey, info]) => {
      const t = info.raridadePadrao || 6;
      return {
        nome: `${setKey}_${slug(info.nome)}`,
        cls: info.classe,
        opts: { wk: info.armaKind, hk: info.elmoKind, ak: info.armaduraKind, wt: t, ht: t, at: t },
      };
    }),
  ];
  for (const ph of presetsHerois) {
    const sp = oficial.jg(ph.cls, ph.opts);
    const idle = sp?.anims?.idle;
    if (!idle?.length || !idle[0]?.n?._rgba) continue;
    salvarPng(path.join(DIR_EXPORTS, "herois", ph.cls, `${ph.nome}.png`), idle[0].n._rgba, sp.w, sp.h);
    totalPngs++;
    const frames = [...idle.map(f => f.n._rgba)];
    const durs = [...(oficial.uo[ph.cls]?.idle?.dur || idle.map(() => 0.45))];
    const atk = sp?.anims?.attack;
    if (atk?.length) {
      frames.push(...atk.map(f => f.n._rgba));
      durs.push(...(oficial.uo[ph.cls]?.attack?.dur || atk.map(() => 0.14)));
    }
    criarGifAnimado(path.join(DIR_EXPORTS, "herois", ph.cls, `${ph.nome}.gif`), frames, sp.w, sp.h, durs);
    totalGifs++;
  }

  console.log(`Exportação concluída em ${DIR_EXPORTS}`);
  console.log(`Total de PNGs: ${totalPngs} | Total de GIFs animados: ${totalGifs}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

