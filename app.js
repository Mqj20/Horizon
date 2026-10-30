const CONFIG_URL = "https://cdn.jsdelivr.net/gh/Mqj20/Horizon@main/config.json";
const LABELS = { live: "بث مباشر", movies: "أفلام", series: "مسلسلات" };

async function loadConfig() {
  const res = await fetch(CONFIG_URL + "?t=" + Date.now());
  return res.json();
}

async function fetchXtream(cfg, action) {
  const { server, username, password } = cfg.xtream;
  const url = `${server}/player_api.php?username=${username}&password=${password}&action=${action}`;
  const r = await fetch(url);
  return r.json();
}

function render(cfg, data) {
  document.getElementById("announcement").textContent = cfg.announcement || "";
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (const section of cfg.sections) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${LABELS[section] || section}</h3>`;
    card.addEventListener("click", () => {
      openSection(cfg, section, data);
    });
    grid.appendChild(card);
  }
}

async function openSection(cfg, section, data) {
  const items = data[section] || [];
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const back = document.createElement("div");
  back.className = "card";
  back.textContent = "← رجوع";
  back.onclick = () => render(cfg, data);
  grid.appendChild(back);

  if (items.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "card";
    emptyMsg.style = "grid-column: 1 / -1; text-align: center; color: #ffb74d;";
    emptyMsg.textContent = "لا توجد عناصر في هذا القسم أو حدث خطأ في التحميل.";
    grid.appendChild(emptyMsg);
  }

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = item.name;
    card.onclick = () => {
      playVideo(item.streamUrl);
    };
    grid.appendChild(card);
  }
}

// --- دالة تشغيل الفيديو ---
function playVideo(url) {
  let overlay = document.getElementById("video-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "video-overlay";
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;display:flex;flex-direction:column;";
    
    let video = document.createElement("video");
    video.id = "video-player";
    video.controls = true;
    video.autoplay = true;
    video.style = "width:100%;height:90%;";
    
    let closeBtn = document.createElement("button");
    closeBtn.textContent = "إغلاق المشغل ✖";
    closeBtn.style = "height:10%;background:#e50914;color:#fff;border:none;font-size:18px;font-weight:bold;cursor:pointer;";
    closeBtn.onclick = () => {
      video.pause();
      video.src = "";
      overlay.style.display = "none";
    };
    
    overlay.appendChild(video);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
  }
  
  overlay.style.display = "flex";
  let video = document.getElementById("video-player");
  video.src = url;
  video.play();
}

async function boot() {
  const cfg = await loadConfig();
  let data = { live: [], movies: [], series: [] };

  if (cfg.xtreamEnabled) {
    try {
      const [live, vod] = await Promise.all([
        fetchXtream(cfg, "get_live_streams"),
        fetchXtream(cfg, "get_vod_streams")
      ]);
      
      if (Array.isArray(live)) {
        data.live = live.map(x => ({ name: x.name, streamUrl: `${cfg.xtream.server}/live/${cfg.xtream.username}/${cfg.xtream.password}/${x.stream_id}.m3u8` }));
      }
      if (Array.isArray(vod)) {
        data.movies = vod.map(x => ({ name: x.name, streamUrl: `${cfg.xtream.server}/movie/${cfg.xtream.username}/${cfg.xtream.password}/${x.stream_id}.${x.container_extension}` }));
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في جلب البيانات: " + e.message);
    }
  }
  render(cfg, data);
}

boot();
