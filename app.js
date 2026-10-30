// الرابط الخاص بك
const M3U_URL = "http://shoftv.net:80/get.php?username=28365536&password=5839836&type=m3u_plus&output=m3u8";

async function fetchM3U() {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(M3U_URL)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("فشل الاتصال بالوسيط");
  const text = await response.text();
  return parseM3U(text);
}

// دالة الفلترة: تبحث فقط عن القنوات الرياضية
function parseM3U(text) {
  const lines = text.split('\n');
  let sports = [];
  let currentInfo = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1] : "قناة رياضية";
      const lowerLine = line.toLowerCase();
      
      // فلترة القنوات الرياضية (سبورت، بي إن سبورت، كأس، دوري)
      if (
        lowerLine.includes('sport') || 
        lowerLine.includes('bein') || 
        line.includes('رياضة') || 
        line.includes('بي ان') ||
        line.includes('كأس') ||
        line.includes('دوري')
      ) {
        currentInfo = { name };
      } else {
        currentInfo = null; // تجاهل باقي القنوات
      }
    } else if (line.startsWith('http')) {
      if (currentInfo) {
        sports.push({ name: currentInfo.name, streamUrl: line });
        currentInfo = null;
      }
    }
  }
  
  return { sports: sports };
}

// عرض الواجهة الرئيسية (خانة واحدة فقط)
function render(data) {
  document.getElementById("announcement").textContent = "مرحبًا بكم في Horizon Sports";
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h3 style="text-align:center; font-size: 24px;">⚽ البث الرياضي المباشر</h3>`;
  card.addEventListener("click", () => {
    openSection(data);
  });
  grid.appendChild(card);
}

function openSection(data) {
  const items = data.sports || [];
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
    emptyMsg.textContent = "لم يتم العثور على قنوات رياضية في القائمة.";
    grid.appendChild(emptyMsg);
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = item.name;
    // إضافة لون مميز لقنوات beIN
    if(item.name.toLowerCase().includes('bein')) {
        card.style.border = "1px solid #8a2be2"; 
    }
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
  const grid = document.getElementById("grid");
  grid.innerHTML = "<div style='color:white; font-size:20px; grid-column: 1/-1; text-align:center;'>جاري البحث عن القنوات الرياضية...<br>قد يستغرق هذا بضع ثوانٍ</div>";
  
  try {
    const data = await fetchM3U();
    
    if(data.sports.length === 0) {
       throw new Error("تم التحميل لكن لم نجد قنوات رياضية. قد يكون الوسيط فشل في جلب الملف.");
    }
    
    render(data);
  } catch (e) {
    grid.innerHTML = `<div style='color:red; font-size:18px; grid-column: 1/-1; text-align:center;'>
      فشل التحميل: <br>${e.message}<br><br>
      <button onclick="location.reload()" style="padding:10px; margin-top:10px; border-radius:10px; color:black;">إعادة المحاولة</button>
    </div>`;
  }
}

boot();
