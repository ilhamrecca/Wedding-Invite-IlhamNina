const assetRoot = "./public/assets";

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function resetScrollTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

const groomPhotos = [
  "ANG_0500.webp",
  "ANG_0705.webp",
  "ANG_0778.webp",
  "HER00209.webp",
  "HER00217.webp",
  "HER00240.webp",
  "HER00305.webp",
  "HER02087.webp",
].map((file) => `${assetRoot}/photos/Groom/${file}`);

const bridePhotos = [
  "ANG_0472.webp",
  "ANG_0474.webp",
  "ANG_0680.webp",
  "ANG_0688.webp",
  "ANG_0745.webp",
  "ANG_0754.webp",
  "ANG_0760.webp",
  "HER00125.webp",
  "HER00143.webp",
  "HER00180.webp",
  "HER00184.webp",
  "HER02107.webp",
].map((file) => `${assetRoot}/photos/Bride/${file}`);

const couplePhotos = [
  "ANG_0382.webp",
  "ANG_0388.webp",
  "ANG_0463.webp",
  "ANG_0558.webp",
  "ANG_0560.webp",
  "ANG_0561.webp",
  "ANG_0575.webp",
  "ANG_0582.webp",
  "ANG_0584.webp",
  "ANG_0585.webp",
  "ANG_0599.webp",
  "ANG_0606.webp",
  "ANG_0611.webp",
  "ANG_0638.webp",
  "ANG_0663.webp",
  "ANG_0678.webp",
  "HER00011.webp",
  "HER00078.webp",
  "HER00545.webp",
  "HER00557.webp",
  "HER00608.webp",
  "HER00623.webp",
  "HER00667.webp",
  "HER00689.webp",
  "HER00695.webp",
  "HER00712.webp",
  "HER00818.webp",
  "HER00838.webp",
  "HER00852.webp",
  "HER00863.webp",
  "HER00905.webp",
  "HER00987.webp",
  "HER00996.webp",
  "HER01011.webp",
  "HER01126.webp",
  "HER01132.webp",
  "HER01382.webp",
  "HER01385.webp",
  "HER01434.webp",
  "HER01476.webp",
  "HER01481.webp",
  "HER01510.webp",
  "HER01520.webp",
  "HER01530.webp",
  "HER01581.webp",
  "HER01627.webp",
  "HER01647.webp",
  "HER01698.webp",
  "HER01792.webp",
  "HER01875.webp",
  "HER02126.webp",
  "HER02133.webp",
  "HER02137.webp",
  "HER02141.webp",
  "HER02150.webp",
  "HER02233.webp",
  "HER02246.webp",
  "HER02290.webp",
  "HER02454.webp",
  "HER02462.webp",
  "HER09679.webp",
  "HER09758.webp",
  "HER09784.webp",
  "HER09865.webp",
  "HER09912.webp",
  "HER09962.webp",
].map((file) => `${assetRoot}/photos/Couple/${file}`);

const storyPhotos = couplePhotos.map((src) =>
  src.replace("/photos/Couple/", "/photos/Couple/story/").replace(/\.webp$/, ".jpg")
);

const photos = couplePhotos;
const videos = {
  desktop: `${assetRoot}/video/wedding-desktop.mp4`,
  mobile: `${assetRoot}/video/wedding-mobile.mp4`,
};
const selectedVideo = matchMedia("(max-width: 720px), (pointer: coarse)").matches
  ? videos.mobile
  : videos.desktop;
const shouldPrimeVideoForSafari = /iP(ad|hone|od)/.test(navigator.userAgent)
  && /WebKit/.test(navigator.userAgent)
  && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
const heroVideoTransitionViewports = 1.45;

let activeModalIndex = 0;
let siteReady = false;
let siteStarted = false;
let musicMuted = false;
let videoStarted = false;
let videoPending = false;
let videoFinished = false;
let videoLockY = 0;
let videoDelayTimer = null;
let videoSkippedToFinale = false;
let videoUnlocked = false;
let videoUnlocking = false;
let videoPrimeTimer = null;
let lastVideoSkipAt = 0;
let bgmFadeTimer = null;
let selectedVideoBlobUrl = "";
let heroBurstPlayed = false;
let musicPausedByInactiveTab = false;
let heavyScrollTarget = 0;
let heavyScrollFrame = 0;
let lastRenderState = "";
let modalPhotoRequestId = 0;
const preloadedImageUrls = new Map();

const loader = document.querySelector("#loader");
const loaderMark = document.querySelector("#loader-mark");
const loaderText = document.querySelector("#loader-text");
const loaderBar = document.querySelector("#loader-bar");
const opening = document.querySelector("#opening");
const guestName = document.querySelector("#guest-name");
const heroBurst = document.querySelector("#hero-burst");
const heroLogoTitle = document.querySelector("#hero-logo-title");
const videoSection = document.querySelector("#video-section");
const video = document.querySelector("#wedding-video");
const videoFallback = document.querySelector("#video-fallback");
const muteVideoButton = document.querySelector("#mute-video");
const skipVideoButton = document.querySelector("#skip-video");
const replayVideoButton = document.querySelector("#replay-video");
const videoScrollPrompt = document.querySelector(".video-scroll-prompt");
const bgm = document.querySelector("#bgm");
const musicToggle = document.querySelector("#music-toggle");
let touchStartY = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(edge0, edge1, value) {
  const x = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function setProgress(value) {
  const percent = Math.round(clamp(value, 0, 100));
  loaderText.textContent = `Menyiapkan hari bahagia ${percent}%`;
  loaderBar.style.width = `${percent}%`;
}

async function injectLoaderLogo() {
  try {
    const response = await fetch(`${assetRoot}/brand/IlhamNina.svg`);
    const svg = await response.text();
    loaderMark.innerHTML = svg;
    if (heroLogoTitle) {
      heroLogoTitle.innerHTML = svg;
      heroLogoTitle.setAttribute("aria-label", "Ilham dan Nina");
      heroLogoTitle.querySelector("svg")?.setAttribute("aria-hidden", "true");
    }
    loaderMark.querySelectorAll("path").forEach((path) => {
      const length = Math.ceil(path.getTotalLength());
      path.style.setProperty("--path-length", length);
    });
    heroLogoTitle?.querySelectorAll("path").forEach((path) => {
      const length = Math.ceil(path.getTotalLength());
      path.style.setProperty("--path-length", length);
    });
  } catch {
    loaderMark.innerHTML = `<img src="${assetRoot}/brand/IlhamNina.svg" alt="" />`;
  }
}

async function injectHeroOrnaments() {
  const ornaments = [...document.querySelectorAll("[data-svg-src]")];
  await Promise.all(
    ornaments.map(async (ornament) => {
      try {
        const response = await fetch(ornament.dataset.svgSrc);
        const svg = await response.text();
        ornament.innerHTML = svg;
        ornament.querySelectorAll("path, circle, line, polyline").forEach((shape) => {
          const length = typeof shape.getTotalLength === "function" ? Math.ceil(shape.getTotalLength()) : 120;
          shape.style.setProperty("--path-length", length);
        });
      } catch {
        ornament.remove();
      }
    })
  );
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ src, ok: true });
    image.onerror = () => resolve({ src, ok: false });
    image.src = src;
  });
}

async function loadGalleryImage(src) {
  if (preloadedImageUrls.has(src)) return { src, ok: true };
  try {
    const response = await fetch(src, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Image failed: ${response.status}`);
    const blobUrl = URL.createObjectURL(await response.blob());
    await loadImage(blobUrl);
    preloadedImageUrls.set(src, blobUrl);
    return { src, ok: true };
  } catch {
    preloadedImageUrls.set(src, src);
    return loadImage(src);
  }
}

function assetUrl(src) {
  return preloadedImageUrls.get(src) || src;
}

async function loadVideoAsset() {
  if (!video) return { src: selectedVideo, ok: false };
  try {
    const response = await fetch(selectedVideo, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Video failed: ${response.status}`);
    const blob = await response.blob();
    if (selectedVideoBlobUrl) URL.revokeObjectURL(selectedVideoBlobUrl);
    selectedVideoBlobUrl = URL.createObjectURL(blob);
    video.src = selectedVideoBlobUrl;
    video.preload = "auto";
    video.load();
    await new Promise((resolve) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }
      const done = () => {
        clearTimeout(timer);
        video.removeEventListener("loadedmetadata", done);
        resolve();
      };
      const timer = setTimeout(done, 1600);
      video.addEventListener("loadedmetadata", done, { once: true });
    });
    return { src: selectedVideo, ok: true };
  } catch {
    video.src = selectedVideo;
    video.preload = "auto";
    video.load();
    return { src: selectedVideo, ok: false };
  }
}

function loadAudio() {
  return new Promise((resolve) => {
    if (!bgm) {
      resolve({ src: "audio", ok: false });
      return;
    }
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ src: bgm.currentSrc || bgm.src, ok });
    };
    const timer = setTimeout(() => finish(true), 3000);
    bgm.addEventListener("canplaythrough", () => finish(true), { once: true });
    bgm.addEventListener("loadeddata", () => finish(true), { once: true });
    bgm.addEventListener("error", () => finish(false), { once: true });
    bgm.load();
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function preloadAssets() {
  await injectLoaderLogo();
  await injectHeroOrnaments();
  const uniqueImages = [...new Set([...groomPhotos, ...bridePhotos, ...storyPhotos])];
  const tasks = [
    ...uniqueImages.map((src) => () => loadGalleryImage(src)),
    () => loadVideoAsset(),
    () => loadAudio(),
  ];
  let completed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor];
      cursor += 1;
      const result = await task();
      completed += 1;
      setProgress((completed / tasks.length) * 100);
    }
  }

  await Promise.all(Array.from({ length: 8 }, worker));
  if (document.fonts?.ready) await document.fonts.ready;
}

function setInviteeName() {
  const params = new URLSearchParams(location.search);
  const rawName = params.get("to") || params.get("guest") || params.get("name");
  const name = rawName
    ? decodeURIComponent(rawName.replace(/\+/g, " ")).trim()
    : "";
  if (guestName) guestName.textContent = name || "Bapak/Ibu/Saudara/i";
  return name; // expose to form pre-fill
}

function buildPersonGallery(containerId, items) {
  const container = document.querySelector(containerId);
  if (!container) return;
  const columns = [[], [], []];
  items.forEach((src, index) => columns[index % columns.length].push({ src, index }));
  container.innerHTML = "";
  columns.forEach((column, columnIndex) => {
    const rail = document.createElement("div");
    rail.className = "person-project__rail";
    rail.style.setProperty("--rail-index", columnIndex);
    rail.style.setProperty("--rail-dir", columnIndex % 2 === 0 ? "1" : "-1");
    column.forEach(({ src, index }) => {
      const figure = document.createElement("figure");
      figure.className = "person-photo";
      if (/\/ANG_/i.test(src)) figure.classList.add("person-photo--rotate");
      figure.innerHTML = `<img src="${assetUrl(src)}" alt="Foto mempelai ${index + 1}" loading="eager" decoding="sync" fetchpriority="high" />`;
      rail.append(figure);
    });
    container.append(rail);
  });
}

function buildGallery() {
  const gallery = document.querySelector("#gallery");
  const columnCount = 4;
  const baseChunkSize = Math.floor(photos.length / columnCount);
  const remainder = photos.length % columnCount;
  let cursor = 0;
  const columns = Array.from({ length: columnCount }, (_, columnIndex) => {
    const chunkSize = baseChunkSize + (columnIndex < remainder ? 1 : 0);
    const start = cursor;
    cursor += chunkSize;
    return photos.slice(start, start + chunkSize).map((src, offset) => ({
      src,
      thumbSrc: storyPhotos[start + offset] || src,
      index: start + offset,
    }));
  });
  const labels = ["Us", "Light", "Vows", "Forever", "Joy", "Home"];
  gallery.innerHTML = "";
  columns.forEach((column, columnIndex) => {
    const motionDir = columnIndex % 2 === 0 ? 1 : -1;
    const displayedColumn = motionDir > 0 ? [...column].reverse() : column;
    const wrapper = document.createElement("div");
    wrapper.className = "gallery__strip-wrapper";
    wrapper.style.setProperty("--line-dir", String(motionDir));
    wrapper.style.setProperty("--line-index", columnIndex);
    const strip = document.createElement("div");
    strip.className = "gallery__strip";
    strip.dataset.motionDir = String(motionDir);
    displayedColumn.forEach(({ thumbSrc, index }) => {
      const button = document.createElement("button");
      button.className = "photo";
      button.type = "button";
      button.dataset.index = index;
      button.innerHTML = `
        <img src="${assetUrl(thumbSrc)}" alt="Foto Ilham dan Nina ${index + 1}" loading="eager" decoding="sync" fetchpriority="high" />
        <span class="photo__name">${labels[index % labels.length]}</span>
      `;
      strip.append(button);
    });
    wrapper.append(strip);
    gallery.append(wrapper);
  });
}

async function decodeRenderedGalleryImages() {
  const images = [...document.querySelectorAll(".person-project__media img, #gallery img")];
  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve();
          };
          const decode = () => {
            if (typeof image.decode === "function") {
              image.decode().then(finish).catch(finish);
            } else {
              finish();
            }
          };
          const timer = setTimeout(finish, 2200);
          if (image.complete && image.naturalWidth > 0) {
            decode();
            return;
          }
          image.addEventListener("load", decode, { once: true });
          image.addEventListener("error", finish, { once: true });
        })
    )
  );
}

function playHeroBurst() {
  if (!heroBurst || heroBurstPlayed) return;
  heroBurstPlayed = true;
  heroBurst.innerHTML = "";
  for (let index = 0; index < 36; index += 1) {
    const spark = document.createElement("span");
    spark.style.setProperty("--angle", `${(360 / 36) * index + Math.random() * 8}deg`);
    spark.style.setProperty("--distance", `${Math.random() * 32 + 22}vmin`);
    spark.style.setProperty("--delay", `${Math.random() * 260}ms`);
    heroBurst.append(spark);
  }
}

function playPersonFanfare(article) {
  const fanfare = article.querySelector(".person-fanfare");
  if (!fanfare) return;
  fanfare.innerHTML = "";
  for (let side = 0; side < 2; side += 1) {
    for (let index = 0; index < 18; index += 1) {
      const spark = document.createElement("span");
      spark.className = side === 0 ? "is-left" : "is-right";
      spark.style.setProperty("--angle", `${side === 0 ? -72 + index * 5 : 72 - index * 5}deg`);
      spark.style.setProperty("--distance", `${Math.random() * 22 + 22}vmin`);
      spark.style.setProperty("--delay", `${index * 18}ms`);
      fanfare.append(spark);
    }
  }
  article.classList.remove("is-fanfare");
  void article.offsetWidth;
  article.classList.add("is-fanfare");
}

function setupPersonFanfare() {
  document.querySelectorAll(".person-project__trigger").forEach((button) => {
    button.addEventListener("click", () => playPersonFanfare(button.closest(".person-project")));
  });
}

function setupGalleryModal() {
  const modal = document.querySelector("#gallery-modal");
  const modalImage = document.querySelector("#modal-image");
  const close = document.querySelector("#close-modal");
  const prev = document.querySelector("#prev-photo");
  const next = document.querySelector("#next-photo");

  async function showPhoto(index) {
    activeModalIndex = (index + photos.length) % photos.length;
    const requestId = (modalPhotoRequestId += 1);
    const originalSrc = photos[activeModalIndex];
    const thumbnailSrc = storyPhotos[activeModalIndex] || originalSrc;
    modal.classList.add("is-loading");
    modalImage.src = assetUrl(thumbnailSrc);
    await loadGalleryImage(originalSrc);
    if (requestId !== modalPhotoRequestId || activeModalIndex !== (index + photos.length) % photos.length) return;
    modalImage.src = assetUrl(originalSrc);
    modal.classList.remove("is-loading");
  }

  document.querySelector("#gallery").addEventListener("click", (event) => {
    const button = event.target.closest(".photo");
    if (!button) return;
    showPhoto(Number(button.dataset.index));
    modal.showModal();
  });

  close.addEventListener("click", () => modal.close());
  prev.addEventListener("click", () => showPhoto(activeModalIndex - 1));
  next.addEventListener("click", () => showPhoto(activeModalIndex + 1));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
  addEventListener("keydown", (event) => {
    if (!modal.open) return;
    if (event.key === "ArrowLeft") showPhoto(activeModalIndex - 1);
    if (event.key === "ArrowRight") showPhoto(activeModalIndex + 1);
  });
}

function setupCountdown() {
  const target = new Date("2026-07-05T08:00:00+08:00").getTime();
  const units = {
    days: document.querySelector("#days"),
    hours: document.querySelector("#hours"),
    minutes: document.querySelector("#minutes"),
    seconds: document.querySelector("#seconds"),
  };

  function tick() {
    const distance = Math.max(0, target - Date.now());
    units.days.textContent = String(Math.floor(distance / 86400000)).padStart(2, "0");
    units.hours.textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, "0");
    units.minutes.textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, "0");
    units.seconds.textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, "0");
  }

  tick();
  setInterval(tick, 1000);
}

function updateMusicButton() {
  if (!musicToggle) return;
  musicToggle.classList.toggle("is-muted", musicMuted);
  musicToggle.setAttribute("aria-label", musicMuted ? "Nyalakan musik latar" : "Matikan musik latar");
}

function setVideoReplayUi(visible) {
  if (replayVideoButton) {
    replayVideoButton.classList.add("icon-button--replay");
    replayVideoButton.setAttribute("aria-label", "Putar ulang video");
    replayVideoButton.style.opacity = visible ? "1" : "";
    replayVideoButton.style.visibility = visible ? "visible" : "";
    replayVideoButton.style.pointerEvents = visible ? "auto" : "";
    replayVideoButton.style.transform = visible ? "translate(-50%, -50%) scale(1)" : "";
  }
  if (videoScrollPrompt) {
    videoScrollPrompt.style.opacity = visible ? "1" : "";
    videoScrollPrompt.style.visibility = visible ? "visible" : "";
    videoScrollPrompt.style.transform = visible ? "translate(-50%, -50%)" : "";
  }
}

function revealVideoFrame() {
  if (!document.body.classList.contains("video-playing") && !document.body.classList.contains("video-ended")) return;
  document.body.classList.add("video-frame-visible");
}

function stopBgmFade() {
  if (!bgmFadeTimer) return;
  clearInterval(bgmFadeTimer);
  bgmFadeTimer = null;
}

function stopVideoPrime() {
  if (!videoPrimeTimer) return;
  clearInterval(videoPrimeTimer);
  videoPrimeTimer = null;
}

async function unlockVideoPlayback() {
  if (!shouldPrimeVideoForSafari) return false;
  if (!video || videoUnlocked) return true;
  if (!video.src) video.src = selectedVideo;
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 0;
  updateVideoMuteButton();
  videoUnlocking = true;
  try {
    await video.play();
    videoPrimeTimer = setInterval(() => {
      if (!video || !videoUnlocking) return;
      if (video.currentTime > 0.45) video.currentTime = 0.04;
    }, 220);
    videoUnlocked = true;
    return true;
  } catch {
    video.pause();
    video.volume = 1;
    video.muted = false;
    video.defaultMuted = false;
    updateVideoMuteButton();
    return false;
  }
}

async function playVideoUnmuted({ reset = false } = {}) {
  if (!video) return false;
  const primedPlaying = videoUnlocked && !video.paused;
  stopVideoPrime();
  videoUnlocking = false;
  if (!video.src) video.src = selectedVideo;
  if (reset && !primedPlaying) video.currentTime = 0;
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 1;
  updateVideoMuteButton();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await video.play();
      return true;
    } catch {
      await delay(180);
    }
  }
  return false;
}

async function resumeVideoFromGesture() {
  if (!video || videoFinished || !document.body.classList.contains("video-playing")) return;
  if (!video.paused && !video.muted && video.volume > 0) return;
  const played = await playVideoUnmuted({ reset: false });
  if (played) {
    videoFallback.classList.remove("is-visible");
    videoFallback.setAttribute("aria-hidden", "true");
  }
}

function resumeBgmFromGesture() {
  if (!siteStarted || musicMuted || document.body.classList.contains("video-playing")) return;
  if (!bgm || !bgm.paused) return;
  resumeBgm();
}

function pauseBgm() {
  if (!bgm) return;
  stopBgmFade();
  bgm.pause();
}

function pauseBgmForInactiveTab() {
  if (!bgm || bgm.paused) return;
  musicPausedByInactiveTab = true;
  pauseBgm();
}

function resumeBgmAfterInactiveTab() {
  if (!musicPausedByInactiveTab) return;
  musicPausedByInactiveTab = false;
  if (!siteStarted || musicMuted || document.body.classList.contains("video-playing")) return;
  resumeBgm();
}

function fadeBgmOut(duration = 2800) {
  if (!bgm || bgm.paused || musicMuted) return Promise.resolve();
  stopBgmFade();
  const startVolume = bgm.volume || 0.42;
  const startedAt = Date.now();
  return new Promise((resolve) => {
    bgmFadeTimer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      bgm.volume = startVolume * (1 - progress);
      if (progress >= 1) {
        stopBgmFade();
        bgm.pause();
        bgm.volume = 0.42;
        resolve();
      }
    }, 60);
  });
}

function shouldHoldMusic() {
  return videoStarted && !videoPending && video && !video.ended && !video.paused;
}

function resumeBgm() {
  if (!bgm || musicMuted || shouldHoldMusic()) return Promise.resolve(false);
  stopBgmFade();
  bgm.volume = 0.42;
  bgm.muted = false;
  const playAttempt = bgm.play();
  if (!playAttempt) return Promise.resolve(!bgm.paused);
  return playAttempt
    .then(() => {
      updateMusicButton();
      return true;
    })
    .catch(() => false);
}

async function startWeddingVideo() {
  if (videoStarted || !siteStarted || !video) return;
  videoStarted = true;
  videoPending = false;
  videoFinished = false;
  videoSkippedToFinale = false;
  videoLockY = Math.round(videoSection.offsetTop);
  document.body.classList.add("video-playing");
  document.body.classList.remove("video-ended", "video-can-skip", "video-frame-visible");
  videoSection?.classList.remove("is-replay-ready");
  setVideoReplayUi(false);
  window.scrollTo({ top: videoLockY, behavior: "auto" });
  videoFallback.classList.remove("is-visible");
  videoFallback.setAttribute("aria-hidden", "true");
  pauseBgm();
  if (videoFinished) return;
  document.body.classList.add("video-can-skip");
  const played = await playVideoUnmuted({ reset: true });
  if (!played) {
    videoFallback.classList.add("is-visible");
    videoFallback.setAttribute("aria-hidden", "false");
  }
}

function finishVideoSequence() {
  if (videoFinished) return;
  clearTimeout(videoDelayTimer);
  videoPending = false;
  videoFinished = true;
  videoSkippedToFinale = false;
  document.body.classList.remove("video-playing", "video-can-skip");
  document.body.classList.add("video-ended");
  document.body.classList.add("video-frame-visible");
  videoSection?.classList.add("is-replay-ready");
  setVideoReplayUi(true);
  video?.classList.add("is-ended");
  if (video) video.muted = false;
  updateVideoMuteButton();
  resumeBgm();
}

async function replayWeddingVideo() {
  if (!video || !siteStarted) return;
  clearTimeout(videoDelayTimer);
  videoStarted = true;
  videoPending = false;
  videoFinished = false;
  videoSkippedToFinale = false;
  videoLockY = Math.round(videoSection.offsetTop);
  document.body.classList.add("video-playing", "video-can-skip");
  document.body.classList.remove("video-ended", "video-frame-visible");
  videoSection?.classList.remove("is-replay-ready");
  setVideoReplayUi(false);
  window.scrollTo({ top: videoLockY, behavior: "auto" });
  videoFallback.classList.remove("is-visible");
  videoFallback.setAttribute("aria-hidden", "true");
  pauseBgm();
  video.classList.remove("is-ended");
  const played = await playVideoUnmuted({ reset: true });
  if (!played) {
    videoFallback.classList.add("is-visible");
    videoFallback.setAttribute("aria-hidden", "false");
  }
}

function skipVideoSection() {
  if (!document.body.classList.contains("video-can-skip")) return;
  const now = Date.now();
  if (now - lastVideoSkipAt < 700) return;
  lastVideoSkipAt = now;
  clearTimeout(videoDelayTimer);
  if (video) {
    video.pause();
    video.muted = true;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.max(0, video.duration - 0.1);
    }
  }
  updateVideoMuteButton();
  finishVideoSequence();
}

function updateVideoMuteButton() {
  if (!muteVideoButton || !video) return;
  muteVideoButton.classList.toggle("is-muted", video.muted);
  muteVideoButton.setAttribute("aria-label", video.muted ? "Nyalakan audio video" : "Mute video");
}

function setupVideo() {
  if (!video) return;
  video.preload = "auto";
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.muted = false;
  video.defaultMuted = false;
  updateVideoMuteButton();
  video.addEventListener("play", () => {
    if (!videoUnlocking) pauseBgm();
  });
  video.addEventListener("playing", revealVideoFrame);
  video.addEventListener("timeupdate", () => {
    if (video.currentTime > 0.04) revealVideoFrame();
  });
  video.addEventListener("pause", () => {
    if (
      document.body.classList.contains("video-playing")
      && !videoPending
      && !videoFinished
      && !video.ended
    ) {
      video.play().catch(() => {});
    }
  });
  video.addEventListener("seeked", () => {
    if (document.body.classList.contains("video-playing") && videoSkippedToFinale && video.paused && !video.ended) {
      video.play().catch(() => {});
    }
  });
  video.addEventListener("ended", finishVideoSequence);
  muteVideoButton?.addEventListener("click", () => {
    video.muted = !video.muted;
    updateVideoMuteButton();
  });
  skipVideoButton?.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    skipVideoSection();
  });
  skipVideoButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    skipVideoSection();
  });
  replayVideoButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    replayWeddingVideo();
  });
}

function setupMusic() {
  updateMusicButton();
  if (!musicToggle || !bgm) return;
  musicToggle.addEventListener("click", () => {
    if (!siteStarted) return;
    if (bgm.paused && !musicMuted) {
      resumeBgm();
      return;
    }
    musicMuted = !musicMuted;
    if (musicMuted) pauseBgm();
    else resumeBgm();
    updateMusicButton();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseBgmForInactiveTab();
    else resumeBgmAfterInactiveTab();
  });
  addEventListener("pagehide", pauseBgmForInactiveTab);
  addEventListener("blur", pauseBgmForInactiveTab);
  addEventListener("focus", resumeBgmAfterInactiveTab);
}

function startExperience() {
  if (!siteReady) return Promise.resolve(false);
  if (siteStarted) return resumeBgm();
  siteStarted = true;
  loader.classList.add("is-started");
  loaderText.textContent = "Let's scroll and roll";
  document.body.classList.remove("is-loading");
  document.body.classList.add("site-started");
  const musicStart = resumeBgm();
  if (!shouldPrimeVideoForSafari) return musicStart;
  const videoUnlock = unlockVideoPlayback();
  return Promise.allSettled([musicStart, videoUnlock]).then((results) => (
    results[0]?.value === true || results[1]?.value === true
  ));
}

function setupStartGesture() {
  const startEvents = ["pointerdown", "click", "touchend", "keydown"];
  const start = () => {
    startExperience().then((audioStarted) => {
      if (audioStarted || !bgm) {
        startEvents.forEach((eventName) => removeEventListener(eventName, start));
      }
    });
  };
  startEvents.forEach((eventName) => addEventListener(eventName, start));
}

function setupGiftCopy() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const original = button.textContent;
    button.addEventListener("click", async () => {
      const value = button.dataset.copy || "";
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const input = document.createElement("input");
        input.value = value;
        document.body.append(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      button.textContent = "Tersalin";
      setTimeout(() => {
        button.textContent = original;
      }, 1400);
    });
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

async function setupWishes() {
  const form = document.querySelector("#wish-form");
  const nameInput = document.querySelector("#wish-name");
  const messageInput = document.querySelector("#wish-message");
  const list = document.querySelector("#wish-list");
  const submitBtn = form?.querySelector("button[type='submit']");

  // Pre-fill name from URL param
  const params = new URLSearchParams(location.search);
  const rawParam = params.get("to") || params.get("guest") || params.get("name");
  const urlName = rawParam ? decodeURIComponent(rawParam.replace(/\+/g, " ")).trim() : "";
  if (urlName && nameInput) nameInput.value = urlName;

  const seeded = [
    {
      name: "Keluarga & Sahabat",
      message: "Semoga lancar sampai hari bahagia dan menjadi keluarga yang sakinah, mawaddah, warahmah.",
    },
  ];

  function renderWishes(wishes) {
    if (!list) return;
    list.innerHTML = (wishes.length ? wishes : seeded)
      .map(
        (wish) => `
          <article class="wish">
            <strong>${escapeHtml(wish.name)}</strong>
            <p>${escapeHtml(wish.message)}</p>
          </article>
        `
      )
      .join("");
  }

  // ── Fallback: localStorage ─────────────────────────────────────────────────
  function setupLocalWishes() {
    const key = "ilham-nina-wishes-v1";
    const wishes = JSON.parse(localStorage.getItem(key) || "null") || [...seeded];
    renderWishes(wishes);
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      wishes.unshift({
        name: nameInput.value.trim(),
        message: messageInput.value.trim(),
      });
      localStorage.setItem(key, JSON.stringify(wishes.slice(0, 30)));
      form.reset();
      if (urlName && nameInput) nameInput.value = urlName;
      renderWishes(wishes);
    });
  }

  // ── Firebase Firestore ─────────────────────────────────────────────────────
  const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.12.2";

  try {
    const { firebaseConfig } = await import("./firebase-config.js");

    // Check if config is still the placeholder
    if (firebaseConfig.apiKey.startsWith("REPLACE_")) {
      console.info("[Wishes] Firebase not configured yet — using localStorage.");
      setupLocalWishes();
      return;
    }

    const [{ initializeApp }, { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp }] = await Promise.all([
      import(`${FIREBASE_SDK}/firebase-app.js`),
      import(`${FIREBASE_SDK}/firebase-firestore.js`),
    ]);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const col = collection(db, "wishes");

    // Show loading state
    if (list) list.innerHTML = `<p class="wish-loading">Memuat ucapan…</p>`;

    // Real-time listener — updates all open tabs instantly
    const q = query(col, orderBy("timestamp", "desc"), limit(50));
    onSnapshot(
      q,
      (snapshot) => {
        const wishes = snapshot.docs.map((doc) => doc.data());
        renderWishes(wishes);
      },
      (error) => {
        console.warn("[Wishes] Firestore read error:", error);
        setupLocalWishes();
      }
    );

    // Submit handler
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const message = messageInput.value.trim();
      if (!name || !message) return;

      const originalText = submitBtn?.textContent ?? "Kirim Ucapan";
      if (submitBtn) {
        submitBtn.textContent = "Mengirim…";
        submitBtn.disabled = true;
      }

      try {
        await addDoc(col, { name, message, timestamp: serverTimestamp() });
        form.reset();
        if (urlName && nameInput) nameInput.value = urlName;
      } catch (err) {
        console.error("[Wishes] Firestore write error:", err);
        // Graceful degradation: save locally if Firestore write fails
        const key = "ilham-nina-wishes-v1";
        const local = JSON.parse(localStorage.getItem(key) || "null") || [];
        local.unshift({ name, message });
        localStorage.setItem(key, JSON.stringify(local.slice(0, 30)));
        renderWishes(local);
        form.reset();
        if (urlName && nameInput) nameInput.value = urlName;
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }
    });

  } catch (err) {
    console.warn("[Wishes] Firebase import failed — using localStorage:", err);
    setupLocalWishes();
  }
}

function updateHeroScroll() {
  const rect = opening.getBoundingClientRect();
  const videoRect = videoSection?.getBoundingClientRect();
  const heroVideoTransitionSpan = innerHeight * heroVideoTransitionViewports;
  const shouldUpdateHero =
    rect.bottom > -innerHeight * 0.25
    || (!!videoRect && videoRect.top < heroVideoTransitionSpan + innerHeight * 0.15 && videoRect.bottom > -innerHeight * 0.25);
  if (!shouldUpdateHero) return;
  const travel = Math.max(1, opening.offsetHeight - innerHeight);
  const progress = clamp(-rect.top / travel);
  const logoProgress = clamp(progress / 0.54);
  const blackProgress = videoRect ? clamp((heroVideoTransitionSpan - videoRect.top) / heroVideoTransitionSpan) : 0;
  const logoDraw = smoothStep(0.08, 0.54, progress);
  const frameDraw = smoothStep(0.05, 0.46, progress);
  const textReveal = smoothStep(0.18, 0.56, progress);
  const heroZoom = smoothStep(0.54, 0.74, progress);
  const heroSettled = progress >= 0.7 && blackProgress < 0.01;
  opening.style.setProperty("--hero-progress", progress.toFixed(4));
  opening.style.setProperty("--logo-progress", logoProgress.toFixed(4));
  opening.style.setProperty("--black-progress", blackProgress.toFixed(4));
  opening.style.setProperty("--logo-draw", logoDraw.toFixed(4));
  opening.style.setProperty("--frame-draw", frameDraw.toFixed(4));
  opening.style.setProperty("--text-reveal", textReveal.toFixed(4));
  opening.style.setProperty("--hero-zoom", heroZoom.toFixed(4));
  opening.style.setProperty("--text-blur", `${((1 - textReveal) * 10).toFixed(2)}px`);
  opening.style.setProperty("--text-y", `${((1 - textReveal) * 0.9).toFixed(3)}rem`);
  document.documentElement.style.setProperty("--hero-progress", progress.toFixed(4));
  document.documentElement.style.setProperty("--logo-progress", logoProgress.toFixed(4));
  document.documentElement.style.setProperty("--black-progress", blackProgress.toFixed(4));
  document.documentElement.style.setProperty("--logo-draw", logoDraw.toFixed(4));
  document.documentElement.style.setProperty("--frame-draw", frameDraw.toFixed(4));
  document.documentElement.style.setProperty("--text-reveal", textReveal.toFixed(4));
  document.documentElement.style.setProperty("--hero-zoom", heroZoom.toFixed(4));
  document.body.classList.toggle("hero-settled", heroSettled);
  updateSvgDraw("#hero-logo-title path", logoDraw);
  updateSvgDraw(".hero-frame__ornament path, .hero-frame__ornament circle, .hero-frame__ornament line, .hero-frame__ornament polyline", frameDraw);
  if (siteStarted && !videoStarted && !videoFinished && blackProgress >= 0.995) {
    startWeddingVideo();
  }
}

function updateSvgDraw(selector, progress) {
  document.querySelectorAll(selector).forEach((shape) => {
    const cachedLength = Number.parseFloat(shape.style.getPropertyValue("--path-length"));
    const length = cachedLength || (typeof shape.getTotalLength === "function" ? shape.getTotalLength() : 120);
    shape.style.strokeDasharray = String(length);
    shape.style.strokeDashoffset = String(length * (1 - progress));
    shape.style.fillOpacity = String(progress);
    shape.style.opacity = String(progress);
  });
}

function updateVideoScroll() {
  if (!videoSection) return;
  const rect = videoSection.getBoundingClientRect();
  const travel = Math.max(1, videoSection.offsetHeight - innerHeight);
  const progress = clamp(-rect.top / travel);
  videoSection.style.setProperty("--video-progress", progress.toFixed(4));
  if (document.body.classList.contains("video-playing") && Math.abs(scrollY - videoLockY) > 2) {
    window.scrollTo({ top: videoLockY, behavior: "auto" });
  }
}

function updateScrollDriven() {
  updateHeroScroll();
  updateVideoScroll();
}

function maxScrollTop() {
  return Math.max(0, document.documentElement.scrollHeight - innerHeight);
}

function cancelHeavyScroll() {
  if (heavyScrollFrame) cancelAnimationFrame(heavyScrollFrame);
  heavyScrollFrame = 0;
  heavyScrollTarget = scrollY;
}

function elementInViewport(element, margin = 0) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.top < innerHeight + margin && rect.bottom > -margin;
}

function animateHeavyScroll() {
  if (isHeavyScrollBlocked()) {
    cancelHeavyScroll();
    return;
  }
  const delta = heavyScrollTarget - scrollY;
  if (Math.abs(delta) < 0.45) {
    heavyScrollFrame = 0;
    heavyScrollTarget = scrollY;
    return;
  }
  window.scrollTo({ top: scrollY + delta * 0.16, behavior: "auto" });
  heavyScrollFrame = requestAnimationFrame(animateHeavyScroll);
}

function isHeavyScrollBlocked() {
  return (
    elementInViewport(opening)
    || elementInViewport(videoSection, innerHeight * 0.2)
    || elementInViewport(document.querySelector("#story"))
    || document.body.classList.contains("is-loading")
    || document.body.classList.contains("video-playing")
  );
}

function shouldUseHeavyWheel(event) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey) return false;
  if (matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return false;
  if (isHeavyScrollBlocked()) return false;
  if (document.querySelector(".gallery-modal")?.open) return false;
  return true;
}

function handleHeavyWheel(event) {
  if (!shouldUseHeavyWheel(event)) return;
  event.preventDefault();
  const normalizedDelta = event.deltaY * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? innerHeight : 1);
  if (!heavyScrollFrame) heavyScrollTarget = scrollY;
  heavyScrollTarget = clamp(heavyScrollTarget + normalizedDelta * 0.68, 0, maxScrollTop());
  if (!heavyScrollFrame) heavyScrollFrame = requestAnimationFrame(animateHeavyScroll);
}

function setupScrollListeners() {
  addEventListener(
    "scroll",
    () => {
      if (!heavyScrollFrame) heavyScrollTarget = scrollY;
    },
    { passive: true }
  );
  addEventListener("touchstart", (event) => {
    touchStartY = event.touches[0]?.clientY ?? 0;
  }, { passive: true });
  addEventListener("pointerdown", () => {
    resumeBgmFromGesture();
    resumeVideoFromGesture();
  }, { passive: true });
  addEventListener("wheel", guardLockedScroll, { passive: false, capture: true });
  addEventListener("wheel", handleHeavyWheel, { passive: false });
  addEventListener("touchmove", guardLockedScroll, { passive: false, capture: true });
  addEventListener("keydown", guardLockedKeys, { capture: true });
  addEventListener("resize", () => {
    heavyScrollTarget = clamp(heavyScrollTarget || scrollY, 0, maxScrollTop());
    updateScrollDriven();
  });
}

function startScrollRenderLoop() {
  const render = () => {
    const state = `${Math.round(scrollY)}:${innerWidth}:${innerHeight}:${siteStarted ? 1 : 0}`;
    if (state !== lastRenderState) {
      lastRenderState = state;
      updateScrollDriven();
    }
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}

function guardLockedScroll(event) {
  if (document.body.classList.contains("is-loading")) {
    cancelHeavyScroll();
    event.preventDefault();
    event.stopImmediatePropagation();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  resumeBgmFromGesture();

  if (siteStarted && !videoStarted && !videoFinished && videoSection) {
    const deltaY = event.type === "wheel"
      ? event.deltaY * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? innerHeight : 1)
      : (touchStartY - (event.touches[0]?.clientY ?? touchStartY)) * 4;
    const transitionStart = videoSection.offsetTop - innerHeight * heroVideoTransitionViewports;
    const transitionEnd = videoSection.offsetTop;
    if (deltaY > 0 && scrollY < transitionEnd && scrollY + deltaY >= transitionStart) {
      cancelHeavyScroll();
      event.preventDefault();
      event.stopImmediatePropagation();
      const maxStep = innerHeight * (event.type === "wheel" ? 0.06 : 0.052);
      const cappedDelta = Math.min(deltaY, maxStep);
      const targetY = clamp(scrollY + cappedDelta, transitionStart, transitionEnd);
      window.scrollTo({ top: targetY, behavior: "auto" });
      if (targetY >= transitionEnd - 1) {
        startWeddingVideo();
      } else {
        updateScrollDriven();
      }
      return;
    }
  }

  if (!document.body.classList.contains("video-playing")) return;
  cancelHeavyScroll();
  event.preventDefault();
  event.stopImmediatePropagation();
  resumeVideoFromGesture();
  window.scrollTo({ top: videoLockY, behavior: "auto" });
}

function guardLockedKeys(event) {
  const scrollKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "End", "Home", " "];
  if (!scrollKeys.includes(event.key)) return;
  if (document.body.classList.contains("is-loading")) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  if (document.body.classList.contains("video-playing")) {
    event.preventDefault();
    resumeVideoFromGesture();
    window.scrollTo({ top: videoLockY, behavior: "auto" });
  }
}

async function init() {
  resetScrollTop();
  document.body.classList.add("is-loading");
  setInviteeName();
  setupVideo();
  setupMusic();
  setupScrollListeners();
  await preloadAssets();
  buildPersonGallery("#groom-gallery", groomPhotos);
  buildPersonGallery("#bride-gallery", bridePhotos);
  buildGallery();
  await decodeRenderedGalleryImages();
  setupPersonFanfare();
  setupGalleryModal();
  setupCountdown();
  setupGiftCopy();
  // Fire-and-forget: Firebase SDK loads asynchronously without delaying the loader
  setupWishes().catch((err) => console.warn("[init] setupWishes error:", err));
  startScrollRenderLoop();
  setupStartGesture();
  updateScrollDriven();
  setProgress(100);
  siteReady = true;
  loader.classList.add("is-ready");
  loaderText.textContent = "Tap to open invitation";
}

addEventListener("pageshow", resetScrollTop);
addEventListener("beforeunload", resetScrollTop);
requestAnimationFrame(resetScrollTop);

init();
