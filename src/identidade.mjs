function normalizarEntradaNick(valorBruto, plataformaSelecionada) {
  let texto = String(valorBruto ?? "").trim();
  let plataforma = plataformaSelecionada === "kick" ? "kick" : "twitch";

  const matchRift = texto.match(/riftstream\.com\.br\/perfil\/(?:(kick|twitch)\/)?([a-z0-9_.\-]+)/i);
  if (matchRift) {
    if (matchRift[1]) {
      plataforma = matchRift[1].toLowerCase();
    }
    texto = matchRift[2];
  } else {
    const matchKick = texto.match(/kick\.com\/([a-z0-9_.\-]+)/i);
    const matchTwitch = texto.match(/twitch\.tv\/([a-z0-9_.\-]+)/i);
    if (matchKick) {
      plataforma = "kick";
      texto = matchKick[1];
    } else if (matchTwitch) {
      plataforma = "twitch";
      texto = matchTwitch[1];
    }
  }

  if (/^kick[:/]/i.test(texto)) {
    plataforma = "kick";
    texto = texto.replace(/^kick[:/]/i, "");
  } else if (/^twitch[:/]/i.test(texto)) {
    plataforma = "twitch";
    texto = texto.replace(/^twitch[:/]/i, "");
  }

  const nickLimpo = texto.replace(/^@/, "").trim().toLowerCase();
  return { nick: nickLimpo, plataforma };
}

export {
  normalizarEntradaNick,
};
