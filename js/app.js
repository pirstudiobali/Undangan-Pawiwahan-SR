const PDFJS_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/build/pdf.mjs";
const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.5.438/build/pdf.worker.mjs";
const APP_ROOT_URL = new URL("./", window.location.href);
const PDF_URL = new URL("documents/undangan-master.pdf", APP_ROOT_URL).href;

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const errorMessageEl = document.getElementById("error-message");
const bookEl = document.getElementById("book");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const pageNumberInput = document.getElementById("page-number");
const pageTotalEl = document.getElementById("page-total");
const fullscreenButton = document.getElementById("fullscreen-button");
const readerStage = document.getElementById("reader-stage");

let pageFlip = null;
let pageCount = 0;
let bookReady = false;
let recipientObservers = [];

const musicAudio = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");
let musicAutoStartAttempted = false;

console.info("[Flipbook final + musik V4] Memuat PDF:", PDF_URL);

function setVisible(element, visible, displayValue = "") {
  if (!element) return;
  if (visible) {
    element.hidden = false;
    element.removeAttribute("hidden");
    element.style.removeProperty("display");
    if (displayValue) element.style.display = displayValue;
  } else {
    element.hidden = true;
    element.setAttribute("hidden", "");
    element.style.setProperty("display", "none", "important");
  }
}

function getGuestName() {
  const params = new URLSearchParams(window.location.search);
  const rawName = params.get("to") || "Tamu Undangan";
  const cleanName = rawName.trim().replace(/\s+/g, " ");
  return Array.from(cleanName).slice(0, 100).join("") || "Tamu Undangan";
}

function updateControls(currentIndex) {
  const current = Math.max(0, Math.min(pageCount - 1, Number(currentIndex) || 0));
  pageNumberInput.value = String(current + 1);
  pageNumberInput.max = String(Math.max(1, pageCount));
  pageTotalEl.textContent = String(pageCount || "—");
  prevButton.disabled = !bookReady || current <= 0;
  nextButton.disabled = !bookReady || current >= pageCount - 1;
}

function showError(message) {
  console.error("[Flipbook final] Gagal menampilkan buku:", message);
  bookReady = false;
  setVisible(loadingEl, false);
  setVisible(bookEl, false);
  errorMessageEl.textContent = message;
  setVisible(errorEl, true, "flex");
  updateControls(0);
}

function getPageFlipLibrary() {
  if (window.St && typeof window.St.PageFlip === "function") return window.St.PageFlip;
  throw new Error("Pustaka animasi belum tersedia. Periksa koneksi internet, lalu muat ulang halaman.");
}

function fitRecipientName(overlay) {
  const nameNode = overlay?.querySelector(".recipient-name");
  if (!nameNode) return;

  const availableWidth = Math.max(40, overlay.clientWidth - 18);
  const maxFontSize = 15;
  const minFontSize = 8;
  let fontSize = maxFontSize;

  nameNode.style.whiteSpace = "nowrap";
  nameNode.style.fontSize = `${maxFontSize}px`;
  nameNode.style.maxWidth = "none";
  nameNode.style.width = "max-content";

  // Kecilkan ukuran secara bertahap sampai lebar nama muat di dalam bingkai.
  while (nameNode.scrollWidth > availableWidth && fontSize > minFontSize) {
    fontSize = Math.max(minFontSize, fontSize - 0.5);
    nameNode.style.fontSize = `${fontSize}px`;
  }

  // Untuk nama yang sangat panjang, gunakan dua baris kecil daripada keluar dari bingkai.
  if (nameNode.scrollWidth > availableWidth) {
    nameNode.style.width = "100%";
    nameNode.style.maxWidth = "100%";
    nameNode.style.whiteSpace = "normal";
    nameNode.style.overflowWrap = "anywhere";
    nameNode.style.fontSize = `${minFontSize}px`;
  } else {
    nameNode.style.width = "max-content";
    nameNode.style.maxWidth = "100%";
    nameNode.style.whiteSpace = "nowrap";
    nameNode.style.overflowWrap = "normal";
  }
}

function fitAllRecipientNames() {
  document.querySelectorAll(".recipient-overlay").forEach(fitRecipientName);
}

function observeRecipientNames(root) {
  recipientObservers.forEach((observer) => observer.disconnect());
  recipientObservers = [];
  root.querySelectorAll(".recipient-overlay").forEach((overlay) => {
    fitRecipientName(overlay);
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => fitRecipientName(overlay));
      observer.observe(overlay);
      recipientObservers.push(observer);
    }
  });
}

function updateMusicControl() {
  if (!musicAudio || !musicButton) return;
  // Pastikan kontrol musik tetap terlihat meskipun style lama pernah menyembunyikannya.
  musicButton.hidden = false;
  musicButton.removeAttribute("hidden");
  musicButton.style.setProperty("display", "inline-flex", "important");
  musicButton.style.visibility = "visible";
  const isPlaying = !musicAudio.paused && !musicAudio.ended;
  musicButton.classList.toggle("is-playing", isPlaying);
  musicButton.setAttribute("aria-pressed", String(isPlaying));
  musicButton.setAttribute("aria-label", isPlaying ? "Jeda musik" : "Putar musik");
  musicButton.title = isPlaying ? "Jeda musik" : "Putar musik";
  const icon = musicButton.querySelector("span");
  if (icon) icon.textContent = isPlaying ? "Ⅱ" : "♫";
}

let musicPlayPromise = null;
let musicHasStarted = false;

function logAudioFailure(reason, error = musicAudio?.error) {
  const details = {
    reason,
    src: musicAudio?.currentSrc || musicAudio?.src || "(sumber kosong)",
    errorCode: error?.code ?? null,
    networkState: musicAudio?.networkState ?? null,
    readyState: musicAudio?.readyState ?? null,
    mediaError: error?.message || null,
  };
  console.error("[Musik V4] Audio tidak dapat diputar:", details);
  if (musicButton) {
    musicButton.title = "Musik belum dapat diputar. Periksa file assets/background-music.mp3.";
    musicButton.setAttribute("aria-label", "Coba putar musik kembali");
  }
}

function requestMusicPlayback(source = "interaksi pengguna") {
  if (!musicAudio || !musicButton) {
    console.error("[Musik V4] Elemen #background-music atau #music-button tidak ditemukan.");
    return Promise.resolve(false);
  }
  if (!musicAudio.paused && !musicAudio.ended) {
    updateMusicControl();
    return Promise.resolve(true);
  }
  if (musicPlayPromise) return musicPlayPromise;

  musicAudio.loop = true;
  musicAudio.volume = 0.42;
  musicAudio.muted = false;
  musicAudio.preload = "auto";

  // PENTING: play() dipanggil sinkron di dalam handler klik/sentuhan,
  // sebelum ada await, agar browser mengenali interaksi pengguna.
  try {
    const result = musicAudio.play();
    if (!result || typeof result.then !== "function") {
      musicHasStarted = true;
      updateMusicControl();
      console.info(`[Musik V4] Pemutaran dimulai dari ${source}.`);
      return Promise.resolve(true);
    }
    musicPlayPromise = result.then(() => {
      musicHasStarted = true;
      updateMusicControl();
      console.info(`[Musik V4] Berhasil diputar dari ${source}.`, musicAudio.currentSrc);
      return true;
    }).catch((error) => {
      updateMusicControl();
      logAudioFailure(source, error);
      return false;
    }).finally(() => {
      musicPlayPromise = null;
    });
    return musicPlayPromise;
  } catch (error) {
    logAudioFailure(source, error);
    return Promise.resolve(false);
  }
}

function handleReaderGesture(event) {
  if (!readerStage || !musicAudio || !musicButton) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!readerStage.contains(target)) return;
  // Tombol musik punya handler toggle sendiri.
  if (target.closest("#music-button")) return;
  if (musicAudio.paused && !musicHasStarted) {
    void requestMusicPlayback(`gesture ${event.type}`);
  }
}

function toggleBackgroundMusic(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!musicAudio) return;
  if (musicAudio.paused || musicAudio.ended) {
    void requestMusicPlayback("tombol musik toolbar");
  } else {
    musicAudio.pause();
    updateMusicControl();
    console.info("[Musik V4] Dijeda oleh pengguna.");
  }
}

if (musicAudio && musicButton) {
  musicAudio.loop = true;
  musicAudio.preload = "auto";
  musicAudio.volume = 0.42;
  musicButton.hidden = false;
  musicButton.removeAttribute("hidden");
  musicButton.style.setProperty("display", "inline-flex", "important");
  musicButton.style.visibility = "visible";

  musicAudio.addEventListener("play", () => {
    updateMusicControl();
    console.info("[Musik V4] Event play diterima.");
  });
  musicAudio.addEventListener("playing", () => {
    updateMusicControl();
    console.info("[Musik V4] Audio benar-benar sedang diputar.");
  });
  musicAudio.addEventListener("pause", updateMusicControl);
  musicAudio.addEventListener("ended", updateMusicControl);
  musicAudio.addEventListener("loadedmetadata", () => {
    console.info("[Musik V4] Metadata audio berhasil dibaca:", {
      src: musicAudio.currentSrc,
      duration: musicAudio.duration,
    });
  });
  musicAudio.addEventListener("canplay", () => {
    console.info("[Musik V4] File musik siap diputar.");
  }, { once: true });
  musicAudio.addEventListener("error", () => logAudioFailure("event error audio"));
  musicButton.addEventListener("click", toggleBackgroundMusic);

  // Mulai saat tamu pertama kali menyentuh/mengklik buku atau kontrol navigasi.
  // Capture pada readerStage menangkap gesture sebelum StPageFlip memprosesnya.
  readerStage.addEventListener("pointerdown", handleReaderGesture, true);
  readerStage.addEventListener("touchstart", handleReaderGesture, { capture: true, passive: true });
  readerStage.addEventListener("click", handleReaderGesture, true);
  readerStage.addEventListener("keydown", (event) => {
    if (["Enter", " ", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      handleReaderGesture(event);
    }
  }, true);

  // Mulai mengunduh metadata/file lebih awal; playback tetap menunggu interaksi.
  try { musicAudio.load(); } catch (error) { console.warn("[Musik V4] Audio preload gagal:", error); }
  updateMusicControl();
  console.info("[Musik V4] Kontrol siap:", {
    tombolDitemukan: Boolean(musicButton),
    audioDitemukan: Boolean(musicAudio),
    sumber: musicAudio.currentSrc || musicAudio.src,
  });
} else {
  console.error("[Musik V4] Elemen #background-music atau #music-button tidak ditemukan di index.html.");
}

function markBookReady() {
  if (!pageFlip) return;
  bookReady = true;
  setVisible(loadingEl, false);
  setVisible(errorEl, false);
  setVisible(bookEl, true, "block");
  updateControls(pageFlip.getCurrentPageIndex?.() ?? 0);
  fitAllRecipientNames();
}

async function renderPdfToBook() {
  try {
    bookReady = false;
    setVisible(loadingEl, true, "flex");
    setVisible(errorEl, false);
    setVisible(bookEl, false);
    bookEl.replaceChildren();
    updateControls(0);

    const pdfjsLib = await import(PDFJS_URL);
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    const pdf = await pdfjsLib.getDocument({ url: PDF_URL }).promise;
    pageCount = pdf.numPages;
    if (pageCount < 1) throw new Error("PDF tidak memiliki halaman.");

    pageTotalEl.textContent = String(pageCount);
    pageNumberInput.max = String(pageCount);

    const firstPage = await pdf.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    const pageWidth = 420;
    const pageHeight = Math.round(pageWidth * baseViewport.height / baseViewport.width);
    const renderScale = Math.min(2, Math.max(1.35, window.devicePixelRatio || 1.4));
    const pages = [];

    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
      const pdfPage = await pdf.getPage(pageNo);
      const viewport = pdfPage.getViewport({ scale: renderScale });
      const pageElement = document.createElement("div");
      pageElement.className = "page";
      if (pageNo === 1 || pageNo === pageCount) pageElement.dataset.density = "hard";

      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-label", `Halaman ${pageNo}`);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error(`Canvas halaman ${pageNo} tidak dapat dibuat.`);
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await pdfPage.render({ canvasContext: context, viewport }).promise;
      pageElement.appendChild(canvas);

      if (pageNo === 1) {
        const overlay = document.createElement("div");
        overlay.className = "recipient-overlay";
        const nameNode = document.createElement("strong");
        nameNode.className = "recipient-name";
        nameNode.textContent = getGuestName();
        overlay.appendChild(nameNode);
        pageElement.appendChild(overlay);
      }
      pages.push(pageElement);
    }

    setVisible(loadingEl, false);
    setVisible(errorEl, false);
    setVisible(bookEl, true, "block");

    const PageFlip = getPageFlipLibrary();
    pageFlip = new PageFlip(bookEl, {
      width: pageWidth,
      height: pageHeight,
      size: "stretch",
      minWidth: 260,
      maxWidth: 560,
      minHeight: Math.max(300, Math.round(pageHeight * 0.62)),
      maxHeight: Math.round(pageHeight * 1.2),
      showCover: true,
      usePortrait: true,
      autoSize: true,
      maxShadowOpacity: 0.34,
      mobileScrollSupport: true,
      drawShadow: true,
      flippingTime: 780,
      startPage: 0,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 30,
    });

    pageFlip.on("init", () => {
      markBookReady();
      console.info("[Flipbook final] StPageFlip siap.");
    });
    pageFlip.on("flip", (event) => updateControls(event?.data ?? pageFlip.getCurrentPageIndex()));
    pageFlip.on("changeState", (event) => console.debug("[Flipbook final] Status:", event.data));

    pageFlip.loadFromHTML(pages);
    observeRecipientNames(bookEl);

    // Beberapa frame memberi waktu StPageFlip menyusun wrapper dan halaman.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    pageFlip.update();
    markBookReady();

    if (document.fonts?.ready) await document.fonts.ready;
    fitAllRecipientNames();

    console.info("[Flipbook final + musik] Buku berhasil disiapkan:", {
      halaman: pageCount,
      ukuranHalaman: `${pageWidth} x ${pageHeight}`,
      namaPenerima: getGuestName(),
    });
  } catch (error) {
    const message = error?.message || "Terjadi kesalahan saat membaca PDF.";
    if (/404|Missing PDF|Unexpected server response/i.test(message)) {
      showError("File documents/undangan-master.pdf tidak ditemukan atau tidak dapat dibaca.");
    } else {
      showError(message);
    }
  }
}

function flipPrevious(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!bookReady || !pageFlip) return;

  // Mulai musik pada aksi navigasi pertama jika belum pernah diputar.
  // Jangan memulai ulang jika tamu sengaja menjeda musik.
  if (musicAudio?.paused && !musicHasStarted) {
    void requestMusicPlayback("tombol halaman sebelumnya");
  }
  pageFlip.flipPrev();
}

function flipNext(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!bookReady || !pageFlip) return;

  // Mulai musik pada aksi navigasi pertama jika belum pernah diputar.
  // Jangan memulai ulang jika tamu sengaja menjeda musik.
  if (musicAudio?.paused && !musicHasStarted) {
    void requestMusicPlayback("tombol halaman berikutnya");
  }
  pageFlip.flipNext();
}

prevButton.addEventListener("click", flipPrevious);
nextButton.addEventListener("click", flipNext);
pageNumberInput.addEventListener("change", () => {
  if (!bookReady || !pageFlip) return;
  const requested = Number.parseInt(pageNumberInput.value, 10);
  if (!Number.isFinite(requested)) return;
  const bounded = Math.max(1, Math.min(pageCount, requested));
  pageFlip.flip(bounded - 1);
  pageNumberInput.value = String(bounded);
});
pageNumberInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    pageNumberInput.blur();
  }
});

async function toggleFullscreen(event) {
  event?.preventDefault();
  event?.stopPropagation();
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (readerStage.requestFullscreen) {
      await readerStage.requestFullscreen();
    } else {
      readerStage.classList.add("pseudo-fullscreen");
    }
  } catch (error) {
    // Fallback tampilan penuh bila browser menolak Fullscreen API.
    readerStage.classList.add("pseudo-fullscreen");
    console.warn("[Flipbook final] Fullscreen API tidak tersedia; menggunakan mode alternatif.", error);
  }
  pageFlip?.update();
}

fullscreenButton.addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.querySelector("span").textContent = isFullscreen ? "×" : "⛶";
  fullscreenButton.setAttribute("aria-label", isFullscreen ? "Keluar dari layar penuh" : "Layar penuh");
  fullscreenButton.title = isFullscreen ? "Keluar dari layar penuh" : "Layar penuh";
  requestAnimationFrame(() => pageFlip?.update());
});

window.addEventListener("resize", () => {
  fitAllRecipientNames();
  pageFlip?.update();
});

// Navigasi keyboard di desktop, tanpa mengganggu input nomor halaman.
document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "ArrowLeft" && bookReady) flipPrevious();
  if (event.key === "ArrowRight" && bookReady) flipNext();
});

renderPdfToBook();
