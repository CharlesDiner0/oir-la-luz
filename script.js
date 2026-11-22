(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
  const SCALES = { pmaj: [0, 2, 4, 7, 9], pmin: [0, 3, 5, 7, 10], maj: [0, 2, 4, 5, 7, 9, 11], chr: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const noteName = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

  const S = { src: "demo", view: "mix", cols: 5, rows: 3, scale: "pmaj", root: 48, thr: 28, sens: 0.03, cool: 320,
    wave: "triangle", atk: 0.008, rel: 0.7, cut: 3200, rev: 0.3, vol: 0.6, mapVel: true, mapPan: true, mirror: true,
    tint: 0.22, veil: 0, lines: true, notes: true, parts: true,
    mode: "zonas", lx: 0.5, nl: 3, segs: 7, sdur: 6, steps: 16, bright: 90, mapDir: false, invert: false };

  // voces del modo "Varias líneas": cada línea trae su forma de onda, envolvente, octava y filtro
  const VOICES = [
    { name: "golpe", wave: "square", atk: 0.003, rel: 0.18, oct: 12, cut: 5000, color: "#E2FF3B", ej: "ave.wav" },
    { name: "estela", wave: "sine", atk: 0.09, rel: 2.4, oct: 0, cut: 0, color: "#EEF0FF", ej: "auto.wav" },
    { name: "lejano", wave: "sawtooth", atk: 0.02, rel: 1.0, oct: -12, cut: 650, color: "#9A7BFF", ej: "lluvia.wav" },
    { name: "brillo", wave: "triangle", atk: 0.002, rel: 0.6, oct: 24, cut: 0, color: "#5CE1E6", ej: "campana.wav" },
  ];
  const rgba = (hex, a) => "rgba(" + parseInt(hex.slice(1, 3), 16) + "," + parseInt(hex.slice(3, 5), 16) + "," + parseInt(hex.slice(5, 7), 16) + "," + a.toFixed(3) + ")";

  let toastT = 0;
  function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600); }

  // ================= dock =================
  document.querySelectorAll(".trigger").forEach((tr) => tr.addEventListener("click", () => {
    const id = tr.dataset.panel, open = tr.getAttribute("aria-expanded") === "true";
    document.querySelectorAll(".trigger").forEach((t) => { t.setAttribute("aria-expanded", "false"); $(t.dataset.panel).hidden = true; });
    if (!open) { tr.setAttribute("aria-expanded", "true"); $(id).hidden = false; }
  }));
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => {
    const p = b.closest(".panel"); p.hidden = true; document.querySelector('[data-panel="' + p.id + '"]').setAttribute("aria-expanded", "false");
  }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll("[data-close]").forEach((b) => { if (!b.closest(".panel").hidden) b.click(); }); });

  // ================= fuentes =================
  const video = document.createElement("video");
  video.muted = true; video.loop = true; video.playsInline = true;
  let stream = null;
  const demo = document.createElement("canvas"); demo.width = 640; demo.height = 360;
  const dctx = demo.getContext("2d");
  const lanes = [0.22, 0.5, 0.78], cars = [];
  for (let i = 0; i < 7; i++) {
    const lane = i % 3;
    cars.push({ lane, x: Math.random() * 640, v: (lane === 1 ? -1 : 1) * (90 + Math.random() * 160), w: 60 + Math.random() * 70, c: ["#E2FF3B", "#EEF0FF", "#6A6AFF", "#9A7BFF"][i % 4] });
  }
  let birdT = 0;
  function drawDemo(dt) {
    dctx.fillStyle = "#0B0C2C"; dctx.fillRect(0, 0, 640, 360);
    dctx.fillStyle = "#16184E"; lanes.forEach((y) => dctx.fillRect(0, y * 360 - 34, 640, 68));
    dctx.strokeStyle = "rgba(238,240,255,.18)"; dctx.setLineDash([18, 16]); dctx.lineWidth = 2;
    [0.36, 0.64].forEach((y) => { dctx.beginPath(); dctx.moveTo(0, y * 360); dctx.lineTo(640, y * 360); dctx.stroke(); });
    dctx.setLineDash([]);
    for (const c of cars) {
      c.x += c.v * dt;
      if (c.v > 0 && c.x > 700) { c.x = -c.w - Math.random() * 200; c.v = 90 + Math.random() * 160; }
      if (c.v < 0 && c.x < -c.w - 60) { c.x = 640 + Math.random() * 200; c.v = -(90 + Math.random() * 160); }
      dctx.fillStyle = c.c; dctx.fillRect(c.x, lanes[c.lane] * 360 - 24, c.w, 48);
    }
    birdT += dt;
    dctx.fillStyle = "#EEF0FF"; dctx.beginPath(); dctx.arc((birdT * 70) % 760 - 60, 40 + Math.sin(birdT * 2.2) * 18, 7, 0, Math.PI * 2); dctx.fill();
  }

  function setSrc(src, status) {
    S.src = src; prev = null;
    $("srcDemo").setAttribute("aria-pressed", String(src === "demo"));
    $("srcCam").setAttribute("aria-pressed", String(src === "cam" || src === "camoff"));
    $("srcFile").setAttribute("aria-pressed", String(src === "file"));
    $("camCtx").hidden = !(src === "cam" || src === "camoff");
    $("vidCtx").hidden = src !== "file";
    $("camOff").textContent = src === "camoff" ? "Encender cámara" : "Apagar cámara";
    $("status").textContent = status;
  }
  function stopStream() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
  async function startCam() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("sin API");
      stopStream(); video.pause(); video.removeAttribute("src");
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false });
      video.srcObject = stream; await video.play();
      setSrc("cam", "Fuente: cámara");
    } catch (e) {
      toast("Esta vista no permite usar la cámara: abre la versión local o la de GitHub Pages");
      $("status").textContent = "Cámara bloqueada en esta vista · versión local (localhost) o GitHub Pages";
    }
  }
  $("srcDemo").addEventListener("click", () => { stopStream(); video.pause(); setSrc("demo", "Fuente: ejemplo · calle sintética"); });
  $("srcCam").addEventListener("click", startCam);
  $("camOff").addEventListener("click", () => {
    if (S.src === "cam") { stopStream(); video.srcObject = null; setSrc("camoff", "Cámara apagada"); }
    else startCam();
  });
  $("srcFile").addEventListener("click", () => $("fileInput").click());
  $("vChange").addEventListener("click", () => $("fileInput").click());
  $("fileInput").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    stopStream(); video.srcObject = null; video.src = URL.createObjectURL(f); video.loop = $("vLoop").getAttribute("aria-pressed") === "true";
    try { await video.play(); } catch (_) {}
    setSrc("file", "Fuente: " + f.name);
    e.target.value = "";
  });
  $("vPlay").addEventListener("click", () => { video.play().catch(() => {}); });
  $("vPause").addEventListener("click", () => video.pause());
  $("vLoop").addEventListener("click", (e) => {
    video.loop = !video.loop; e.currentTarget.setAttribute("aria-pressed", String(video.loop));
    toast(video.loop ? "Loop activado" : "Loop desactivado");
  });

  // ================= capas =================
  function bindToggle(id, key, after) {
    $(id).addEventListener("click", (e) => { S[key] = !S[key]; e.currentTarget.setAttribute("aria-pressed", String(S[key])); if (after) after(); updVisState(); });
  }
  function updVisState() {
    const on = [S.lines && "líneas", S.notes && "notas", S.parts && "partíc."].filter(Boolean);
    $("stVis").textContent = S.view === "mask" ? "máquina" : on.length ? on.length + " capas" : "solo video";
  }
  bindToggle("tLines", "lines"); bindToggle("tNotes", "notes"); bindToggle("tParts", "parts", () => { parts.length = 0; });
  $("tSignal").addEventListener("click", (e) => { const on = $("signal").hidden; $("signal").hidden = !on; e.currentTarget.setAttribute("aria-pressed", String(on)); });
  $("sigHide").addEventListener("click", () => { $("signal").hidden = true; $("tSignal").setAttribute("aria-pressed", "false"); });

  // ================= audio =================
  let ac = null, main = null, master, analyser, recDest, shape;
  const impulses = new WeakMap();
  function impulse(ctx) {
    if (impulses.has(ctx)) return impulses.get(ctx);
    const len = Math.floor(ctx.sampleRate * 2.6), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    impulses.set(ctx, buf); return buf;
  }
  function buildChain(ctx) {
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = S.cut; filter.Q.value = 0.8;
    const dry = ctx.createGain(), wet = ctx.createGain(), conv = ctx.createConvolver(), out = ctx.createGain();
    conv.buffer = impulse(ctx);
    filter.connect(dry); filter.connect(conv); conv.connect(wet); dry.connect(out); wet.connect(out);
    const ch = { input: filter, filter, dry, wet, out }; setRev(ch); return ch;
  }
  function setRev(ch) { ch.dry.gain.value = 1 - S.rev * 0.6; ch.wet.gain.value = S.rev * 0.9; }
  function initAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    main = buildChain(ac);
    master = ac.createGain(); master.gain.value = S.vol;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    analyser = ac.createAnalyser(); analyser.fftSize = 1024;
    shape = ac.createAnalyser(); shape.fftSize = 2048; main.filter.connect(shape);
    recDest = ac.createMediaStreamDestination();
    main.out.connect(master); master.connect(comp); comp.connect(analyser); analyser.connect(ac.destination); comp.connect(recDest);
  }
  function voice(ctx, inputs, midi, vel, pan, opt) {
    const t = ctx.currentTime + 0.01;
    const wave = opt ? opt.wave : S.wave, atk = opt ? opt.atk : S.atk, rel = opt ? opt.rel : S.rel;
    const o = ctx.createOscillator(); o.type = wave; o.frequency.value = mtof(midi);
    const g = ctx.createGain(), peak = 0.22 * vel, hold = 0.06;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + atk);
    g.gain.setTargetAtTime(peak * 0.6, t + atk, 0.08);
    g.gain.setTargetAtTime(0.0001, t + atk + hold, rel / 4);
    o.connect(g);
    let node = g;
    if (opt && opt.cut) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = opt.cut; f.Q.value = 1.2; g.connect(f); node = f; }
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p); node = p; }
    inputs.forEach((i) => node.connect(i));
    o.start(t); o.stop(t + atk + hold + rel * 1.6 + 0.1);
    return atk + hold + rel * 1.6 + 0.1;
  }
  const soundOn = () => ac && ac.state === "running";
  function updSoundBtn() {
    const on = soundOn();
    $("soundBtn").setAttribute("aria-pressed", String(on));
    $("soundBtn").textContent = on ? "■ Silenciar audio" : "▶ Activar sonido";
    $("noteDl").disabled = !on || (lastMidi == null && lastSampleId == null);
    $("recBtn").disabled = !on && !recording;
    const badge = $("signalStatusBadge");
    const text = $("signalStatusText");
    if (badge && text) {
      badge.classList.toggle("active", on);
      text.textContent = on ? "SEÑAL ACTIVA" : "SEÑAL EN ESPERA";
    }
  }
  $("soundBtn").addEventListener("click", async () => {
    const isFirstTime = !ac;
    if (!ac) initAudio();
    try {
      if (isFirstTime) {
        if (ac.state === "suspended") await ac.resume();
        if (!bankLoaded && !bankLoading) loadBank(ac);
      } else if (ac.state === "running") {
        await ac.suspend();
      } else {
        await ac.resume();
        if (!bankLoaded && !bankLoading) loadBank(ac);
      }
    } catch (_) {}
    updSoundBtn();
  });

  // ================= banco sonoro PULSO 90 =================
  const SOUND_FILES = [
    { id: "01_latido_base", name: "Latido base", file: "sonidos/01_latido_base.wav" },
    { id: "02_latido_rapido", name: "Latido rápido", file: "sonidos/02_latido_rapido.wav" },
    { id: "03_respiracion", name: "Respiración", file: "sonidos/03_respiracion.wav" },
    { id: "04_friccion", name: "Fricción", file: "sonidos/04_friccion.wav" },
    { id: "05_murmullo", name: "Murmullo", file: "sonidos/05_murmullo.wav" },
    { id: "06_desplazamiento", name: "Desplazamiento", file: "sonidos/06_desplazamiento.wav" },
    { id: "07_tension", name: "Tensión", file: "sonidos/07_tension.wav" },
    { id: "08_estallido", name: "Estallido", file: "sonidos/08_estallido.wav" },
  ];

  const SOUND_NAMES = {
    "01_latido_base": "Latido base",
    "02_latido_rapido": "Latido rápido",
    "03_respiracion": "Respiración",
    "04_friccion": "Fricción",
    "05_murmullo": "Murmullo",
    "06_desplazamiento": "Desplazamiento",
    "07_tension": "Tensión",
    "08_estallido": "Estallido",
  };

  const SOUND_MIDI = {
    "01_latido_base": 48,
    "02_latido_rapido": 55,
    "03_respiracion": 52,
    "04_friccion": 50,
    "05_murmullo": 57,
    "06_desplazamiento": 60,
    "07_tension": 64,
    "08_estallido": 72,
  };

  const soundBank = {};
  const bankErrors = {};
  let bankLoaded = false, bankLoading = false;
  let lastSampleId = null;

  const SAMPLE_COOLDOWNS = {
    "01_latido_base": 1200,
    "02_latido_rapido": 1000,
    "03_respiracion": 3500,
    "04_friccion": 1800,
    "05_murmullo": 4000,
    "06_desplazamiento": 2000,
    "07_tension": 4500,
    "08_estallido": 5000,
  };

  const SAMPLE_BASE_VOL = {
    "01_latido_base": 0.70,
    "02_latido_rapido": 0.75,
    "03_respiracion": 0.65,
    "04_friccion": 0.55,
    "05_murmullo": 0.60,
    "06_desplazamiento": 0.68,
    "07_tension": 0.72,
    "08_estallido": 0.90,
  };

  const lastSampleTriggerT = {
    "01_latido_base": -1e9,
    "02_latido_rapido": -1e9,
    "03_respiracion": -1e9,
    "04_friccion": -1e9,
    "05_murmullo": -1e9,
    "06_desplazamiento": -1e9,
    "07_tension": -1e9,
    "08_estallido": -1e9,
  };

  let activeAutoVoices = [];
  // PULSO 90: actividad reciente para reconocer clímax sostenidos, no un único corte.
  let peakBaseline = 0;
  let peakConfirmFrames = 0;


  function cleanAutoVoices() {
    if (!ac) {
      activeAutoVoices = [];
      return 0;
    }
    const cur = ac.currentTime;
    activeAutoVoices = activeAutoVoices.filter((v) => cur < v.endTime);
    return activeAutoVoices.length;
  }

  function isAutoSamplePlaying(soundId) {
    if (!ac) return false;
    const cur = ac.currentTime;
    return activeAutoVoices.some((v) => v.id === soundId && cur < v.endTime);
  }

  async function loadSample(ctx, item) {
    try {
      const res = await fetch(item.file);
      if (!res.ok) throw new Error(`HTTP ${res.status} (${res.statusText || "no encontrado"})`);
      const arrayBuf = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      soundBank[item.id] = audioBuf;
      delete bankErrors[item.id];
      return { id: item.id, ok: true };
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      bankErrors[item.id] = msg;
      console.error(`Error al cargar ${item.file}:`, msg);
      return { id: item.id, ok: false, error: msg };
    }
  }

  async function loadBank(ctx) {
    if (bankLoaded || bankLoading) return;
    bankLoading = true;
    const stEl = $("stBank"), bStEl = $("bankStatus"), bErrEl = $("bankError");
    if (stEl) stEl.textContent = "cargando";
    if (bStEl) bStEl.textContent = "Cargando 8 muestras...";
    const results = await Promise.all(SOUND_FILES.map((item) => loadSample(ctx, item)));
    bankLoading = false;
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      bankLoaded = true;
      if (stEl) stEl.textContent = "8 listos";
      if (bStEl) bStEl.textContent = "8 muestras cargadas correctamente.";
      if (bErrEl) { bErrEl.textContent = ""; bErrEl.hidden = true; }
    } else {
      bankLoaded = false;
      if (stEl) stEl.textContent = `${8 - failed.length}/8`;
      const errMsg = `Error al cargar ${failed.length} muestra(s): ` + failed.map((f) => `${f.id} (${f.error})`).join(", ");
      if (bStEl) bStEl.textContent = "Carga incompleta. Revisa la consola o errores.";
      if (bErrEl) {
        bErrEl.textContent = errMsg;
        bErrEl.hidden = false;
      }
      toast("Error al cargar banco sonoro");
    }
  }

  // Al llegar un clímax, abre espacio mediante un fundido de 90 ms.
  // Se utiliza solo para el estallido; el resto mantiene la mezcla aprobada.
  function freeVoiceForClimax() {
    cleanAutoVoices();
    if (activeAutoVoices.length < 3 || !ac) return;
    const candidate = activeAutoVoices.find((v) => v.id !== "08_estallido");
    if (!candidate) return;
    const t = ac.currentTime;
    const g = candidate.gainNode.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.001, g.value), t);
    g.linearRampToValueAtTime(0, t + 0.09);
    try { candidate.srcNode.stop(t + 0.10); } catch (_) { /* ya terminó */ }
    activeAutoVoices = activeAutoVoices.filter((v) => v !== candidate);
  }

  function playSample(ctx, inputs, id, vel = 1, pan = 0, rate = 1, isAuto = false) {
    const buf = soundBank[id];
    if (!ctx || !buf) return 0;

    if (isAuto) {
      cleanAutoVoices();
      if (activeAutoVoices.length >= 3) {
        return 0; // Límite de polifonía estricto (máximo 3 automáticos)
      }
    }

    const srcNode = ctx.createBufferSource();
    srcNode.buffer = buf;
    srcNode.playbackRate.value = rate;

    const g = ctx.createGain();
    const peak = Math.max(0.01, Math.min(1.2, vel));
    g.gain.setValueAtTime(peak, ctx.currentTime);

    srcNode.connect(g);
    let node = g;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(p);
      node = p;
    }
    inputs.forEach((i) => node.connect(i));
    srcNode.start();

    const duration = buf.duration / rate;

    if (isAuto) {
      const voiceRec = {
        id,
        srcNode,
        gainNode: g,
        endTime: ctx.currentTime + duration
      };
      srcNode.onended = () => {
        const idx = activeAutoVoices.indexOf(voiceRec);
        if (idx !== -1) activeAutoVoices.splice(idx, 1);
      };
      activeAutoVoices.push(voiceRec);
    }

    return duration;
  }

  // botones de prueba individual del banco sonoro (independientes del límite de polifonía automático)
  document.querySelectorAll(".bank-test-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.sound;
      if (!ac) initAudio();
      if (ac.state === "suspended") {
        try { await ac.resume(); } catch (_) {}
      }
      updSoundBtn();
      if (!bankLoaded && !bankLoading) {
        if ($("bankStatus")) $("bankStatus").textContent = "Cargando banco de sonidos...";
        await loadBank(ac);
      }
      if (soundBank[id]) {
        const baseVol = SAMPLE_BASE_VOL[id] || 0.75;
        playSample(ac, [main.input], id, baseVol, 0, 1, false);
        btn.setAttribute("aria-pressed", "true");
        setTimeout(() => btn.setAttribute("aria-pressed", "false"), 450);
        if ($("bankStatus")) $("bankStatus").textContent = `Reproduciendo: ${SOUND_NAMES[id] || id}`;
        toast(`▶ ${SOUND_NAMES[id] || id}`);
      } else {
        const err = bankErrors[id] || "No cargado";
        if ($("bankStatus")) $("bankStatus").textContent = `Error: ${id} no está disponible`;
        if ($("bankError")) {
          $("bankError").textContent = `Error en ${id}: ${err}`;
          $("bankError").hidden = false;
        }
        toast(`Error: ${id}`);
      }
    });
  });

  // ================= descargas =================
  let dlCap;
  async function downloadsCap() {
    if (dlCap !== undefined) return dlCap;
    try { dlCap = window.claude && window.claude.use ? await window.claude.use("downloads") : null; } catch (_) { dlCap = null; }
    return dlCap;
  }
  function wavFromBuffer(buf) {
    const ch = Math.min(2, buf.numberOfChannels), sr = buf.sampleRate, n = buf.length;
    const out = new ArrayBuffer(44 + n * ch * 2), v = new DataView(out);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, n * ch * 2, true);
    const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
    return new Blob([out], { type: "audio/wav" });
  }
  async function deliver(blob, base) {
    const cap = await downloadsCap();
    if (cap) {
      try { await cap.save({ filename: base + ".webm", data: blob }); toast("Descarga lista"); }
      catch (e) { toast(e && e.code === "declined" ? "Descarga cancelada" : "No se pudo descargar en esta vista"); }
      return;
    }
    let file = blob, ext = ".webm";
    try { const buf = await ac.decodeAudioData(await blob.arrayBuffer()); file = wavFromBuffer(buf); ext = ".wav"; } catch (_) {}
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = base + ext;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Descargando " + base + ext);
  }
  function pickMime() {
    if (!window.MediaRecorder) return null;
    for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]) if (MediaRecorder.isTypeSupported(m)) return m;
    return "";
  }
  let recorder = null, recording = false, recChunks = [], recBlob = null, recStart = 0;
  $("recBtn").addEventListener("click", () => {
    if (!ac) return;
    const mime = pickMime();
    if (mime === null) { $("recHint").textContent = "Este navegador no permite grabar audio."; return; }
    if (!recording) {
      recChunks = []; recorder = new MediaRecorder(recDest.stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
      recorder.onstop = () => { recBlob = new Blob(recChunks, { type: recorder.mimeType || "audio/webm" }); $("recDl").disabled = false; $("recHint").textContent = "Grabación lista para descargar."; $("stRec").textContent = "lista"; };
      recorder.start(); recording = true; recStart = performance.now();
      $("recBtn").setAttribute("aria-pressed", "true"); $("recBtn").textContent = "■ Detener"; $("recBadge").hidden = false; $("stRec").textContent = "grabando";
    } else {
      recorder.stop(); recording = false;
      $("recBtn").setAttribute("aria-pressed", "false"); $("recBtn").textContent = "● Grabar"; $("recBadge").hidden = true;
    }
  });
  $("recDl").addEventListener("click", () => { if (recBlob) deliver(recBlob, "oir-la-luz-grabacion"); });
  let lastMidi = null;
  $("noteDl").addEventListener("click", () => {
    if (!soundOn() || (lastMidi == null && lastSampleId == null)) return;
    const mime = pickMime(); if (mime === null) { toast("Este navegador no permite grabar audio"); return; }
    const ch = buildChain(ac), dest = ac.createMediaStreamDestination(); ch.out.connect(dest);
    const rec = new MediaRecorder(dest.stream, mime ? { mimeType: mime } : undefined), chunks = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    let dur = 1.0;
    if (S.mode === "zonas" && lastSampleId && soundBank[lastSampleId]) {
      rec.onstop = () => deliver(new Blob(chunks, { type: rec.mimeType || "audio/webm" }), "muestra-" + lastSampleId);
      rec.start(); $("noteDl").disabled = true; toast("Grabando " + (SOUND_NAMES[lastSampleId] || lastSampleId));
      dur = playSample(ac, [ch.input, main.input], lastSampleId, 0.9, 0) || 1.5;
    } else {
      const m = lastMidi || 48;
      rec.onstop = () => deliver(new Blob(chunks, { type: rec.mimeType || "audio/webm" }), "nota-" + noteName(m).replace("#", "s") + "-" + Math.round(mtof(m)) + "Hz");
      rec.start(); $("noteDl").disabled = true; toast("Grabando " + noteName(m));
      dur = voice(ac, [ch.input, main.input], m, 0.9, 0);
    }
    setTimeout(() => { rec.stop(); updSoundBtn(); }, (dur + 1.4) * 1000);
  });

  // ================= detección =================
  const PW = 128, PH = 72;
  const proc = document.createElement("canvas"); proc.width = PW; proc.height = PH;
  const pctx = proc.getContext("2d", { willReadFrequently: true });
  let prev = null; const mask = new Uint8Array(PW * PH);
  let energy = [], flash = [], last = [];
  const parts = [], roll = [];
  let lastEstallidoT = -1e9;
  let wasGlobalPeak = false;
  let lastGlobalZoneSoundT = -1e9;

  // --- Telemetría de actividad PULSO 90 ---
  const ACTIVITY_HISTORY_LEN = 180;
  const activityHistory = new Float32Array(ACTIVITY_HISTORY_LEN);
  let activityHead = 0;

  function updateTelemetryUI(now, globalPct) {
    const valEl = $("globalActivityVal");
    if (valEl) valEl.textContent = (globalPct * 100).toFixed(1) + " %";
    const fillEl = $("intensityFill");
    if (fillEl) fillEl.style.width = Math.min(100, Math.round((globalPct / 0.35) * 100)) + "%";

    const pillEst = $("pillEstallido");
    const pillTen = $("pillTension");
    const pillCon = $("pillContencion");

    const isEst = (globalPct >= 0.28) || isAutoSamplePlaying("08_estallido") || (now - (lastSampleTriggerT["08_estallido"] || -1e9) < 1500);
    const isTen = !isEst && ((globalPct >= 0.16) || isAutoSamplePlaying("07_tension") || (now - (lastSampleTriggerT["07_tension"] || -1e9) < 1800));

    if (pillEst) pillEst.classList.toggle("active", isEst);
    if (pillTen) pillTen.classList.toggle("active", isTen);
    if (pillCon) pillCon.classList.toggle("active", !isEst && !isTen);
  }

  function ensureGrid() { const n = S.cols * S.rows; if (energy.length !== n) { energy = new Array(n).fill(0); flash = new Array(n).fill(0); last = new Array(n).fill(0); } }
  function cellMidi(c, r) { const sc = SCALES[S.scale]; return S.root + sc[c % sc.length] + 12 * Math.floor(c / sc.length) + 12 * (S.rows - 1 - r); }
  function activeSource() { return S.src === "demo" ? demo : (S.src === "cam" || S.src === "file") && video.readyState >= 2 ? video : null; }
  function srcAspect(src) { if (!src) return 16 / 9; if (src === demo) return 16 / 9; return (video.videoWidth || 16) / (video.videoHeight || 9); }

  function fireSample(now, soundId, vel, pan, where, pct, isAuto = false) {
    if (soundOn()) {
      const played = playSample(ac, [main.input], soundId, vel, pan, 1, isAuto);
      if (isAuto && !played) {
        return false;
      }
    }
    // Indicador visual en el botón del banco sonoro
    const btn = document.querySelector(`.bank-test-btn[data-sound="${soundId}"]`);
    if (btn) {
      btn.classList.add("firing");
      setTimeout(() => btn.classList.remove("firing"), 450);
    }
    const m = SOUND_MIDI[soundId] || 48;
    const col = soundId === "08_estallido" ? "#E56A5D" : (soundId === "07_tension" ? "#FF8E72" : "#3E78B2");
    roll.push({ t: now, m, c: col });
    lastMidi = m;
    lastSampleId = soundId;
    lastFreq = mtof(m);
    lastNoteT = performance.now();
    updScopeCap();
    $("lastNote").textContent = SOUND_NAMES[soundId] || soundId;
    const STAGE_NAMES = {
      "01_latido_base": "anticipación",
      "02_latido_rapido": "aceleración",
      "03_respiracion": "anticipación",
      "04_friccion": "disputa",
      "05_murmullo": "tensión latente",
      "06_desplazamiento": "aceleración",
      "07_tension": "tensión alta",
      "08_estallido": "estallido"
    };
    $("lastHz").textContent = STAGE_NAMES[soundId] || "muestra";
    $("lastZone").textContent = where;
    $("lastPct").textContent = Math.round(pct * 100) + " %";
    $("noteDl").disabled = !soundOn();
    return true;
  }

  function analyse(now) {
    const src = activeSource(); if (!src) { prev = null; curGray = null; return; }
    pctx.save();
    if (S.src === "cam" && S.mirror) { pctx.translate(PW, 0); pctx.scale(-1, 1); }
    pctx.drawImage(src, 0, 0, PW, PH); pctx.restore();
    const d = pctx.getImageData(0, 0, PW, PH).data, gray = new Uint8Array(PW * PH);
    for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (d[j] * 0.3 + d[j + 1] * 0.59 + d[j + 2] * 0.11) | 0;
    ensureGrid();
    const counts = new Array(S.cols * S.rows).fill(0);
    let changed = 0;
    if (prev) {
      for (let i = 0; i < gray.length; i++) { const df = Math.abs(gray[i] - prev[i]); mask[i] = df > S.thr ? Math.min(255, df) : 0; if (mask[i]) changed++; }
      const p = S.parts ? Math.min(0.35, 50 / Math.max(1, changed)) : 0;
      for (let y = 0; y < PH; y++) {
        const r = Math.min(S.rows - 1, Math.floor(y / PH * S.rows));
        for (let x = 0; x < PW; x++) {
          const i = y * PW + x; if (!mask[i]) continue;
          counts[r * S.cols + Math.min(S.cols - 1, Math.floor(x / PW * S.cols))]++;
          if (p && Math.random() < p && parts.length < 300) {
            const k = Math.min(1, (mask[i] - S.thr) / 110);
            parts.push({ x: (x + Math.random()) / PW, y: (y + Math.random()) / PH, vy: -0.01 - Math.random() * 0.02, k, life: 1, decay: 1.6 + Math.random() * 1.2 });
          }
        }
      }
    }
    const hadPrev = !!prev;
    prev = gray; curGray = gray;
    const globalPct = hadPrev ? (changed / (PW * PH)) : 0;
    activityHistory[activityHead] = globalPct;
    activityHead = (activityHead + 1) % ACTIVITY_HISTORY_LEN;
    updateTelemetryUI(now, globalPct);

    if (S.mode === "linea" || S.mode === "lineas") { if (hadPrev) lineDetect(now); return; }
    if (S.mode === "escaner") return;

    if (S.mode === "zonas") {

      // 1. Clímax: actividad intensa y sostenida o salto relevante sobre la media móvil.
      // La detección no identifica goles ni distingue todos los cortes de cámara.
      const prevBaseline = peakBaseline;
      const ESTALLIDO_THRESH = Math.max(0.17, S.sens * 3.0);
      const ESTALLIDO_RESET = ESTALLIDO_THRESH * 0.60;
      const adaptivePeak = globalPct >= 0.13 && globalPct >= prevBaseline + 0.065;
      const peakNow = globalPct >= ESTALLIDO_THRESH || adaptivePeak;
      if (peakNow && hadPrev) peakConfirmFrames++;
      else peakConfirmFrames = 0;
      // Filtrado lento, ~2-3 segundos a 15 fps, para no seguir instantáneamente al pico.
      peakBaseline = prevBaseline * 0.97 + globalPct * 0.03;

      if (peakConfirmFrames >= 3 && !wasGlobalPeak) {
        const canEstallido = (now - lastSampleTriggerT["08_estallido"] >= SAMPLE_COOLDOWNS["08_estallido"]) &&
          !isAutoSamplePlaying("08_estallido");
        if (canEstallido && soundOn() && soundBank["08_estallido"]) {
          freeVoiceForClimax();
          // El impacto tiene prioridad perceptual; el compresor maestro previene picos.
          const estVel = 1.12;
          const fired = fireSample(now, "08_estallido", estVel, 0, "CLÍMAX VISUAL", globalPct, true);
          if (fired) {
            wasGlobalPeak = true;
            lastSampleTriggerT["08_estallido"] = now;
            lastGlobalZoneSoundT = now;
            return;
          }
        }
      }
      if (globalPct < ESTALLIDO_RESET) {
        wasGlobalPeak = false;
      }

      // 2. Actividad por zona: seleccionar ÚNICAMENTE la zona de mayor energía en este fotograma
      const cellPx = (PW / S.cols) * (PH / S.rows);
      let top = null;
      for (let r = 0; r < S.rows; r++) {
        for (let c = 0; c < S.cols; c++) {
          const k = r * S.cols + c;
          energy[k] = energy[k] * 0.5 + (counts[k] / cellPx) * 0.5;
          if (energy[k] > S.sens && (now - last[k] > S.cool)) {
            if (!top || energy[k] > top.e) {
              top = { r, c, k, e: energy[k] };
            }
          }
        }
      }

      // Intervalo global mínimo entre disparos automáticos (650 ms)
      const MIN_GLOBAL_INTERVAL = 650;
      const CLIMAX_BREATH_MS = 1100; // silencio breve después del impacto
      if (!top || (now - lastGlobalZoneSoundT < MIN_GLOBAL_INTERVAL) ||
          (now - lastSampleTriggerT["08_estallido"] < CLIMAX_BREATH_MS)) {
        return;
      }

      // Límite de polifonía estricto: máximo 3 muestras automáticas simultáneas
      cleanAutoVoices();
      if (activeAutoVoices.length >= 3) {
        return;
      }

      // 3. Prioridad sonora según nivel de actividad
      const lowThresh = Math.max(0.08, S.sens * 2.0);
      const highThresh = Math.max(0.22, S.sens * 4.5);
      let soundId = null;

      if (top.e >= highThresh) {
        // --- Actividad alta: priorizar tensión, pero no repetirla mientras su cola anterior siga sonando ---
        const canTension = (now - lastSampleTriggerT["07_tension"] >= SAMPLE_COOLDOWNS["07_tension"]) &&
          !isAutoSamplePlaying("07_tension");
        if (canTension) {
          soundId = "07_tension";
        } else {
          // Si tensión ya está sonando, no la repetimos sobre sí misma.
          // Solo si latido rápido está libre y tensión ya avanzó, puede acompañar un latido rápido
          const canLatRap = (now - lastSampleTriggerT["02_latido_rapido"] >= SAMPLE_COOLDOWNS["02_latido_rapido"]);
          if (canLatRap && (now - lastSampleTriggerT["07_tension"] >= 1800)) {
            soundId = "02_latido_rapido";
          }
        }
      } else if (top.e >= lowThresh) {
        // --- Actividad media: priorizar latido rápido o desplazamiento, con murmullo ocasional ---
        const canLatRap = (now - lastSampleTriggerT["02_latido_rapido"] >= SAMPLE_COOLDOWNS["02_latido_rapido"]);
        const canDespl = (now - lastSampleTriggerT["06_desplazamiento"] >= SAMPLE_COOLDOWNS["06_desplazamiento"]);
        const canMurm = (now - lastSampleTriggerT["05_murmullo"] >= SAMPLE_COOLDOWNS["05_murmullo"]) &&
          !isAutoSamplePlaying("05_murmullo");

        if (canMurm && ((top.c + top.r) % 3 === 0)) {
          soundId = "05_murmullo";
        } else if (canLatRap && (top.r % 2 === 0 || !canDespl)) {
          soundId = "02_latido_rapido";
        } else if (canDespl) {
          soundId = "06_desplazamiento";
        } else if (canLatRap) {
          soundId = "02_latido_rapido";
        } else if (canMurm) {
          soundId = "05_murmullo";
        }
      } else {
        // --- Actividad baja: priorizar latido base o respiración; evitar activar muchas texturas ---
        const canLatido = (now - lastSampleTriggerT["01_latido_base"] >= SAMPLE_COOLDOWNS["01_latido_base"]);
        const canResp = (now - lastSampleTriggerT["03_respiracion"] >= SAMPLE_COOLDOWNS["03_respiracion"]) &&
          !isAutoSamplePlaying("03_respiracion");
        const canFric = (now - lastSampleTriggerT["04_friccion"] >= SAMPLE_COOLDOWNS["04_friccion"]);

        if (top.e > lowThresh * 0.75 && canFric && ((top.c + top.r) % 4 === 0)) {
          soundId = "04_friccion";
        } else if (canResp && (top.r === 0 || !canLatido)) {
          soundId = "03_respiracion";
        } else if (canLatido) {
          soundId = "01_latido_base";
        } else if (canResp) {
          soundId = "03_respiracion";
        } else if (canFric) {
          soundId = "04_friccion";
        }
      }

      // Si ninguna muestra está disponible (silencio intencional)
      if (!soundId) {
        return;
      }

      // 4. Volumen individual moderado según la muestra + modulación sutil por movimiento
      const baseVol = SAMPLE_BASE_VOL[soundId] || 0.70;
      const dynamicFactor = S.mapVel ? (0.85 + Math.min(0.25, top.e * 0.6)) : 1.0;
      const vel = baseVol * dynamicFactor;
      const pan = S.mapPan ? ((top.c + 0.5) / S.cols) * 2 - 1 : 0;

      const fired = fireSample(now, soundId, vel, pan * 0.85, (top.c + 1) + "," + (top.r + 1), top.e, true);
      if (fired) {
        lastGlobalZoneSoundT = now;
        lastSampleTriggerT[soundId] = now;
        last[top.k] = now;
        flash[top.k] = 1;
      }
      return;
    }

    const cellPx = (PW / S.cols) * (PH / S.rows);
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) {
      const k = r * S.cols + c;
      energy[k] = energy[k] * 0.5 + (counts[k] / cellPx) * 0.5;
      if (energy[k] > S.sens && now - last[k] > S.cool) {
        last[k] = now; flash[k] = 1;
        const m = cellMidi(c, r), vel = S.mapVel ? Math.min(1, 0.35 + energy[k] * 2.2) : 0.8, pan = S.mapPan ? ((c + 0.5) / S.cols) * 2 - 1 : 0;
        fire(now, m, vel, pan * 0.85, null, (c + 1) + "," + (r + 1), energy[k]);
      }
    }
  }

  // una nota disparada por cualquier modo: suena, entra a la partitura y actualiza la lectura
  function fire(now, m, vel, pan, opt, where, pct) {
    if (soundOn()) voice(ac, [main.input], m, vel, pan, opt);
    roll.push({ t: now, m, c: opt ? opt.color : null }); lastMidi = m; lastFreq = mtof(m); lastNoteT = performance.now(); updScopeCap();
    $("lastNote").textContent = noteName(m);
    $("lastHz").textContent = Math.round(mtof(m)) + " Hz";
    $("lastZone").textContent = where;
    $("lastPct").textContent = Math.round(pct * 100) + " %";
    $("noteDl").disabled = !soundOn();
  }

  // ---- modos de línea: la línea queda quieta y suena lo que la cruza ----
  const MAXL = 4, MAXS = 12;
  const lEnergy = new Array(MAXL * MAXS).fill(0), lFlash = new Array(MAXL * MAXS).fill(0), lLast = new Array(MAXL * MAXS).fill(0), lCx = new Array(MAXL * MAXS).fill(NaN);
  let curGray = null;
  function segMidi(i) { const sc = SCALES[S.scale]; return S.root + sc[i % sc.length] + 12 * Math.floor(i / sc.length); }
  function lineXs() { if (S.mode === "linea") return [S.lx]; const a = []; for (let i = 0; i < S.nl; i++) a.push((i + 1) / (S.nl + 1)); return a; }
  function lineDetect(now) {
    const xs = lineXs(), segH = PH / S.segs;
    xs.forEach((lx, li) => {
      const px = Math.min(PW - 2, Math.max(1, Math.round(lx * PW))), v = S.mode === "lineas" ? VOICES[li] : null;
      for (let s = 0; s < S.segs; s++) {
        const y0 = Math.floor(s * segH), y1 = Math.max(y0 + 1, Math.floor((s + 1) * segH)), k = li * MAXS + s;
        let n = 0, sx = 0, sn = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = px - 1; x <= px + 1; x++) if (mask[y * PW + x]) n++;
          for (let x = Math.max(0, px - 10); x <= Math.min(PW - 1, px + 10); x++) if (mask[y * PW + x]) { sx += x; sn++; }
        }
        const cx = sn ? sx / sn : NaN, dx = cx - lCx[k]; lCx[k] = cx;
        lEnergy[k] = lEnergy[k] * 0.4 + (n / (3 * (y1 - y0))) * 0.6;
        if (lEnergy[k] > S.sens && now - lLast[k] > S.cool) {
          lLast[k] = now; lFlash[k] = 1;
          const left = S.mapDir && dx < -0.4;
          const m = segMidi(S.segs - 1 - s) + (v ? v.oct : 0) - (left ? 12 : 0);
          const vel = S.mapVel ? Math.min(1, 0.35 + lEnergy[k] * 1.2) : 0.8, pan = S.mapPan ? lx * 2 - 1 : 0;
          fire(now, m, vel, pan * 0.85, v, (S.mode === "lineas" ? "L" + (li + 1) + " · " : "") + "tramo " + (s + 1) + (left ? " ←" : ""), lEnergy[k]);
        }
      }
    });
  }

  // ---- escáner: una línea recorre la imagen y lee el brillo como una partitura ----
  let scanT0 = performance.now(), scanPos = 0, lastStep = -1;
  const hits = [];
  function scanTick(now) {
    scanPos = (((now - scanT0) / 1000) / S.sdur) % 1;
    const st = Math.floor(scanPos * S.steps);
    if (st === lastStep) return; lastStep = st;
    if (!curGray) return;
    const x0 = Math.floor(st / S.steps * PW), x1 = Math.max(x0 + 1, Math.floor((st + 1) / S.steps * PW)), segH = PH / S.segs, cands = [];
    for (let s = 0; s < S.segs; s++) {
      const y0 = Math.floor(s * segH), y1 = Math.max(y0 + 1, Math.floor((s + 1) * segH));
      let sum = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += curGray[y * PW + x];
      const avg = sum / ((y1 - y0) * (x1 - x0)), val = S.invert ? 255 - avg : avg;
      if (val > S.bright) cands.push({ s, val });
    }
    cands.sort((a, b) => b.val - a.val).slice(0, 4).forEach(({ s, val }) => {
      const m = segMidi(S.segs - 1 - s), k = (val - S.bright) / Math.max(1, 255 - S.bright);
      const vel = S.mapVel ? Math.min(1, 0.3 + k * 0.7) : 0.8, cx = (x0 + x1) / 2 / PW, pan = S.mapPan ? cx * 2 - 1 : 0;
      fire(now, m, vel, pan * 0.85, null, "paso " + (st + 1) + " · tramo " + (s + 1), val / 255);
      hits.push({ x: cx, w: (x1 - x0) / PW, s, life: 1, m });
    });
  }

  // ================= dibujo =================
  const view = $("view"), vctx = view.getContext("2d");
  const maskC = document.createElement("canvas"); maskC.width = PW; maskC.height = PH;
  const mctx = maskC.getContext("2d"), mimg = mctx.createImageData(PW, PH);
  function fit(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return dpr;
  }
  function drawView(dt) {
    const dpr = fit(view), W = view.width, H = view.height;
    vctx.fillStyle = "#10151C"; vctx.fillRect(0, 0, W, H);
    const src = activeSource(), ar = srcAspect(src);
    let bw = W, bh = W / ar; if (bh > H) { bh = H; bw = H * ar; }
    const bx = (W - bw) / 2, by = (H - bh) / 2;
    if (S.view === "mask") {
      for (let i = 0; i < PW * PH; i++) {
        const j = i * 4, m = mask[i];
        if (m) { const k = Math.min(1, (m - S.thr) / 110); mimg.data[j] = 229; mimg.data[j + 1] = 106 + (149 * (1 - k)) | 0; mimg.data[j + 2] = 93; }
        else { mimg.data[j] = 16; mimg.data[j + 1] = 21; mimg.data[j + 2] = 28; }
        mimg.data[j + 3] = 255;
      }
      mctx.putImageData(mimg, 0, 0);
      vctx.imageSmoothingEnabled = false; vctx.drawImage(maskC, bx, by, bw, bh); vctx.imageSmoothingEnabled = true;
    } else if (src) {
      vctx.save();
      if (S.src === "cam" && S.mirror) { vctx.translate(bx * 2 + bw, 0); vctx.scale(-1, 1); }
      vctx.drawImage(src, bx, by, bw, bh); vctx.restore();
      if (S.veil > 0) { vctx.fillStyle = "rgba(16,21,28," + S.veil.toFixed(2) + ")"; vctx.fillRect(bx, by, bw, bh); }
    } else {
      vctx.fillStyle = "rgba(155,170,185,.7)"; vctx.font = Math.round(11 * dpr) + "px 'IBM Plex Mono', monospace"; vctx.textAlign = "center";
      vctx.fillText(S.src === "camoff" ? "CÁMARA APAGADA" : "ESPERANDO IMAGEN", W / 2, H / 2); vctx.textAlign = "start";
    }
    if (S.parts && S.view !== "mask") drawParts(bx, by, bw, bh, dpr, dt);
    if (S.mode === "linea" || S.mode === "lineas") { drawLines(bx, by, bw, bh, dpr, dt); return; }
    if (S.mode === "escaner") { drawScanner(bx, by, bw, bh, dpr, dt); return; }
    // tono azul / coral sobre las zonas que cambian (siempre visible)
    const cw = bw / S.cols, rh = bh / S.rows; ensureGrid();
    for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) {
      const k = r * S.cols + c, f = flash[k];
      if (f > 0.02) {
        vctx.fillStyle = "rgba(62,120,178," + (S.tint * f * 0.95).toFixed(3) + ")"; vctx.fillRect(bx + c * cw, by + r * rh, cw, rh);
        flash[k] *= Math.pow(0.12, dt);
      }
    }
    // líneas: grilla de 1 px, marco de la zona activa y nivel de cambio
    if (S.lines) {
      vctx.strokeStyle = "rgba(242,241,235,.15)"; vctx.lineWidth = 1;
      vctx.beginPath();
      for (let c = 1; c < S.cols; c++) { const x = Math.round(bx + c * cw) + 0.5; vctx.moveTo(x, by); vctx.lineTo(x, by + bh); }
      for (let r = 1; r < S.rows; r++) { const y = Math.round(by + r * rh) + 0.5; vctx.moveTo(bx, y); vctx.lineTo(bx + bw, y); }
      vctx.stroke();
      for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) {
        const k = r * S.cols + c, f = flash[k];
        if (f > 0.15) { vctx.strokeStyle = "rgba(229,106,93," + (0.9 * f).toFixed(3) + ")"; vctx.strokeRect(Math.round(bx + c * cw) + 0.5, Math.round(by + r * rh) + 0.5, Math.round(cw) - 1, Math.round(rh) - 1); }
        const e = Math.min(1, energy[k] / Math.max(0.01, S.sens));
        vctx.fillStyle = "rgba(229,106,93,.65)"; vctx.fillRect(bx + c * cw + 8 * dpr, by + (r + 1) * rh - 6 * dpr, (cw - 16 * dpr) * e, dpr);
      }
    }
    if (S.notes) {
      vctx.font = Math.round(10 * dpr) + "px 'IBM Plex Mono', monospace";
      for (let r = 0; r < S.rows; r++) for (let c = 0; c < S.cols; c++) {
        const k = r * S.cols + c, f = flash[k];
        vctx.fillStyle = f > 0.3 ? "#E56A5D" : "rgba(155,170,185,.6)";
        vctx.fillText(noteName(cellMidi(c, r)).toUpperCase(), bx + c * cw + 8 * dpr, by + (r + 1) * rh - 12 * dpr);
      }
    }
  }

  // partículas: puntos breves, sin estela
  function drawParts(bx, by, bw, bh, dpr, dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.y += p.vy * dt; p.life -= p.decay * dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const a = (p.life * 0.55).toFixed(3);
      vctx.fillStyle = p.k > 0.55 ? "rgba(229,106,93," + a + ")" : "rgba(62,120,178," + a + ")";
      const s = (1 + p.k * 1.6) * dpr;
      vctx.fillRect(bx + p.x * bw - s / 2, by + p.y * bh - s / 2, s, s);
    }
  }
  function drawLines(bx, by, bw, bh, dpr, dt) {
    const xs = lineXs(), segH = bh / S.segs;
    vctx.font = Math.round(10 * dpr) + "px 'IBM Plex Mono', monospace";
    xs.forEach((lx, li) => {
      const x = Math.round(bx + lx * bw) + 0.5, v = S.mode === "lineas" ? VOICES[li] : null, col = v ? v.color : "#E56A5D";
      for (let s = 0; s < S.segs; s++) {   // tono azul en el tramo que suena (siempre visible)
        const k = li * MAXS + s, f = lFlash[k];
        if (f > 0.02) { vctx.fillStyle = "rgba(62,120,178," + (S.tint * f * 1.4).toFixed(3) + ")"; vctx.fillRect(x - bw * 0.05, by + s * segH, bw * 0.1, segH); lFlash[k] *= Math.pow(0.12, dt); }
      }
      if (S.lines) {
        vctx.strokeStyle = rgba(col, 0.75); vctx.lineWidth = 1.5 * dpr;
        vctx.beginPath(); vctx.moveTo(x, by); vctx.lineTo(x, by + bh); vctx.stroke();
        vctx.strokeStyle = rgba(col, 0.45); vctx.lineWidth = 1; vctx.beginPath();
        for (let s = 1; s < S.segs; s++) { const y = Math.round(by + s * segH) + 0.5; vctx.moveTo(x - 5 * dpr, y); vctx.lineTo(x + 5 * dpr, y); }
        vctx.stroke();
        vctx.lineWidth = 4 * dpr;
        for (let s = 0; s < S.segs; s++) {
          const f = lFlash[li * MAXS + s]; if (f < 0.1) continue;
          vctx.strokeStyle = rgba(col, f); vctx.beginPath(); vctx.moveTo(x, by + s * segH + 2 * dpr); vctx.lineTo(x, by + (s + 1) * segH - 2 * dpr); vctx.stroke();
        }
      }
      if (S.notes) {
        if (v) { vctx.fillStyle = col; vctx.fillText("L" + (li + 1) + " · " + v.name.toUpperCase(), x + 7 * dpr, by + 16 * dpr); }
        for (let s = 0; s < S.segs; s++) {
          const f = lFlash[li * MAXS + s]; if (v && f < 0.3) continue;
          vctx.fillStyle = f > 0.3 ? "#E56A5D" : "rgba(155,170,185,.62)";
          vctx.fillText(noteName(segMidi(S.segs - 1 - s) + (v ? v.oct : 0)).toUpperCase(), x + 7 * dpr, by + (s + 0.5) * segH + 4 * dpr);
        }
      }
    });
  }
  function drawScanner(bx, by, bw, bh, dpr, dt) {
    const segH = bh / S.segs, x = Math.round(bx + scanPos * bw) + 0.5;
    vctx.font = Math.round(10 * dpr) + "px 'IBM Plex Mono', monospace";
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i]; h.life -= dt * 0.9;
      if (h.life <= 0) { hits.splice(i, 1); continue; }
      const cx = bx + h.x * bw, cy = by + (h.s + 0.5) * segH;
      vctx.fillStyle = "rgba(62,120,178," + (S.tint * h.life * 1.4).toFixed(3) + ")"; vctx.fillRect(bx + (h.x - h.w / 2) * bw, by + h.s * segH, h.w * bw, segH);
      vctx.fillStyle = rgba("#E56A5D", Math.min(1, h.life * 1.2)); vctx.beginPath(); vctx.arc(cx, cy, (2 + 3 * h.life) * dpr, 0, Math.PI * 2); vctx.fill();
      if (S.notes && h.life > 0.55) vctx.fillText(noteName(h.m).toUpperCase(), cx + 8 * dpr, cy + 4 * dpr);
    }
    if (S.lines) {
      vctx.strokeStyle = "rgba(238,240,255,.5)"; vctx.lineWidth = 1; vctx.beginPath();
      for (let st = 0; st <= S.steps; st++) { const tx = Math.round(bx + st / S.steps * bw) + 0.5; vctx.moveTo(tx, by); vctx.lineTo(tx, by + 4 * dpr); vctx.moveTo(tx, by + bh - 4 * dpr); vctx.lineTo(tx, by + bh); }
      vctx.stroke();
      vctx.strokeStyle = "#E56A5D"; vctx.lineWidth = 1.5 * dpr; vctx.beginPath(); vctx.moveTo(x, by); vctx.lineTo(x, by + bh); vctx.stroke();
      vctx.strokeStyle = "rgba(229,106,93,.5)"; vctx.lineWidth = 1; vctx.beginPath();
      for (let s = 1; s < S.segs; s++) { const y = Math.round(by + s * segH) + 0.5; vctx.moveTo(x - 5 * dpr, y); vctx.lineTo(x + 5 * dpr, y); }
      vctx.stroke();
    }
  }

  const scope = $("scope"), sctx = scope.getContext("2d"), tbuf = new Uint8Array(1024);
  const WAVE_NAME = { sine: "seno", triangle: "triangular", square: "cuadrada", sawtooth: "sierra" };
  function waveVal(type, ph) {
    ph = ph - Math.floor(ph);
    if (type === "sine") return Math.sin(2 * Math.PI * ph);
    if (type === "square") return ph < 0.5 ? 1 : -1;
    if (type === "sawtooth") return 2 * ph - 1;
    return ph < 0.25 ? 4 * ph : ph < 0.75 ? 2 - 4 * ph : 4 * ph - 4;
  }
  function harmonic(type, n) {
    if (type === "sine") return n === 1 ? 1 : 0;
    if (type === "square") return n % 2 ? 1 / n : 0;
    if (type === "triangle") return n % 2 ? 1 / (n * n) : 0;
    return 1 / n;
  }
  const fbuf = new Float32Array(2048);
  let lastFreq = 0, lastNoteT = -1e9;
  function updScopeCap() {
    const f = lastFreq || mtof(S.root + 12);
    $("scopeCap").textContent = "forma de onda · " + WAVE_NAME[S.wave];
    $("specCap").textContent = "armónicos · corte " + (S.cut >= 1000 ? (S.cut / 1000).toFixed(1) + "k" : S.cut);
  }
  function drawScope() {
    if ($("signal").hidden) return;
    const dpr = fit(scope), W = scope.width, H = scope.height;
    sctx.clearRect(0, 0, W, H);
    const split = Math.round(W * 0.6), pad = 6 * dpr, mid = H / 2, amp = H * 0.38;
    sctx.strokeStyle = "rgba(238,240,255,.14)"; sctx.lineWidth = 1;
    sctx.beginPath(); sctx.moveTo(0, Math.round(mid) + 0.5); sctx.lineTo(split - pad, Math.round(mid) + 0.5); sctx.moveTo(split + 0.5, 0); sctx.lineTo(split + 0.5, H); sctx.stroke();
    // señal real (si hay sonido), sincronizada al inicio del ciclo y escalada a la misma cantidad de ciclos
    const cycles = 2.5, wantLive = soundOn() && lastFreq && (performance.now() - lastNoteT) < (S.atk + S.rel * 1.4) * 1000 + 150;
    let livePts = null;
    if (wantLive) {
      shape.getFloatTimeDomainData(fbuf);
      let peak = 0; for (let i = 0; i < fbuf.length; i++) peak = Math.max(peak, Math.abs(fbuf[i]));
      if (peak > 0.004) {
        const period = ac.sampleRate / lastFreq, span = Math.min(fbuf.length - 1, Math.round(period * cycles));
        let i0 = 0; for (let i = 1; i < fbuf.length - span; i++) { if (fbuf[i - 1] <= 0 && fbuf[i] > 0) { i0 = i; break; } }
        livePts = []; for (let k = 0; k <= span; k++) livePts.push([k / span * (split - pad), mid - (fbuf[i0 + k] / peak) * amp]);
      }
    }
    // forma ideal de la onda elegida: en neón sin sonido, de fondo cuando hay señal real
    sctx.strokeStyle = livePts ? "rgba(155,170,185,.32)" : "#E56A5D"; sctx.lineWidth = (livePts ? 1 : 1.6) * dpr;
    sctx.beginPath();
    for (let x = 0; x <= split - pad; x++) { const y = mid - waveVal(S.wave, x / (split - pad) * cycles) * amp; x ? sctx.lineTo(x, y) : sctx.moveTo(x, y); }
    sctx.stroke();
    if (livePts) {
      sctx.strokeStyle = "#E56A5D"; sctx.lineWidth = 1.6 * dpr; sctx.beginPath();
      livePts.forEach(([x, y], k) => (k ? sctx.lineTo(x, y) : sctx.moveTo(x, y))); sctx.stroke();
    }
    // armónicos teóricos y curva del pasa-bajos (12 dB/oct); los armónicos sobre el corte se apagan
    const f0 = lastFreq || mtof(S.root + 12), N = 12, bw = (W - split - pad * 2) / N, hlCut = hlOn("cut");
    for (let n = 1; n <= N; n++) {
      const a = harmonic(S.wave, n); if (!a) continue;
      const h = Math.max(1, a * (H - pad * 2)), x = split + pad + (n - 1) * bw;
      sctx.fillStyle = f0 * n > S.cut ? "rgba(98,114,136,.45)" : "#E56A5D";
      sctx.fillRect(Math.round(x + bw * 0.2), Math.round(H - pad - h), Math.max(1, Math.round(bw * 0.6)), Math.round(h));
    }
    sctx.strokeStyle = hlCut ? "#FFFFFF" : "rgba(238,240,255,.6)"; sctx.lineWidth = (hlCut ? 2 : 1) * dpr; sctx.setLineDash([3 * dpr, 3 * dpr]);
    sctx.beginPath();
    for (let x = 0; x <= W - split - pad * 2; x++) {
      const n = 0.5 + x / bw, r = (f0 * n) / S.cut, g = 1 / Math.sqrt(1 + r * r * r * r);
      const y = H - pad - g * (H - pad * 2); x ? sctx.lineTo(split + pad + x, y) : sctx.moveTo(split + pad + x, y);
    }
    sctx.stroke(); sctx.setLineDash([]);
  }

  // ---- envolvente: attack, release, reverb y volumen ----
  const envC = $("env"), ectx = envC.getContext("2d"), mbuf = new Float32Array(1024);
  let HL = { key: null, t: 0 };
  function hlOn(k) { return HL.key === k && performance.now() - HL.t < 1400; }
  function envAt(t) {
    const peak = S.vol, hold = 0.06;
    if (t < 0) return 0;
    if (t < S.atk) return peak * (t / S.atk);
    if (t < S.atk + hold) return peak * (0.6 + 0.4 * Math.exp(-(t - S.atk) / 0.08));
    const vh = peak * (0.6 + 0.4 * Math.exp(-hold / 0.08));
    return vh * Math.exp(-(t - S.atk - hold) / (S.rel / 4));
  }
  function updEnvCap() {
    $("envCapL").textContent = "envolvente · A " + Math.round(S.atk * 1000) + " ms · R " + Math.round(S.rel * 1000) + " ms";
    $("envCapR").textContent = "reverb " + Math.round(S.rev * 100) + " % · vol " + Math.round(S.vol * 100) + " %";
  }
  function drawEnv() {
    if ($("signal").hidden) return;
    const dpr = fit(envC), W = envC.width, H = envC.height, pad = 6 * dpr, meterW = 10 * dpr;
    ectx.clearRect(0, 0, W, H);
    const PW_ = W - meterW - pad * 3, base = H - pad, top = pad + 8 * dpr, hgt = base - top;
    const hold = 0.06, noteEnd = S.atk + hold + S.rel * 1.6, tail = S.rev > 0.01 ? 2.6 * S.rev + 0.4 : 0;
    const T = Math.max(0.5, noteEnd + tail);
    const X = (t) => pad + (t / T) * PW_, Y = (v) => base - v * hgt;
    ectx.strokeStyle = "rgba(238,240,255,.14)"; ectx.lineWidth = 1;
    ectx.beginPath(); ectx.moveTo(pad, Math.round(base) + 0.5); ectx.lineTo(pad + PW_, Math.round(base) + 0.5); ectx.moveTo(pad, Math.round(Y(1)) + 0.5); ectx.lineTo(pad + PW_, Math.round(Y(1)) + 0.5); ectx.stroke();
    // cola de reverb (zona sombreada)
    if (S.rev > 0.01) {
      const hlR = hlOn("rev");
      ectx.fillStyle = hlR ? "rgba(62,120,178,.45)" : "rgba(62,120,178,.2)";
      ectx.beginPath(); ectx.moveTo(X(S.atk), base);
      for (let i = 0; i <= 80; i++) { const t = S.atk + (T - S.atk) * i / 80; ectx.lineTo(X(t), Y(Math.max(envAt(t), S.rev * S.vol * 0.55 * Math.exp(-(t - S.atk) / (0.35 + S.rev * 0.9))))); }
      ectx.lineTo(X(T), base); ectx.closePath(); ectx.fill();
    }
    // tramos: attack y release resaltables
    const seg = (t0, t1, hl) => {
      ectx.strokeStyle = hl ? "#FFFFFF" : "#E56A5D"; ectx.lineWidth = (hl ? 2.6 : 1.6) * dpr; ectx.beginPath();
      for (let i = 0; i <= 60; i++) { const t = t0 + (t1 - t0) * i / 60; i ? ectx.lineTo(X(t), Y(envAt(t))) : ectx.moveTo(X(t), Y(envAt(t))); }
      ectx.stroke();
    };
    const hlV = hlOn("vol");
    seg(0, S.atk, hlOn("atk") || hlV); seg(S.atk, S.atk + hold, hlV); seg(S.atk + hold, noteEnd, hlOn("rel") || hlV);
    // marcas A y R
    ectx.fillStyle = "rgba(238,240,255,.7)"; ectx.font = Math.round(9 * dpr) + "px 'IBM Plex Mono', monospace";
    ectx.fillText("A", X(S.atk / 2) - 3 * dpr, pad + 6 * dpr);
    ectx.fillText("R", X(S.atk + hold + S.rel * 0.5), pad + 6 * dpr);
    ectx.strokeStyle = "rgba(238,240,255,.25)"; ectx.setLineDash([2 * dpr, 3 * dpr]); ectx.beginPath();
    [S.atk, S.atk + hold].forEach((t) => { const x = Math.round(X(t)) + 0.5; ectx.moveTo(x, top); ectx.lineTo(x, base); }); ectx.stroke(); ectx.setLineDash([]);
    // cabezal de la última nota
    const el = (performance.now() - lastNoteT) / 1000;
    if (soundOn() && el >= 0 && el < T) { const x = Math.round(X(el)) + 0.5; ectx.strokeStyle = "rgba(238,240,255,.8)"; ectx.lineWidth = 1; ectx.beginPath(); ectx.moveTo(x, top - 4 * dpr); ectx.lineTo(x, base); ectx.stroke(); }
    // medidor de nivel: volumen elegido (marco) y nivel real de salida (relleno)
    const mx = W - pad - meterW;
    ectx.strokeStyle = hlV ? "#FFFFFF" : "rgba(238,240,255,.45)"; ectx.lineWidth = 1;
    ectx.strokeRect(Math.round(mx) + 0.5, Math.round(Y(S.vol)) + 0.5, Math.round(meterW) - 1, Math.round(base - Y(S.vol)) - 1);
    let lvl = 0;
    if (analyser && soundOn()) { analyser.getFloatTimeDomainData(mbuf); let sum = 0; for (let i = 0; i < mbuf.length; i++) sum += mbuf[i] * mbuf[i]; lvl = Math.min(1, Math.sqrt(sum / mbuf.length) * 4); }
    if (lvl > 0.002) { ectx.fillStyle = "#E56A5D"; ectx.fillRect(Math.round(mx) + 2, Math.round(Y(lvl)), Math.round(meterW) - 4, Math.round(base - Y(lvl))); }
  }
  const rollC = $("roll"), rctx = rollC.getContext("2d");
  function drawRoll(now) {
    while (roll.length && now - roll[0].t > 10000) roll.shift();
    if ($("signal").hidden) return;
    const dpr = fit(rollC), W = rollC.width, H = rollC.height, span = 10000;
    rctx.clearRect(0, 0, W, H);
    const lo = S.mode === "zonas" ? S.root - 2 : S.root - 14, hi = S.mode === "zonas" ? S.root + 12 * S.rows + 14 : S.root + 46;
    rctx.strokeStyle = "rgba(238,240,255,.12)"; rctx.lineWidth = 1;
    for (let m = Math.ceil(lo / 12) * 12; m < hi; m += 12) { const y = Math.round(H - (m - lo) / (hi - lo) * H) + 0.5; rctx.beginPath(); rctx.moveTo(0, y); rctx.lineTo(W, y); rctx.stroke(); }
    for (const n of roll) {
      const age = (now - n.t) / span, x = W - age * W, y = H - (n.m - lo) / (hi - lo) * H;
      rctx.fillStyle = age < 0.05 ? "#E56A5D" : n.c ? rgba(n.c, 0.85) : "rgba(62,120,178,.85)";
      rctx.fillRect(x - 2 * dpr, y - 1.5 * dpr, 9 * dpr, 3 * dpr);
    }
  }

  // Gráfico temporal de actividad visual real PULSO 90
  const actCanvas = $("activityCanvas"), actCtx = actCanvas ? actCanvas.getContext("2d") : null;
  function drawActivityGraph() {
    if (!actCanvas || !actCtx) return;
    const dpr = fit(actCanvas);
    const W = actCanvas.width, H = actCanvas.height;
    actCtx.clearRect(0, 0, W, H);

    // Umbrales emocionales guía (TENSIÓN ~ 0.16, ESTALLIDO ~ 0.28)
    const estY = H * (1 - 0.28 / 0.40);
    const tenY = H * (1 - 0.16 / 0.40);

    actCtx.strokeStyle = "rgba(229,106,93,0.30)";
    actCtx.lineWidth = 1 * dpr;
    actCtx.setLineDash([3 * dpr, 3 * dpr]);
    actCtx.beginPath();
    actCtx.moveTo(0, estY);
    actCtx.lineTo(W, estY);
    actCtx.stroke();

    actCtx.strokeStyle = "rgba(62,120,178,0.30)";
    actCtx.beginPath();
    actCtx.moveTo(0, tenY);
    actCtx.lineTo(W, tenY);
    actCtx.stroke();
    actCtx.setLineDash([]);

    // Curva de actividad histórica real
    const len = ACTIVITY_HISTORY_LEN;
    actCtx.beginPath();
    for (let i = 0; i < len; i++) {
      const idx = (activityHead + i) % len;
      const v = Math.min(0.40, activityHistory[idx]);
      const x = (i / (len - 1)) * W;
      const y = H - (v / 0.40) * (H - 4 * dpr) - 2 * dpr;
      if (i === 0) actCtx.moveTo(x, y);
      else actCtx.lineTo(x, y);
    }

    // Relleno degradado bajo la curva
    actCtx.lineTo(W, H);
    actCtx.lineTo(0, H);
    actCtx.closePath();
    const grad = actCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(229, 106, 93, 0.35)");
    grad.addColorStop(0.5, "rgba(62, 120, 178, 0.20)");
    grad.addColorStop(1, "rgba(26, 35, 45, 0.0)");
    actCtx.fillStyle = grad;
    actCtx.fill();

    // Trazo de la línea de actividad
    actCtx.beginPath();
    for (let i = 0; i < len; i++) {
      const idx = (activityHead + i) % len;
      const v = Math.min(0.40, activityHistory[idx]);
      const x = (i / (len - 1)) * W;
      const y = H - (v / 0.40) * (H - 4 * dpr) - 2 * dpr;
      if (i === 0) actCtx.moveTo(x, y);
      else actCtx.lineTo(x, y);
    }
    actCtx.strokeStyle = "#E56A5D";
    actCtx.lineWidth = 1.6 * dpr;
    actCtx.stroke();

    // Punto del valor actual
    const curV = Math.min(0.40, activityHistory[(activityHead - 1 + len) % len]);
    const curY = H - (curV / 0.40) * (H - 4 * dpr) - 2 * dpr;
    actCtx.fillStyle = "#E56A5D";
    actCtx.beginPath();
    actCtx.arc(W - 2 * dpr, curY, 3 * dpr, 0, Math.PI * 2);
    actCtx.fill();
  }

  // ================= controles =================
  const RANGES = {
    cols: { key: "cols", fmt: (v) => v }, rows: { key: "rows", fmt: (v) => v },
    thr: { key: "thr", fmt: (v) => v }, sens: { key: "sens", fmt: (v) => v + " %", conv: (v) => v / 100 }, cool: { key: "cool", fmt: (v) => v + " ms" },
    atk: { key: "atk", fmt: (v) => v + " ms", conv: (v) => v / 1000 }, rel: { key: "rel", fmt: (v) => v + " ms", conv: (v) => v / 1000 },
    cut: { key: "cut", fmt: (v) => v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v) },
    rev: { key: "rev", fmt: (v) => v + " %", conv: (v) => v / 100 }, vol: { key: "vol", fmt: (v) => v + " %", conv: (v) => v / 100 },
    tint: { key: "tint", fmt: (v) => v + " %", conv: (v) => v / 100 }, veil: { key: "veil", fmt: (v) => v + " %", conv: (v) => v / 100 },
    lx: { key: "lx", fmt: (v) => v + " %", conv: (v) => v / 100 }, nl: { key: "nl", fmt: (v) => v }, segs: { key: "segs", fmt: (v) => v },
    sdur: { key: "sdur", fmt: (v) => v + " s" }, steps: { key: "steps", fmt: (v) => v }, bright: { key: "bright", fmt: (v) => v },
  };
  Object.entries(RANGES).forEach(([id, cfg]) => {
    const el = $(id), out = $(id + "Out");
    const upd = () => { const v = Number(el.value); S[cfg.key] = cfg.conv ? cfg.conv(v) : v; out.textContent = cfg.fmt(v); onChange(cfg.key); };
    el.addEventListener("input", upd); upd();
    const badge = document.createElement("i"); badge.className = "cc"; badge.hidden = true; badge.dataset.for = id;
    el.closest(".row").querySelector("label").appendChild(badge);
  });
  function onChange(key) {
    if (["atk", "rel", "cut", "rev", "vol"].includes(key)) { HL = { key, t: performance.now() }; updEnvCap(); }
    if (key === "cols" || key === "rows") { ensureGrid(); $("stKeys").textContent = S.cols + " × " + S.rows; }
    if (key === "cut" && typeof updScopeCap === "function") updScopeCap();
    if (key === "nl") renderVoices();
    if (key === "sdur" || key === "steps") lastStep = -1;
    if (key === "sens") $("stDet").textContent = Math.round(S.sens * 100) + " %";
    if (!ac) return;
    if (key === "vol") master.gain.setTargetAtTime(S.vol, ac.currentTime, 0.05);
    if (key === "cut") main.filter.frequency.setTargetAtTime(S.cut, ac.currentTime, 0.05);
    if (key === "rev") setRev(main);
  }
  $("scale").addEventListener("change", (e) => { S.scale = e.target.value; });
  $("root").addEventListener("change", (e) => { S.root = Number(e.target.value); });
  document.querySelectorAll("[data-wave]").forEach((b) => b.addEventListener("click", () => {
    S.wave = b.dataset.wave; document.querySelectorAll("[data-wave]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("stSnd").textContent = b.textContent.toLowerCase(); updScopeCap();
    if (soundOn()) { const m = S.root + 12; lastFreq = mtof(m); lastNoteT = performance.now(); voice(ac, [main.input], m, 0.85, 0); updScopeCap(); }
  }));
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    S.view = b.dataset.view; document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); updVisState();
  }));
  function updMap() {
    const M = S.mode, p = [];
    if (M === "zonas") p.push("actividad → muestra");
    if (M === "linea") p.push("altura del cruce → nota");
    if (M === "lineas") p.push("línea → voz", "altura del cruce → nota");
    if (M === "escaner") p.push("altura → nota");
    if (S.mapVel) p.push(M === "escaner" ? "brillo → volumen" : "intensidad → volumen");
    if (S.mapPan) p.push("posición x → pan");
    if (S.mapDir && (M === "linea" || M === "lineas")) p.push("dirección → octava");
    if (M === "escaner") p.push("tiempo → recorrido");
    $("mapMain").textContent = p[0];
    $("mapText").textContent = p.join(" · "); $("stMap").textContent = p.length + (p.length === 1 ? " regla" : " reglas");
  }
  const MODE_INFO = {
    zonas: { name: "zonas", lbl: " · zona ", hint: "PULSO 90: La imagen se divide en una grilla que dispara el banco sonoro según el nivel de actividad y cambio." },
    linea: { name: "línea fija", lbl: " · ", hint: "Una línea vertical queda quieta y suena cuando algo del video la cruza. La altura del cruce da la nota, la intensidad el volumen y la posición el pan." },
    lineas: { name: "varias líneas", lbl: " · ", hint: "Varias líneas, cada una con su propia voz: forma de onda, envolvente, octava y filtro. Aquí no aplican la forma de onda, Attack, Release ni Pasa-bajos del panel Sonido, porque cada línea trae los suyos." },
    escaner: { name: "escáner", lbl: " · ", hint: "Una línea recorre la imagen de izquierda a derecha y la lee como una partitura: en cada paso suenan los tramos claros. La altura da la nota y el brillo el volumen. Funciona incluso con imágenes quietas." },
  };
  function renderVoices() {
    $("voices").innerHTML = VOICES.slice(0, S.nl).map((v, i) => '<li><i style="background:' + v.color + '"></i><span><b>Línea ' + (i + 1) + " · " + v.name + "</b><br>" +
      WAVE_NAME[v.wave] + " · A " + Math.round(v.atk * 1000) + " ms · R " + Math.round(v.rel * 1000) + " ms" + (v.oct ? " · " + (v.oct > 0 ? "+" : "") + v.oct / 12 + " oct" : "") +
      (v.cut ? " · pasa-bajos " + v.cut + " Hz" : "") + "<br>en tu proyecto podría ser: " + v.ej + "</span></li>").join("");
  }
  function setMode(m) {
    S.mode = m; prev = null; lEnergy.fill(0); lFlash.fill(0); lCx.fill(NaN); hits.length = 0; flash.fill(0);
    scanT0 = performance.now(); lastStep = -1;
    document.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.mode === m)));
    document.querySelectorAll("#pMode [data-show]").forEach((el) => { el.hidden = !el.dataset.show.split(" ").includes(m); });
    $("modeHint").textContent = MODE_INFO[m].hint; $("stMode").textContent = MODE_INFO[m].name; $("lblZone").textContent = MODE_INFO[m].lbl;
    $("chain").innerHTML = "luz → cámara → píxel → <b>" + (m === "escaner" ? "brillo" : "cambio") + "</b> → regla → " + (m === "zonas" ? "muestra" : "nota") + " → sonido";
    $("lblPct").textContent = m === "escaner" ? " · brillo " : " · cambio ";
    $("lastZone").textContent = "—"; updMap();
  }
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  $("mapDir").addEventListener("change", (e) => { S.mapDir = e.target.checked; updMap(); });
  $("invert").addEventListener("change", (e) => { S.invert = e.target.checked; });
  $("mapVel").addEventListener("change", (e) => { S.mapVel = e.target.checked; updMap(); });
  $("mapPan").addEventListener("change", (e) => { S.mapPan = e.target.checked; updMap(); });
  $("mirror").addEventListener("change", (e) => { S.mirror = e.target.checked; prev = null; });
  renderVoices(); setMode("zonas"); updVisState(); updEnvCap(); HL = { key: null, t: 0 };

  // pantalla completa
  $("fsBtn").addEventListener("click", async () => {
    const st = $("stage");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (st.requestFullscreen) await st.requestFullscreen();
      else if (st.webkitRequestFullscreen) st.webkitRequestFullscreen();
      else throw new Error("no");
    } catch (_) { toast("Pantalla completa no disponible en esta vista"); }
  });
  document.addEventListener("fullscreenchange", () => { $("fsBtn").textContent = document.fullscreenElement ? "⛶ Salir" : "⛶ Pantalla completa"; });

  // ================= MIDI =================
  const STORE = "oirlaluz.midi.v1";
  let midiMap = {};
  try { midiMap = JSON.parse(localStorage.getItem(STORE) || "{}") || {}; } catch (_) { midiMap = {}; }
  let learning = false, learnTarget = null;
  function saveMap() { try { localStorage.setItem(STORE, JSON.stringify(midiMap)); } catch (_) {} }
  function paintBadges() {
    document.querySelectorAll(".cc").forEach((b) => { b.hidden = true; b.textContent = ""; });
    Object.entries(midiMap).forEach(([cc, id]) => { const b = document.querySelector('.cc[data-for="' + id + '"]'); if (b) { b.hidden = false; b.textContent = "CC" + cc; } });
  }
  paintBadges();
  function onMidi(e) {
    const [st, d1, d2] = e.data;
    if ((st & 0xf0) !== 0xb0) return;
    if (learning && learnTarget) {
      Object.keys(midiMap).forEach((k) => { if (midiMap[k] === learnTarget.id) delete midiMap[k]; });
      midiMap[d1] = learnTarget.id; saveMap(); paintBadges();
      $("midiHint").textContent = "CC " + d1 + " → " + learnTarget.id + ". Toca otro slider o termina con Asignar.";
      learnTarget.classList.remove("target"); learnTarget = null; return;
    }
    const id = midiMap[d1]; if (!id) return;
    const el = $(id), min = Number(el.min), max = Number(el.max), step = Number(el.step) || 1;
    el.value = String(Math.round((min + (d2 / 127) * (max - min)) / step) * step);
    el.dispatchEvent(new Event("input"));
  }
  $("midiBtn").addEventListener("click", async () => {
    if (!navigator.requestMIDIAccess) { $("midiHint").textContent = "Este navegador no tiene Web MIDI. Usa Chrome o Edge en la versión local."; return; }
    try {
      const access = await navigator.requestMIDIAccess();
      const bind = () => { let n = 0; access.inputs.forEach((i) => { i.onmidimessage = onMidi; n++; }); $("stMidi").textContent = n ? n + " conectado" + (n > 1 ? "s" : "") : "sin equipos"; $("midiHint").textContent = n ? "Presiona Asignar." : "No hay controladores conectados. Enchufa uno y vuelve a intentar."; };
      access.onstatechange = bind; bind();
      $("midiBtn").setAttribute("aria-pressed", "true"); $("learnBtn").disabled = false; $("midiClear").disabled = false;
    } catch (e) { $("midiHint").textContent = "MIDI no disponible en esta vista. Abre la versión local en Chrome o Edge."; }
  });
  $("learnBtn").addEventListener("click", () => {
    learning = !learning; $("learnBtn").setAttribute("aria-pressed", String(learning));
    $("dock").classList.toggle("learning", learning);
    if (learnTarget) { learnTarget.classList.remove("target"); learnTarget = null; }
    $("midiHint").textContent = learning ? "Abre otro panel, toca un slider y mueve una perilla." : "Asignaciones guardadas en este navegador.";
  });
  document.querySelectorAll("input[type=range]").forEach((el) => el.addEventListener("pointerdown", () => {
    if (!learning) return;
    if (learnTarget) learnTarget.classList.remove("target");
    learnTarget = el; el.classList.add("target");
    $("midiHint").textContent = "Mueve una perilla para asignarla a " + el.id + ".";
  }));
  $("midiClear").addEventListener("click", () => { midiMap = {}; saveMap(); paintBadges(); $("midiHint").textContent = "Asignaciones borradas."; });

  // ================= bucle =================
  let lastT = performance.now(), acc = 0;
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (S.src === "demo") drawDemo(dt);
    acc += dt;
    if (acc >= 1 / 15) { acc = 0; analyse(now); }
    if (S.mode === "escaner") scanTick(now);
    drawView(dt); drawScope(); drawEnv(); drawRoll(now); drawActivityGraph();
    if (recording) { const s = Math.floor((now - recStart) / 1000), t = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); $("recTime").textContent = t; $("recBadgeT").textContent = t; }
    requestAnimationFrame(loop);
  }
  updSoundBtn(); drawDemo(0);
  requestAnimationFrame(loop);
})();
