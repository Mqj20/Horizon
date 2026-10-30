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

  for (const item of items) {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = item.name;
    card.onclick = () => {
      if (window.HorizonPlayer) {
        HorizonPlayer.play(item.streamUrl, item.name, section === "live");
      } else {
        alert("المشغل غير متصل (هذا طبيعي إذا كنت تختبر من المتصفح)");
      }
    };
    grid.appendChild(card);
  }
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
      data.live = live.map(x => ({ name: x.name, streamUrl: `${cfg.xtream.server}/live/${cfg.xtream.username}/${cfg.xtream.password}/${x.stream_id}.m3u8` }));
      data.movies = vod.map(x => ({ name: x.name, streamUrl: `${cfg.xtream.server}/movie/${cfg.xtream.username}/${cfg.xtream.password}/${x.stream_id}.${x.container_extension}` }));
    } catch (e) {
      console.log("Xtream error or disabled");
    }
  }
  render(cfg, data);
}

boot();
