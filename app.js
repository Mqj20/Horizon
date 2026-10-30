const LABELS = { live: "بث مباشر", movies: "أفلام", series: "مسلسلات" };

// رابط القنوات الخاص بك
const M3U_URL = "http://shoftv.net:80/get.php?username=28365536&password=5839836&type=m3u_plus&output=ts";

async function fetchM3U() {
  // نستخدم وسيط قوي جداً مخصص للملفات النصية
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(M3U_URL)}`;
  
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("فشل تحميل الملف");
  
  const text = await response.text();
  return parseM3U(text);
}

function parseM3U(text) {
  const lines = text.split('\n');
  let live = [], movies = [], series = [];
  let currentInfo = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      // استخراج اسم القناة
      const nameMatch = line.match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1] : "بدون اسم";
      
      // تحديد النوع
      let type = "live";
      if (line.includes('tvg-type="movie"') || line.includes('movie')) type = "movies";
      if (line.includes('tvg-type="series"') || line.includes('series')) type = "series";
      
      currentInfo = { name, type };
    } else if (line.startsWith('http')) {
      if (currentInfo) {
        const item = { name: currentInfo.name, streamUrl: line };
        if (currentInfo.type === "live") live.push(item);
        else if (currentInfo.type === "movies") movies.push(item);
        else if (currentInfo.type === "series") series.push(item);
        currentInfo = null;
      }
    }
  }
  
  // لتقليل الضغط على التطبيق، سنأخذ أول 500 قناة فقط (يمكنك زيادتها لاحقاً)
  return { live: live.slice(0, 500), movies: movies.slice(0, 500), series: series.slice(0, 500) };
}

function render(data) {
  document.getElementById("announcement").textContent = "مرحبًا بكم في Horizon TV";
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (const section of ["live", "movies", "series"]) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${LABELS[section]}</h3>`;
    card.addEventListener("click", () => {
      openSection(section, data);
    });
    grid.appendChild(card);
  }
}

function openSection(section, data) {
  const items = data[section] || [];
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const back = document.createElement("div");
  back.className = "card";
  back.textContent = "← رجوع";
  back.onclick = () => render(data);
  grid.appendChild(back);

  if (items.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "card";
    emptyMsg.style = "grid-column: 1 / -1; text-align: center; color: #ffb74d;";
    emptyMsg.textContent = "جاري التحميل أو لا توجد عناصر...";
    grid.appendChild(emptyMsg);
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = item.name;
    card.onclick = () => playVideo(item.streamUrl);
    grid.appendChild(card);
  });
}

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
  try {
    const data = await fetchM3U();
    render(data);
  } catch (e) {
    alert("حدث خطأ أثناء جلب الملف: " + e.message);
  }
}

boot();
