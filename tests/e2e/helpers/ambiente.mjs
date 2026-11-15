import { expect } from "@playwright/test";
import { instalarMocksApi } from "./mock-api.mjs";

export const DATA_FIXA_ISO = "2026-11-15T15:30:00-03:00";

export function anexarMonitorErros(page, { permitirErrosConsole = false } = {}) {
  const erros = [];
  page.on("pageerror", (erro) => erros.push(`pageerror: ${erro.message}`));
  if (!permitirErrosConsole) {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        erros.push(`console.error: ${msg.text()}`);
      }
    });
  }
  return erros;
}

export async function configurarAmbienteDeterministico(page, {
  dataIso = DATA_FIXA_ISO,
  randomDeterministico = true,
  estabilizarCanvas = true,
} = {}) {
  await page.addInitScript(({ dataBaseIso, usarRandomDeterministico, travarCanvas }) => {
    const tempoBaseMs = new Date(dataBaseIso).getTime();
    const DateOriginal = Date;
    const offsetMs = tempoBaseMs - DateOriginal.now();

    function DateAncorado(...args) {
      if (new.target) {
        return args.length === 0 ? new DateOriginal(DateOriginal.now() + offsetMs) : new DateOriginal(...args);
      }
      return new DateOriginal(DateOriginal.now() + offsetMs).toString();
    }
    DateAncorado.prototype = DateOriginal.prototype;
    DateAncorado.now = () => DateOriginal.now() + offsetMs;
    DateAncorado.parse = DateOriginal.parse;
    DateAncorado.UTC = DateOriginal.UTC;
    window.Date = DateAncorado;

    if (usarRandomDeterministico) {
      let semente = 133742;
      Math.random = () => {
        semente = (semente * 1664525 + 1013904223) % 4294967296;
        return semente / 4294967296;
      };
    }

    if (travarCanvas) {
      const setIntervalOriginal = window.setInterval.bind(window);
      const clearIntervalOriginal = window.clearInterval.bind(window);
      const mapaTimers = new Map();
      let proximoId = 900000;

      window.setInterval = (fn, delay, ...args) => {
        if (typeof fn === "function" && Number(delay) > 0 && Number(delay) <= 500) {
          const id = proximoId++;
          const timeoutId = window.setTimeout(() => {
            try {
              fn(...args);
            } catch {}
          }, 0);
          mapaTimers.set(id, timeoutId);
          return id;
        }
        return setIntervalOriginal(fn, delay, ...args);
      };

      window.clearInterval = (id) => {
        if (mapaTimers.has(id)) {
          window.clearTimeout(mapaTimers.get(id));
          mapaTimers.delete(id);
          return;
        }
        clearIntervalOriginal(id);
      };
    }
  }, {
    dataBaseIso: dataIso,
    usarRandomDeterministico: randomDeterministico,
    travarCanvas: estabilizarCanvas,
  });
}

export async function prepararPagina(page, url, opcoes = {}) {
  const erros = anexarMonitorErros(page, {
    permitirErrosConsole: Boolean(opcoes.permitirErrosConsole),
  });
  await configurarAmbienteDeterministico(page, opcoes);
  const controleApi = await instalarMocksApi(page, opcoes.api || {});
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  return { erros, controleApi };
}

export async function verificarFonteSilkscreenCarregada(page) {
  const carregada = await page.evaluate(async () => {
    await document.fonts.load("400 16px Silkscreen");
    await document.fonts.ready;
    return Array.from(document.fonts).some(
      (f) => f.family.replace(/["']/g, "").toLowerCase() === "silkscreen" && f.status === "loaded"
    );
  });
  expect(carregada, "A fonte local Silkscreen deve estar carregada").toBe(true);
}

export async function verificarCanvasComSprite(page, seletor) {
  const canvas = page.locator(seletor);
  await expect(canvas).toBeVisible();
  const temPixels = await canvas.evaluate((el) => {
    const ctx = el.getContext("2d");
    if (!ctx || !el.width || !el.height) return false;
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
    return false;
  });
  expect(temPixels, `Canvas ${seletor} deve conter pixels do sprite desenhado`).toBe(true);
}

export async function verificarSemOverflowHorizontal(page, descricao = "") {
  const metricas = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      innerWidth: window.innerWidth,
      diferenca: doc.scrollWidth - doc.clientWidth,
    };
  });
  expect(
    metricas.scrollWidth,
    `Overflow horizontal detectado${descricao ? ` (${descricao})` : ""}: scrollWidth=${metricas.scrollWidth} > clientWidth=${metricas.clientWidth}`
  ).toBeLessThanOrEqual(metricas.clientWidth + 1);
}

