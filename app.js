const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const form = document.getElementById("video-form");
const input = document.getElementById("video-input");
const statusText = document.getElementById("status");
const resultBox = document.getElementById("result");
const idSpan = document.getElementById("video-id");
const copyButton = document.getElementById("copy-id");
const player = document.getElementById("player");

function normalize(value) {
  return value.trim().replace(/[<>]/g, "");
}

function extractFromUrlCandidate(candidate) {
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id = null;

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || null;
    } else if (
      host.endsWith("youtube.com") ||
      host.endsWith("youtube-nocookie.com")
    ) {
      id = url.searchParams.get("v");
      if (!id) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length >= 2 && ["shorts", "embed", "live", "v"].includes(parts[0])) {
          id = parts[1];
        }
      }
    }

    return id && ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

function extractYouTubeId(rawValue) {
  const cleaned = normalize(rawValue);
  if (!cleaned) return null;
  if (ID_PATTERN.test(cleaned)) return cleaned;

  const candidates = [cleaned];
  if (!/^https?:\/\//i.test(cleaned)) {
    candidates.push(`https://${cleaned}`);
  }

  for (const candidate of candidates) {
    const id = extractFromUrlCandidate(candidate);
    if (id) return id;
  }

  const fallbackMatch = cleaned.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/i
  );
  return fallbackMatch ? fallbackMatch[1] : null;
}

function setStatus(message, kind = "") {
  statusText.textContent = message;
  statusText.className = "status";
  if (kind) {
    statusText.classList.add(kind);
  }
}

function renderVideo(id) {
  player.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  idSpan.textContent = id;
  resultBox.hidden = false;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = extractYouTubeId(input.value);

  if (!id) {
    setStatus("Link invalido. Cole uma URL do YouTube valida ou um ID de 11 caracteres.", "error");
    resultBox.hidden = true;
    player.src = "";
    return;
  }

  renderVideo(id);
  setStatus("Video carregado com sucesso.", "ok");
});

copyButton.addEventListener("click", async () => {
  if (!idSpan.textContent) return;
  try {
    await navigator.clipboard.writeText(idSpan.textContent);
    setStatus("ID copiado para a area de transferencia.", "ok");
  } catch {
    setStatus("Nao foi possivel copiar automaticamente neste navegador.", "error");
  }
});

input.addEventListener("paste", () => {
  setTimeout(() => {
    const id = extractYouTubeId(input.value);
    if (id) {
      renderVideo(id);
      setStatus("ID detectado automaticamente apos colar o link.", "ok");
    }
  }, 0);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      setStatus("O modo instalavel nao pode ser registrado neste ambiente.", "error");
    });
  });
}
