(() => {
  const chave = "riftinfos:fonte";
  const raiz = document.documentElement;
  let fonte = "pixelada";
  try {
    if (localStorage.getItem(chave) === "limpa") fonte = "limpa";
  } catch {}
  raiz.dataset.fonte = fonte;

  document.addEventListener("DOMContentLoaded", () => {
    const opcoes = document.querySelector("#fonte-site");
    opcoes.value = fonte;
    opcoes.addEventListener("change", () => {
      fonte = opcoes.value === "limpa" ? "limpa" : "pixelada";
      raiz.dataset.fonte = fonte;
      try {
        localStorage.setItem(chave, fonte);
      } catch {}
    });
  });
})();
