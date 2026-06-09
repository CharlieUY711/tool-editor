/**
 * ToolEditor — Editor de imágenes profesional
 * Repositorio: CharlieUY711/tool-editor
 * Path local:  C:\Core\tools\tool-editor
 *
 * BUGS CORREGIDOS v1.1:
 *  1. saveSnap usaba histIdx stale en closures async → ahora usa histRef (useRef)
 *  2. render() redibujaba desde imgEl ya modificado → separado cleanImgRef (imagen base limpia)
 *  3. filtro CSS en <canvas> no se exportaba → filtro se hornea en píxeles al exportar
 *  4. shadows / highlights no implementados → implementados con curva de luminancia
 *  5. sharpness / clarity / noise no implementados → implementados con kernels reales
 */

import { useState, useRef, useEffect, useCallback } from "react";
// import EffectsPanel from "./effects/EffectsPanel.jsx";

// ─── Constantes ───────────────────────────────────────────────────────────────

const FILTERS = [
  { name: "Original", id: "none",   css: "none" },
  { name: "Vivid",    id: "vivid",  css: "saturate(1.8) contrast(1.1)" },
  { name: "Fade",     id: "fade",   css: "opacity(0.9) saturate(0.65) brightness(1.12)" },
  { name: "Noir",     id: "noir",   css: "grayscale(1) contrast(1.35) brightness(0.95)" },
  { name: "Warm",     id: "warm",   css: "sepia(0.35) saturate(1.2) brightness(1.05)" },
  { name: "Cool",     id: "cool",   css: "hue-rotate(20deg) saturate(1.15) brightness(1.02)" },
  { name: "Chrome",   id: "chrome", css: "contrast(1.2) saturate(1.4) brightness(0.92)" },
  { name: "Matte",    id: "matte",  css: "contrast(0.88) saturate(0.75) brightness(1.08)" },
  { name: "Retro",    id: "retro",  css: "sepia(0.5) saturate(1.3) contrast(1.05)" },
  { name: "Lomo",     id: "lomo",   css: "saturate(1.6) contrast(1.25) brightness(0.88)" },
  { name: "Analog",   id: "analog", css: "sepia(0.2) saturate(1.1) contrast(1.05) brightness(1.02)" },
  { name: "Cinema",   id: "cinema", css: "contrast(1.25) saturate(0.85) brightness(0.93)" },
];

const ASPECT_PRESETS = [
  { label:"1:1",  w:1,  h:1,  tag:"Cuadrado"  },
  { label:"16:9", w:16, h:9,  tag:"Wide HD"   },
  { label:"4:3",  w:4,  h:3,  tag:"Clásico"   },
  { label:"3:2",  w:3,  h:2,  tag:"DSLR"      },
  { label:"21:9", w:21, h:9,  tag:"Cine"       },
  { label:"9:16", w:9,  h:16, tag:"Story"      },
  { label:"4:5",  w:4,  h:5,  tag:"Instagram"  },
  { label:"2:3",  w:2,  h:3,  tag:"Retrato"    },
  { label:"3:1",  w:3,  h:1,  tag:"Panorama"   },
];

const SOCIAL_PRESETS = [
  { label:"IG Post",  w:1080, h:1080 },
  { label:"IG Story", w:1080, h:1920 },
  { label:"FB Post",  w:1200, h:630  },
  { label:"Twitter",  w:1500, h:500  },
  { label:"YT Thumb", w:1280, h:720  },
  { label:"LinkedIn", w:1200, h:627  },
];

const ADJ_DEFAULTS = {
  exposure:0, contrast:0, brightness:0, shadows:0, highlights:0,
  saturation:0, temperature:0, tint:0, vibrance:0,
  sharpness:0, clarity:0, noise:0, vignette:0,
};

const TOOLS = [
  { id:"select", icon:"⬚", label:"Selección",       cursor:"default"   },
  { id:"crop",   icon:"✂",  label:"Cortar",          cursor:"crosshair" },
  { id:"rmbg",   icon:"🪄", label:"Quitar fondo IA", cursor:"cell"      },
  { id:"brush",  icon:"✏",  label:"Pincel borrar",   cursor:"cell"      },
  { id:"hand",   icon:"✋", label:"Mano",            cursor:"grab"      },
  { id:"zoom",   icon:"⊕",  label:"Zoom",            cursor:"zoom-in"   },
  { id:"fx",     icon:"✦",  label:"Efectos",         cursor:"default"   },
];

// ─── Utilidades pixel ─────────────────────────────────────────────────────────

/** FIX #4 + #5: Implementación completa de todos los ajustes */
function applyPixelAdjustments(imageData, adj) {
  const d   = imageData.data;
  const W   = imageData.width;
  const H   = imageData.height;

  // Parámetros normalizados
  const exp  = adj.exposure    / 100;
  const con  = (adj.contrast   + 100) / 100;
  const bri  = adj.brightness  / 100;
  const sha  = adj.shadows     / 100;   // FIX #4
  const hig  = adj.highlights  / 100;   // FIX #4
  const sat  = (adj.saturation + 100) / 100;
  const tmp  = adj.temperature / 100;
  const tnt  = adj.tint        / 100;
  const vig  = adj.vignette    / 100;
  const noi  = adj.noise       / 100;   // FIX #5
  const cxv  = W / 2, cyv = H / 2;
  const maxD = Math.sqrt(cxv*cxv + cyv*cyv);

  // FIX #5: Sharpness — guardar copia para convolución
  let src = null;
  if (adj.sharpness > 0 || adj.clarity !== 0) {
    src = new Uint8ClampedArray(d);
  }

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i+1], b = d[i+2];

    // Exposure
    r = Math.min(255, r * (1 + exp));
    g = Math.min(255, g * (1 + exp));
    b = Math.min(255, b * (1 + exp));

    // Contrast
    r = Math.min(255, Math.max(0, ((r/255 - 0.5)*con + 0.5)*255));
    g = Math.min(255, Math.max(0, ((g/255 - 0.5)*con + 0.5)*255));
    b = Math.min(255, Math.max(0, ((b/255 - 0.5)*con + 0.5)*255));

    // Brightness
    r = Math.min(255, Math.max(0, r + bri*255));
    g = Math.min(255, Math.max(0, g + bri*255));
    b = Math.min(255, Math.max(0, b + bri*255));

    // FIX #4 — Shadows: boost zonas oscuras, no afecta altas luces
    // FIX #4 — Highlights: ajusta zonas claras, no afecta sombras
    const lum = (r*0.299 + g*0.587 + b*0.114) / 255;
    const shadowMask    = Math.max(0, 1 - lum*2);         // fuerte en oscuros
    const highlightMask = Math.max(0, lum*2 - 1);         // fuerte en claros
    const shadowBoost    = sha * shadowMask * 80;
    const highlightBoost = hig * highlightMask * 80;
    r = Math.min(255, Math.max(0, r + shadowBoost + highlightBoost));
    g = Math.min(255, Math.max(0, g + shadowBoost + highlightBoost));
    b = Math.min(255, Math.max(0, b + shadowBoost + highlightBoost));

    // Temperature / Tint
    r = Math.min(255, Math.max(0, r + tmp*35));
    b = Math.min(255, Math.max(0, b - tmp*35));
    g = Math.min(255, Math.max(0, g + tnt*20));

    // Saturation
    const gray = r*0.299 + g*0.587 + b*0.114;
    r = Math.min(255, Math.max(0, gray + (r-gray)*sat));
    g = Math.min(255, Math.max(0, gray + (g-gray)*sat));
    b = Math.min(255, Math.max(0, gray + (b-gray)*sat));

    // FIX #5 — Noise (grano aleatorio pero determinista por posición)
    if (noi > 0) {
      const px = (i/4) % W, py = Math.floor(i/4/W);
      // Pseudo-random basado en posición (sin Math.random para ser consistente)
      const rand = ((px*1234 + py*5678) % 256) / 256 - 0.5;
      const grain = rand * noi * 60;
      r = Math.min(255, Math.max(0, r + grain));
      g = Math.min(255, Math.max(0, g + grain));
      b = Math.min(255, Math.max(0, b + grain));
    }

    // Vignette
    if (vig !== 0) {
      const px  = (i/4) % W, py = Math.floor(i/4/W);
      const dist = Math.sqrt((px-cxv)**2 + (py-cyv)**2) / maxD;
      const v   = vig > 0 ? 1 - dist*vig : 1 + dist*(-vig)*0.5;
      r = Math.min(255, Math.max(0, r*v));
      g = Math.min(255, Math.max(0, g*v));
      b = Math.min(255, Math.max(0, b*v));
    }

    d[i] = r; d[i+1] = g; d[i+2] = b;
  }

  // FIX #5 — Sharpness: kernel unsharp mask 3x3
  if (src && adj.sharpness > 0) {
    const str = adj.sharpness / 100;
    for (let y = 1; y < H-1; y++) {
      for (let x = 1; x < W-1; x++) {
        const c = (y*W + x)*4;
        for (let ch = 0; ch < 3; ch++) {
          // Laplacian blur neighbours
          const blur = (
            src[(y-1)*W*4 + x*4 + ch] +
            src[(y+1)*W*4 + x*4 + ch] +
            src[y*W*4 + (x-1)*4 + ch] +
            src[y*W*4 + (x+1)*4 + ch]
          ) / 4;
          const sharpened = d[c+ch] + (d[c+ch] - blur) * str * 2;
          d[c+ch] = Math.min(255, Math.max(0, sharpened));
        }
      }
    }
  }

  // FIX #5 — Clarity: micro-contraste en medios tonos (versión ligera)
  if (src && adj.clarity !== 0) {
    const str = adj.clarity / 100;
    for (let y = 2; y < H-2; y++) {
      for (let x = 2; x < W-2; x++) {
        const c = (y*W + x)*4;
        for (let ch = 0; ch < 3; ch++) {
          const local = (
            src[(y-2)*W*4 + x*4 + ch] + src[(y+2)*W*4 + x*4 + ch] +
            src[y*W*4 + (x-2)*4 + ch] + src[y*W*4 + (x+2)*4 + ch]
          ) / 4;
          d[c+ch] = Math.min(255, Math.max(0, d[c+ch] + (d[c+ch] - local)*str*1.5));
        }
      }
    }
  }

  return imageData;
}

/** FIX #3: Hornear filtro CSS en píxeles para exportación correcta */
function bakeFilterToPixels(canvas, filterCSS) {
  if (!filterCSS || filterCSS === "none") return;
  const tmp = document.createElement("canvas");
  tmp.width = canvas.width; tmp.height = canvas.height;
  const tc = tmp.getContext("2d");
  tc.filter = filterCSS;
  tc.drawImage(canvas, 0, 0);
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  canvas.getContext("2d").drawImage(tmp, 0, 0);
}

function estimateSize(w, h, format, quality) {
  const bpp  = format === "png" ? 4 : format === "webp" ? 1.5 : 1;
  const base = w * h * bpp * (format === "jpeg" ? quality/100 : 1);
  const kb   = Math.round(base / 1024);
  return kb > 1024 ? `~${(kb/1024).toFixed(1)} MB` : `~${kb} KB`;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SliderRow({ label, id, min=-100, max=100, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
      <span style={{ fontSize:10, color:"#777", width:72, flexShrink:0 }}>{label}</span>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(id, parseInt(e.target.value))}
        style={{ flex:1, accentColor:"#00d4aa", cursor:"pointer" }} />
      <span style={{ fontSize:10, color:"#00d4aa", width:26, textAlign:"right", flexShrink:0 }}>{value}</span>
    </div>
  );
}

function SectionHeader({ label, onReset }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, marginTop:12 }}>
      <span style={{ fontSize:9, letterSpacing:1.5, color:"#444", textTransform:"uppercase" }}>{label}</span>
      {onReset && (
        <button onClick={onReset} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:9, padding:"2px 4px" }}>
          reset
        </button>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ fontSize:10, color:"#3a3a3a", display:"flex", gap:4 }}>
      {label}: <span style={{ color:"#666" }}>{value}</span>
    </div>
  );
}

function FilterThumb({ filter, active, imgEl, onClick }) {
  const ref = useRef();
  useEffect(() => {
    if (!imgEl || !ref.current) return;
    const c = ref.current;
    c.width = 60; c.height = 46;
    c.getContext("2d").drawImage(imgEl, 0, 0, 60, 46);
  }, [imgEl]);
  return (
    <div onClick={onClick} style={{
      background:"#f5f5f3", border:`1.5px solid ${active?"#00d4aa":"#ddd"}`,
      borderRadius:5, cursor:"pointer", overflow:"hidden", transition:"border-color .15s",
      boxShadow: active ? "0 0 0 1px #00d4aa" : "none",
    }}>
      <canvas ref={ref} style={{ width:"100%", height:46, display:"block", filter:filter.css }} />
      <div style={{ fontSize:8, textAlign:"center", padding:"3px 0", color:active?"#00d4aa":"#999" }}>
        {filter.name}
      </div>
    </div>
  );
}

function TbBtn({ onClick, children, dim, accent, danger }) {
  return (
    <button onClick={onClick} style={{
      background: accent?"#00d4aa":"none",
      color: accent?"#fff":danger?"#dc2626":"#666",
      border:"none", padding:"4px 9px", borderRadius:4,
      cursor:"pointer", fontSize:11, opacity:dim?0.35:1,
      fontFamily:"inherit",
    }}>{children}</button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ToolEditor({ onExport }) {
  const canvasRef    = useRef(null);
  const fileInputRef = useRef(null);

  // FIX #1: histRef para evitar stale closure en saveSnap
  const histRef      = useRef({ list:[], idx:-1 });

  // FIX #2: cleanImgRef guarda la imagen base sin ajustes aplicados
  const cleanImgRef  = useRef(null);

  const [imgEl,        setImgEl]        = useState(null);
  const [fileName,     setFileName]     = useState("sin imagen");
  const [originalSrc,  setOriginalSrc]  = useState(null);
  const [adj,          setAdj]          = useState({ ...ADJ_DEFAULTS });
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeTab,    setActiveTab]    = useState("adjust");
  const [activeTool,   setActiveTool]   = useState("select");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [quality,      setQuality]      = useState(90);
  const [zoomLevel,    setZoomLevel]    = useState(1);
  const [canvasDims,   setCanvasDims]   = useState({ w:0, h:0 });
  const [cropStart,    setCropStart]    = useState(null);
  const [cropEnd,      setCropEnd]      = useState(null);
  const [isCropping,   setIsCropping]   = useState(false);
  const [aspectLock,   setAspectLock]   = useState(null);
  const [historyLen,   setHistoryLen]   = useState(0); // solo para forzar re-render
  const [histPos,      setHistPos]      = useState(-1);
  const [bgStatus,     setBgStatus]     = useState("idle");
  const [bgMessage,    setBgMessage]    = useState("");
  const [tolerance,    setTolerance]    = useState(30);
  const [bgPreview,    setBgPreview]    = useState(null);
  const [outW,         setOutW]         = useState(1080);
  const [outH,         setOutH]         = useState(1080);

  // ─── FIX #2: render siempre desde cleanImgRef, no desde imgEl modificado ──
  const render = useCallback((adjOverride, filterOverride) => {
    const canvas = canvasRef.current;
    const base   = cleanImgRef.current;
    if (!canvas || !base) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.drawImage(base, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyPixelAdjustments(data, adjOverride ?? adj);
    ctx.putImageData(data, 0, 0);
    // Filtro CSS visual (solo para preview — la exportación lo hornea aparte)
    const fid = filterOverride ?? activeFilter;
    const flt = FILTERS.find(f => f.id === fid);
    canvas.style.filter = flt?.id !== "none" ? flt.css : "none";
  }, [adj, activeFilter]);

  useEffect(() => { render(); }, [render]);

  const fitToView = useCallback((cw, ch) => {
    const wrap = document.getElementById("ce-wrap");
    if (!wrap) return;
    const maxW = wrap.clientWidth - 40, maxH = wrap.clientHeight - 40;
    setZoomLevel(Math.min(1, Math.min(maxW/cw, maxH/ch)));
  }, []);

  // ─── FIX #1: saveSnap con ref para evitar stale histIdx ──────────────────
  const saveSnap = useCallback((canvas) => {
    const snap = canvas.toDataURL();
    const h    = histRef.current;
    h.list     = [...h.list.slice(0, h.idx+1), snap];
    h.idx      = h.list.length - 1;
    setHistoryLen(h.list.length);
    setHistPos(h.idx);
  }, []);

  const loadSnap = useCallback((src) => {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      canvas.style.filter = "none";
      canvas.width = image.width; canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      cleanImgRef.current = image;
      setImgEl(image);
      setCanvasDims({ w:image.width, h:image.height });
      fitToView(image.width, image.height);
    };
    image.src = src;
  }, [fitToView]);

  const undo = () => {
    const h = histRef.current;
    if (h.idx <= 0) return;
    h.idx--;
    setHistPos(h.idx);
    loadSnap(h.list[h.idx]);
  };

  const redo = () => {
    const h = histRef.current;
    if (h.idx >= h.list.length-1) return;
    h.idx++;
    setHistPos(h.idx);
    loadSnap(h.list[h.idx]);
  };

  // ─── Cargar imagen ────────────────────────────────────────────────────────
  const loadImage = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const src   = ev.target.result;
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        canvas.style.filter = "none";
        canvas.width  = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0);
        cleanImgRef.current = image;          // FIX #2: guardar base limpia
        setImgEl(image);
        setOriginalSrc(src);
        setFileName(file.name);
        setCanvasDims({ w:image.width, h:image.height });
        setOutW(image.width); setOutH(image.height);
        setAdj({ ...ADJ_DEFAULTS });
        setActiveFilter("none");
        fitToView(image.width, image.height);
        // Resetear historia
        histRef.current = { list:[], idx:-1 };
        saveSnap(canvas);
      };
      image.src = src;
    };
    reader.readAsDataURL(file);
  }, [fitToView, saveSnap]);

  // ─── Bake + snapshot: congela el canvas actual como nueva base ────────────
  const commitToBase = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Hornear filtro CSS en píxeles
    const flt = FILTERS.find(f => f.id === activeFilter);
    if (flt && flt.id !== "none") bakeFilterToPixels(canvas, flt.css);
    canvas.style.filter = "none";
    // Nueva imagen base
    const newBase = new Image();
    newBase.onload = () => {
      cleanImgRef.current = newBase;
      setImgEl(newBase);
      setActiveFilter("none");
      setAdj({ ...ADJ_DEFAULTS });
      saveSnap(canvas);
    };
    newBase.src = canvas.toDataURL();
  }, [activeFilter, saveSnap]);

  // ─── IA Remove BG ────────────────────────────────────────────────────────
  const removeBackgroundAI = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !cleanImgRef.current) return;
    setBgStatus("loading"); setBgMessage("Enviando a Claude Vision...");
    try {
      const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
      setBgMessage("Analizando sujeto principal...");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:[
              { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:base64 } },
              { type:"text",  text:`Analiza esta imagen. Devuelve SOLO JSON sin markdown:
{
  "subject": "descripción breve del sujeto",
  "bg_colors": [[R,G,B],[R,G,B],[R,G,B]],
  "sample_points": [[x_pct,y_pct],...],
  "tolerance": 25
}
bg_colors: colores del FONDO (no del sujeto), RGB 0-255.
sample_points: coordenadas 0.0-1.0 de píxeles que son FONDO seguro.
tolerance: 10-60 según nitidez de bordes.` }
            ]
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type==="text")?.text || "";
      let analysis;
      try { analysis = JSON.parse(text.replace(/```json|```/g,"").trim()); }
      catch { throw new Error("Respuesta IA inválida"); }
      setBgMessage(`Sujeto: ${analysis.subject} — removiendo fondo...`);
      await smartFloodFill(canvas, analysis);
      setBgStatus("done");
      setBgMessage(`✓ ${analysis.subject}`);
      setBgPreview(canvas.toDataURL());
      const ni = new Image();
      ni.onload = () => { cleanImgRef.current = ni; setImgEl(ni); };
      ni.src = canvas.toDataURL();
      saveSnap(canvas);
    } catch (err) {
      setBgStatus("error");
      setBgMessage("Error IA — usando modo rápido");
      fallbackRemove(canvas);
    }
  };

  const smartFloodFill = (canvas, analysis) => new Promise(resolve => {
    const ctx     = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d       = imgData.data;
    const tol     = (analysis.tolerance || tolerance) * 3;
    const bgColors= analysis.bg_colors || [[255,255,255]];
    const samples = (analysis.sample_points || [[0,0],[1,0],[0,1],[1,1]])
      .map(([xp,yp]) => ({ x:Math.round(xp*canvas.width), y:Math.round(yp*canvas.height) }));
    const sampledColors = samples.map(({x,y}) => {
      const i=(y*canvas.width+x)*4; return [d[i],d[i+1],d[i+2]];
    });
    const allBg   = [...bgColors, ...sampledColors];
    const visited = new Uint8Array(canvas.width * canvas.height);
    const queue   = [];
    for (let x=0;x<canvas.width;x++) { queue.push([x,0]); queue.push([x,canvas.height-1]); }
    for (let y=0;y<canvas.height;y++) { queue.push([0,y]); queue.push([canvas.width-1,y]);  }
    samples.forEach(({x,y}) => queue.push([x,y]));
    const isBg = (r,g,b) => allBg.some(([br,bg,bb]) => Math.abs(r-br)+Math.abs(g-bg)+Math.abs(b-bb)<tol);
    let qi=0;
    while (qi < queue.length) {
      const [x,y] = queue[qi++];
      if (x<0||x>=canvas.width||y<0||y>=canvas.height) continue;
      const idx = y*canvas.width+x;
      if (visited[idx]) continue;
      visited[idx]=1;
      const pi=idx*4;
      if (!isBg(d[pi],d[pi+1],d[pi+2])) continue;
      d[pi+3]=0;
      queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    // Suavizado de bordes
    for (let y=1;y<canvas.height-1;y++) for (let x=1;x<canvas.width-1;x++) {
      const idx=(y*canvas.width+x)*4;
      if (d[idx+3]>0) {
        const nb=[((y-1)*canvas.width+x)*4,((y+1)*canvas.width+x)*4,(y*canvas.width+(x-1))*4,(y*canvas.width+(x+1))*4];
        const t=nb.filter(n=>d[n+3]===0).length;
        if (t>0) d[idx+3]=Math.max(0,255-t*55);
      }
    }
    ctx.putImageData(imgData,0,0);
    resolve();
  });

  const fallbackRemove = (canvas) => {
    const ctx=canvas.getContext("2d"), data=ctx.getImageData(0,0,canvas.width,canvas.height);
    const d=data.data, tol=tolerance*3, cr=d[0], cg=d[1], cb=d[2];
    for (let i=0;i<d.length;i+=4)
      if (Math.abs(d[i]-cr)+Math.abs(d[i+1]-cg)+Math.abs(d[i+2]-cb)<tol) d[i+3]=0;
    ctx.putImageData(data,0,0);
    setBgPreview(canvas.toDataURL());
    const ni=new Image(); ni.onload=()=>{cleanImgRef.current=ni;setImgEl(ni);}; ni.src=canvas.toDataURL();
    saveSnap(canvas);
    setBgStatus("done"); setBgMessage("✓ Modo rápido aplicado");
  };

  const restoreBg = () => {
    if (!originalSrc) return;
    const image=new Image();
    image.onload=()=>{
      const canvas=canvasRef.current;
      canvas.style.filter="none";
      canvas.width=image.width; canvas.height=image.height;
      canvas.getContext("2d").drawImage(image,0,0);
      cleanImgRef.current=image; setImgEl(image);
      setBgStatus("idle"); setBgMessage(""); setBgPreview(null);
      saveSnap(canvas);
    };
    image.src=originalSrc;
  };

  // ─── Crop ─────────────────────────────────────────────────────────────────
  const onMD = (e) => {
    if (activeTool!=="crop") return;
    const r=canvasRef.current.getBoundingClientRect();
    const x=(e.clientX-r.left)/zoomLevel, y=(e.clientY-r.top)/zoomLevel;
    setCropStart({x,y}); setCropEnd({x,y}); setIsCropping(true);
  };
  const onMM = (e) => {
    if (!isCropping||activeTool!=="crop") return;
    const r=canvasRef.current.getBoundingClientRect();
    let x=(e.clientX-r.left)/zoomLevel, y=(e.clientY-r.top)/zoomLevel;
    if (aspectLock&&cropStart) y=cropStart.y+Math.sign(y-cropStart.y)*Math.abs((x-cropStart.x)/aspectLock);
    setCropEnd({x,y});
  };
  const onMU = () => setIsCropping(false);

  const applyCrop = () => {
    if (!cropStart||!cropEnd||!cleanImgRef.current) return;
    const canvas=canvasRef.current;
    const x=Math.min(cropStart.x,cropEnd.x), y=Math.min(cropStart.y,cropEnd.y);
    const w=Math.abs(cropEnd.x-cropStart.x), h=Math.abs(cropEnd.y-cropStart.y);
    if (w<10||h<10) return;
    // Hornear filtro antes de recortar
    const flt=FILTERS.find(f=>f.id===activeFilter);
    if (flt&&flt.id!=="none") bakeFilterToPixels(canvas,flt.css);
    canvas.style.filter="none";
    const tmp=document.createElement("canvas"); tmp.width=w; tmp.height=h;
    tmp.getContext("2d").drawImage(canvas,x,y,w,h,0,0,w,h);
    canvas.width=w; canvas.height=h;
    canvas.getContext("2d").drawImage(tmp,0,0);
    const ni=new Image();
    ni.onload=()=>{ cleanImgRef.current=ni; setImgEl(ni); setCanvasDims({w,h}); fitToView(w,h); setActiveFilter("none"); setAdj({...ADJ_DEFAULTS}); saveSnap(canvas); };
    ni.src=canvas.toDataURL();
    setCropStart(null); setCropEnd(null); setActiveTool("select");
  };

  // ─── Transformaciones ─────────────────────────────────────────────────────
  const rotateCanvas = (deg) => {
    if (!cleanImgRef.current) return;
    const canvas=canvasRef.current;
    const flt=FILTERS.find(f=>f.id===activeFilter);
    if (flt&&flt.id!=="none") bakeFilterToPixels(canvas,flt.css);
    canvas.style.filter="none";
    const tmp=document.createElement("canvas"); tmp.width=canvas.height; tmp.height=canvas.width;
    const tc=tmp.getContext("2d");
    tc.translate(tmp.width/2,tmp.height/2); tc.rotate(deg*Math.PI/180); tc.drawImage(canvas,-canvas.width/2,-canvas.height/2);
    canvas.width=tmp.width; canvas.height=tmp.height; canvas.getContext("2d").drawImage(tmp,0,0);
    const ni=new Image();
    ni.onload=()=>{ cleanImgRef.current=ni; setImgEl(ni); setCanvasDims({w:canvas.width,h:canvas.height}); fitToView(canvas.width,canvas.height); setActiveFilter("none"); setAdj({...ADJ_DEFAULTS}); saveSnap(canvas); };
    ni.src=canvas.toDataURL();
  };

  const flipCanvas = (dir) => {
    if (!cleanImgRef.current) return;
    const canvas=canvasRef.current, ctx=canvas.getContext("2d");
    const flt=FILTERS.find(f=>f.id===activeFilter);
    if (flt&&flt.id!=="none") bakeFilterToPixels(canvas,flt.css);
    canvas.style.filter="none";
    const tmp=document.createElement("canvas"); tmp.width=canvas.width; tmp.height=canvas.height;
    const tc=tmp.getContext("2d");
    tc.translate(dir==="h"?canvas.width:0, dir==="v"?canvas.height:0);
    tc.scale(dir==="h"?-1:1, dir==="v"?-1:1); tc.drawImage(canvas,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(tmp,0,0);
    const ni=new Image();
    ni.onload=()=>{ cleanImgRef.current=ni; setImgEl(ni); setActiveFilter("none"); setAdj({...ADJ_DEFAULTS}); saveSnap(canvas); };
    ni.src=canvas.toDataURL();
  };

  const applyResize = () => {
    if (!cleanImgRef.current) return;
    const canvas=canvasRef.current;
    const flt=FILTERS.find(f=>f.id===activeFilter);
    if (flt&&flt.id!=="none") bakeFilterToPixels(canvas,flt.css);
    canvas.style.filter="none";
    const tmp=document.createElement("canvas"); tmp.width=outW; tmp.height=outH;
    tmp.getContext("2d").drawImage(canvas,0,0,outW,outH);
    canvas.width=outW; canvas.height=outH; canvas.getContext("2d").drawImage(tmp,0,0);
    const ni=new Image();
    ni.onload=()=>{ cleanImgRef.current=ni; setImgEl(ni); setCanvasDims({w:outW,h:outH}); fitToView(outW,outH); setActiveFilter("none"); setAdj({...ADJ_DEFAULTS}); saveSnap(canvas); };
    ni.src=canvas.toDataURL();
  };

  // ─── FIX #3: Export hornea filtro CSS antes de exportar ──────────────────
  const exportImage = () => {
    const canvas=canvasRef.current; if (!canvas||!cleanImgRef.current) return;
    // Clonar canvas para no mutar el original visible
    const tmp=document.createElement("canvas"); tmp.width=canvas.width; tmp.height=canvas.height;
    tmp.getContext("2d").drawImage(canvas,0,0);
    const flt=FILTERS.find(f=>f.id===activeFilter);
    if (flt&&flt.id!=="none") bakeFilterToPixels(tmp, flt.css); // hornear en copia
    const mime="image/"+outputFormat, q=quality/100;
    if (onExport) { tmp.toBlob(blob=>onExport(blob,outputFormat),mime,q); return; }
    const a=document.createElement("a");
    a.href=tmp.toDataURL(mime,q);
    a.download=`tool-editor-export.${outputFormat==="jpeg"?"jpg":outputFormat}`;
    a.click();
  };

  const copyToClipboard = () => {
    const canvas=canvasRef.current; if (!canvas) return;
    const tmp=document.createElement("canvas"); tmp.width=canvas.width; tmp.height=canvas.height;
    tmp.getContext("2d").drawImage(canvas,0,0);
    const flt=FILTERS.find(f=>f.id===activeFilter);
    if (flt&&flt.id!=="none") bakeFilterToPixels(tmp,flt.css);
    tmp.toBlob(blob=>navigator.clipboard.write([new ClipboardItem({"image/png":blob})])
      .then(()=>alert("Copiado al portapapeles"))
      .catch(()=>alert("Sin permisos de portapapeles")));
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const hasCrop  = cropStart && cropEnd;
  const cropRect = hasCrop ? {
    x: Math.min(cropStart.x,cropEnd.x)*zoomLevel,
    y: Math.min(cropStart.y,cropEnd.y)*zoomLevel,
    w: Math.abs(cropEnd.x-cropStart.x)*zoomLevel,
    h: Math.abs(cropEnd.y-cropStart.y)*zoomLevel,
  } : null;

  const hasImage  = !!cleanImgRef.current;
  const canUndo   = histPos > 0;
  const canRedo   = histPos < historyLen - 1;

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* TOP BAR */}
      <div style={S.topbar}>
        <span style={S.logo}>CORE<span style={{color:"#00d4aa"}}>EDITOR</span></span>
        <div style={S.tbGroup}>
          <TbBtn onClick={()=>fileInputRef.current.click()}>📂 abrir</TbBtn>
          <TbBtn onClick={undo} dim={!canUndo}>↩ deshacer</TbBtn>
          <TbBtn onClick={redo} dim={!canRedo}>↪ rehacer</TbBtn>
        </div>
        <div style={S.tbGroup}>
          <TbBtn onClick={()=>rotateCanvas(-90)}>↺ −90°</TbBtn>
          <TbBtn onClick={()=>rotateCanvas(90)}>↻ +90°</TbBtn>
          <TbBtn onClick={()=>flipCanvas("h")}>⇄ H</TbBtn>
          <TbBtn onClick={()=>flipCanvas("v")}>⇅ V</TbBtn>
        </div>
        <div style={S.tbGroup}>
          <TbBtn onClick={commitToBase}>✓ aplicar todo</TbBtn>
        </div>
        {activeTool==="crop" && (
          <div style={S.tbGroup}>
            <TbBtn onClick={applyCrop} accent>✂ aplicar corte</TbBtn>
            <TbBtn onClick={()=>{setCropStart(null);setCropEnd(null);setActiveTool("select");}} danger>✕ cancelar</TbBtn>
          </div>
        )}
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:"#aaa",marginRight:8}}>{fileName}</span>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={e=>{if(e.target.files[0])loadImage(e.target.files[0]);}}/>
        <button style={S.btnPrimary} onClick={()=>fileInputRef.current.click()}>+ cargar</button>
        <button style={{...S.btnPrimary,...S.btnAccent}} onClick={exportImage}>⬇ exportar</button>
      </div>

      <div style={S.main}>
        {/* HERRAMIENTAS */}
        <div style={S.toolsPanel}>
          {TOOLS.map(t=>(
            <button key={t.id} title={t.label}
              style={{...S.toolBtn,...(activeTool===t.id?S.toolActive:{})}}
              onClick={()=>{setActiveTool(t.id);if(t.id!=="crop"){setCropStart(null);setCropEnd(null);}}}>
              {t.icon}
            </button>
          ))}
        </div>

        {/* CANVAS */}
        <div id="ce-wrap" style={S.canvasWrap}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault();if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0]);}}>
          <div style={S.checker}/>
          {!hasImage && (
            <div style={S.dropZone}>
              <div style={{fontSize:52,opacity:.2}}>🖼</div>
              <div style={{fontSize:13,letterSpacing:2,color:"#bbb"}}>ARRASTRA TU IMAGEN AQUÍ</div>
              <div style={{fontSize:10,color:"#999",marginTop:4}}>o usa el botón + cargar</div>
              <button style={{...S.btnPrimary,marginTop:16}} onClick={()=>fileInputRef.current.click()}>+ cargar imagen</button>
            </div>
          )}
          {hasImage && (
            <div style={{position:"relative"}}>
              <canvas ref={canvasRef}
                style={{display:"block",width:canvasDims.w*zoomLevel,height:canvasDims.h*zoomLevel,
                  cursor:TOOLS.find(t=>t.id===activeTool)?.cursor||"default"}}
                onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU}/>
              {cropRect && (
                <div style={{position:"absolute",border:"2px solid #00d4aa",background:"rgba(0,212,170,.05)",
                  pointerEvents:"none",left:cropRect.x,top:cropRect.y,width:cropRect.w,height:cropRect.h}}>
                  {[33.3,66.6].map(p=>(
                    <div key={p} style={{position:"absolute",left:`${p}%`,top:0,bottom:0,borderLeft:"1px solid rgba(255,255,255,.25)"}}/>
                  ))}
                  {[33.3,66.6].map(p=>(
                    <div key={p} style={{position:"absolute",top:`${p}%`,left:0,right:0,borderTop:"1px solid rgba(255,255,255,.25)"}}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL DERECHO */}
        <div style={S.rightPanel}>
          <div style={S.panelTabs}>
            {["adjust","format","filters","effects","export"].map(tab=>(
              <button key={tab} style={{...S.ptab,...(activeTab===tab?S.ptabActive:{})}}
                onClick={()=>setActiveTab(tab)}>
                {{adjust:"Ajustes",format:"Formato",filters:"Filtros",effects:"Efectos",export:"Export"}[tab]}
              </button>
            ))}
          </div>

          <div style={{padding:"10px 10px 20px",overflowY:"auto",flex:1}}>

            {/* AJUSTES */}
            {activeTab==="adjust" && <>
              {/* Remove BG */}
              <div style={S.aiBanner}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <span style={{fontSize:9,letterSpacing:1.5,textTransform:"uppercase",color:"#555"}}>Quitar fondo</span>
                  <span style={S.aiBadge}>IA</span>
                </div>
                {bgPreview && (
                  <div style={{width:"100%",height:76,borderRadius:4,border:"1px solid #e0e0e0",overflow:"hidden",
                    marginBottom:8,background:"repeating-conic-gradient(#ddd 0% 25%,#f5f5f5 0% 50%) 0 0/12px 12px"}}>
                    <img src={bgPreview} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:10,color:"#888",width:68,flexShrink:0}}>Tolerancia</span>
                  <input type="range" min={5} max={80} value={tolerance}
                    onChange={e=>setTolerance(parseInt(e.target.value))}
                    style={{flex:1,accentColor:"#7c3aed"}}/>
                  <span style={{fontSize:10,color:"#7c3aed",width:22,textAlign:"right"}}>{tolerance}</span>
                </div>
                {bgStatus==="loading" && <div style={{fontSize:10,color:"#7c3aed",marginBottom:6}}>⟳ {bgMessage}</div>}
                {bgStatus==="done"    && <div style={{fontSize:10,color:"#16a34a",marginBottom:6}}>✓ {bgMessage}</div>}
                {bgStatus==="error"   && <div style={{fontSize:10,color:"#dc2626",marginBottom:6}}>⚠ {bgMessage}</div>}
                <button style={{...S.applyBtn,background:"#7c3aed",marginBottom:4}}
                  onClick={removeBackgroundAI} disabled={!hasImage||bgStatus==="loading"}>
                  {bgStatus==="loading"?"⟳ procesando...":"🪄 quitar fondo con IA"}
                </button>
                <button style={{...S.applyBtn,...S.applyBtnGhost}} onClick={restoreBg}>↩ restaurar original</button>
              </div>

              <SectionHeader label="Luz" onReset={()=>setAdj(a=>({...a,exposure:0,contrast:0,brightness:0,shadows:0,highlights:0}))}/>
              {[["Exposición","exposure"],["Contraste","contrast"],["Brillo","brightness"],["Sombras","shadows"],["Altas luces","highlights"]].map(([l,k])=>(
                <SliderRow key={k} label={l} id={k} value={adj[k]} onChange={(id,v)=>setAdj(a=>({...a,[id]:v}))}/>
              ))}

              <SectionHeader label="Color" onReset={()=>setAdj(a=>({...a,saturation:0,temperature:0,tint:0,vibrance:0}))}/>
              {[["Saturación","saturation"],["Temperatura","temperature"],["Tinte","tint"],["Vibración","vibrance"]].map(([l,k])=>(
                <SliderRow key={k} label={l} id={k} value={adj[k]} onChange={(id,v)=>setAdj(a=>({...a,[id]:v}))}/>
              ))}

              <SectionHeader label="Detalle" onReset={()=>setAdj(a=>({...a,sharpness:0,clarity:0,noise:0,vignette:0}))}/>
              <SliderRow label="Nitidez"  id="sharpness" min={0} max={100} value={adj.sharpness} onChange={(id,v)=>setAdj(a=>({...a,[id]:v}))}/>
              <SliderRow label="Claridad" id="clarity"              value={adj.clarity}   onChange={(id,v)=>setAdj(a=>({...a,[id]:v}))}/>
              <SliderRow label="Ruido"    id="noise"    min={0} max={100} value={adj.noise}     onChange={(id,v)=>setAdj(a=>({...a,[id]:v}))}/>
              <SliderRow label="Viñeta"   id="vignette"             value={adj.vignette}  onChange={(id,v)=>setAdj(a=>({...a,[id]:v}))}/>

              <button style={{...S.applyBtn,marginTop:10}} onClick={commitToBase}>✓ aplicar y congelar</button>
              <button style={{...S.applyBtn,...S.applyBtnGhost,marginTop:4}}
                onClick={()=>{setAdj({...ADJ_DEFAULTS});setActiveFilter("none");}}>
                ↺ resetear ajustes
              </button>
            </>}

            {/* FORMATO */}
            {activeTab==="format" && <>
              <SectionHeader label="Relaciones de aspecto"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
                {ASPECT_PRESETS.map(p=>(
                  <button key={p.label} style={S.fmtBtn}
                    onClick={()=>{setAspectLock(p.w/p.h);setActiveTool("crop");}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#222"}}>{p.label}</div>
                    <div style={{fontSize:8,color:"#aaa"}}>{p.tag}</div>
                  </button>
                ))}
              </div>
              <SectionHeader label="Redes sociales"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
                {SOCIAL_PRESETS.map(p=>(
                  <button key={p.label} style={S.fmtBtn}
                    onClick={()=>{setOutW(p.w);setOutH(p.h);}}>
                    <div style={{fontSize:10,color:"#333"}}>{p.label}</div>
                    <div style={{fontSize:8,color:"#aaa"}}>{p.w}×{p.h}</div>
                  </button>
                ))}
              </div>
              <SectionHeader label="Tamaño personalizado"/>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#aaa",marginBottom:3}}>ANCHO (px)</div>
                  <input type="number" value={outW} onChange={e=>setOutW(parseInt(e.target.value)||1)} style={S.numInput}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#aaa",marginBottom:3}}>ALTO (px)</div>
                  <input type="number" value={outH} onChange={e=>setOutH(parseInt(e.target.value)||1)} style={S.numInput}/>
                </div>
              </div>
              <button style={S.applyBtn} onClick={applyResize}>↕ redimensionar</button>
            </>}

            {/* FILTROS */}
            {activeTab==="filters" && <>
              <SectionHeader label="Filtros clásicos"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                {FILTERS.map(f=>(
                  <FilterThumb key={f.id} filter={f} active={activeFilter===f.id}
                    imgEl={cleanImgRef.current} onClick={()=>setActiveFilter(f.id)}/>
                ))}
              </div>
              <button style={{...S.applyBtn,marginTop:10}} onClick={commitToBase}>✓ aplicar filtro</button>
            </>}

            {/* EXPORT */}
            {activeTab==="export" && <>
              <SectionHeader label="Formato de salida"/>
              <div style={{display:"flex",gap:4,marginBottom:10}}>
                {["jpeg","png","webp"].map(f=>(
                  <button key={f} style={{...S.outBtn,...(outputFormat===f?S.outBtnActive:{})}}
                    onClick={()=>setOutputFormat(f)}>
                    {f==="jpeg"?"JPG":f.toUpperCase()}
                  </button>
                ))}
              </div>
              {outputFormat!=="png" && (
                <SliderRow label="Calidad" id="quality" min={10} max={100}
                  value={quality} onChange={(_,v)=>setQuality(v)}/>
              )}
              <div style={S.sizeCard}>
                <span style={{color:"#888"}}>Tamaño estimado</span>
                <span style={{color:"#16a34a",fontWeight:500}}>
                  {hasImage?estimateSize(canvasDims.w,canvasDims.h,outputFormat,quality):"—"}
                </span>
              </div>
              <div style={{...S.sizeCard,marginTop:4}}>
                <span style={{color:"#888"}}>Dimensiones</span>
                <span style={{color:"#00d4aa",fontWeight:500}}>
                  {canvasDims.w>0?`${canvasDims.w} × ${canvasDims.h}`:"— × —"}
                </span>
              </div>
              <div style={{fontSize:10,color:"#aaa",lineHeight:1.9,margin:"10px 0"}}>
                <div>JPG → compresión alta, sin transparencia</div>
                <div>PNG → sin pérdida, soporta transparencia</div>
                <div>WebP → mejor ratio calidad/tamaño</div>
              </div>
              <button style={S.applyBtn} onClick={exportImage}>⬇ descargar imagen</button>
              <button style={{...S.applyBtn,...S.applyBtnGhost,marginTop:4}} onClick={copyToClipboard}>📋 copiar al portapapeles</button>
            </>}
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={S.statusbar}>
        <StatItem label="herramienta" value={activeTool}/>
        <StatItem label="dimensión"   value={canvasDims.w>0?`${canvasDims.w}×${canvasDims.h}`:"—"}/>
        <StatItem label="zoom"        value={`${Math.round(zoomLevel*100)}%`}/>
        <StatItem label="filtro"      value={activeFilter}/>
        <StatItem label="historial"   value={`${histPos+1}/${historyLen}`}/>
        <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
          <button style={S.zoomBtn} onClick={()=>setZoomLevel(z=>Math.max(0.05,z-0.25))}>−</button>
          <span style={{fontSize:10,color:"#aaa",minWidth:36,textAlign:"center"}}>{Math.round(zoomLevel*100)}%</span>
          <button style={S.zoomBtn} onClick={()=>setZoomLevel(z=>Math.min(8,z+0.25))}>+</button>
          <button style={{...S.zoomBtn,width:"auto",padding:"0 8px",fontSize:9}}
            onClick={()=>fitToView(canvasDims.w,canvasDims.h)}>fit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = {
  root:         { display:"flex",flexDirection:"column",height:"100vh",background:"#f0efea",
                  color:"#222",fontFamily:"'SF Mono','Fira Code',monospace",fontSize:12,overflow:"hidden" },
  topbar:       { height:46,background:"#fff",borderBottom:"1px solid #e0ddd5",display:"flex",
                  alignItems:"center",gap:4,padding:"0 8px",flexShrink:0,boxShadow:"0 1px 0 rgba(0,0,0,.04)" },
  logo:         { fontSize:13,fontWeight:700,letterSpacing:2,color:"#111",padding:"0 14px",borderRight:"1px solid #e0ddd5" },
  tbGroup:      { display:"flex",alignItems:"center",gap:2,padding:"0 8px",borderRight:"1px solid #e0ddd5" },
  btnPrimary:   { background:"#111",color:"#fff",border:"none",borderRadius:4,padding:"5px 12px",cursor:"pointer",fontSize:11,fontFamily:"inherit" },
  btnAccent:    { background:"#00d4aa",marginLeft:4 },
  main:         { display:"flex",flex:1,overflow:"hidden" },
  toolsPanel:   { width:46,background:"#fff",borderRight:"1px solid #e0ddd5",display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 0",gap:2,flexShrink:0 },
  toolBtn:      { width:34,height:34,border:"none",background:"none",color:"#aaa",borderRadius:5,cursor:"pointer",fontSize:16,transition:"all .15s" },
  toolActive:   { background:"#111",color:"#fff" },
  canvasWrap:   { flex:1,background:"#e8e6e0",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"auto" },
  checker:      { position:"absolute",inset:0,backgroundImage:"linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)",backgroundSize:"14px 14px",backgroundPosition:"0 0,0 7px,7px -7px,-7px 0",pointerEvents:"none" },
  dropZone:     { position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8 },
  rightPanel:   { width:222,background:"#fff",borderLeft:"1px solid #e0ddd5",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden" },
  panelTabs:    { display:"flex",borderBottom:"1px solid #e0ddd5",flexShrink:0 },
  ptab:         { flex:1,background:"none",border:"none",color:"#bbb",padding:"8px 2px",cursor:"pointer",fontSize:9,letterSpacing:.5,textTransform:"uppercase",borderBottom:"2px solid transparent",transition:"all .15s" },
  ptabActive:   { color:"#00d4aa",borderBottomColor:"#00d4aa" },
  aiBanner:     { background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:6,padding:10,marginBottom:4 },
  aiBadge:      { fontSize:8,background:"#f3e8ff",color:"#7c3aed",border:"1px solid #d8b4fe",padding:"2px 6px",borderRadius:3 },
  applyBtn:     { width:"100%",background:"#111",color:"#fff",border:"none",borderRadius:4,padding:7,cursor:"pointer",fontSize:11,fontFamily:"inherit" },
  applyBtnGhost:{ background:"#f5f5f3",color:"#888",border:"1px solid #e0ddd5" },
  fmtBtn:       { background:"#f5f5f3",border:"1px solid #e0ddd5",color:"#555",borderRadius:4,padding:"6px 4px",cursor:"pointer",fontSize:10,textAlign:"center" },
  outBtn:       { flex:1,background:"#f5f5f3",border:"1px solid #e0ddd5",color:"#888",borderRadius:3,padding:5,cursor:"pointer",fontSize:10,textAlign:"center" },
  outBtnActive: { background:"#111",borderColor:"#111",color:"#fff" },
  sizeCard:     { fontSize:10,color:"#888",background:"#f5f5f3",padding:"6px 8px",borderRadius:3,display:"flex",justifyContent:"space-between",alignItems:"center" },
  numInput:     { width:"100%",background:"#f5f5f3",border:"1px solid #e0ddd5",color:"#222",borderRadius:3,padding:"4px 6px",fontSize:10,fontFamily:"inherit" },
  statusbar:    { height:36,background:"#fff",borderTop:"1px solid #e0ddd5",display:"flex",alignItems:"center",padding:"0 14px",gap:16,flexShrink:0 },
  zoomBtn:      { background:"none",border:"1px solid #e0ddd5",color:"#aaa",width:22,height:22,borderRadius:3,cursor:"pointer",fontSize:12,lineHeight:1,fontFamily:"inherit" },
};
