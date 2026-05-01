let level = 4;
let maxAttempts = 6;
let attempt = 0;
let currentCol = 1;
let word = "";
let score = 0;
let words = {};
let timer;
let gameActive = false;
let timeLeft = 30; 
let playerName = "Dedektif"; 
let playerAvatar = "🕵️‍♂️";
let bestScore = localStorage.getItem('kelimeDedektifi_bestScore') || 0;

const tensionSound = new Audio('gerilim.mp3');
tensionSound.loop = true;

// --- SES DOSYALARI VE SES SEVİYESİ AYARLARI ---
const successSound = new Audio('sounds/dogru.mp3'); 
const errorSound = new Audio('sounds/hata.mp3');

// Ses seviyesini ayarla (1.0 maksimumdur)
errorSound.volume = 1.0; 
errorSound.preload = 'auto';
errorSound.load();

// Sesi önceden yükle (Gecikmeyi önlemek için)
errorSound.preload = 'auto';
errorSound.load(); 

const grid = document.getElementById("grid");
const guessBtn = document.getElementById("guessBtn");
const hintBtn = document.getElementById("hintBtn");
const startBtn = document.getElementById("startBtn");
const howBtn = document.getElementById("howBtn");
const howPopup = document.getElementById("howPopup");

// Ses çalma fonksiyonu (Gecikmeyi önleyen özel fonksiyon)
function playError() {
   errorSound.pause(); 
    errorSound.currentTime = 0; 
    
    // Bazı tarayıcılarda sesin daha net duyulması için çalmadan hemen önce tekrar hacim kontrolü
    errorSound.volume = 1.0; 
    
    errorSound.play().catch(e => console.log("Ses çalma hatası:", e));
}

fetch("words.json")
  .then(res => res.json())
  .then(data => {
    const allWords = Object.values(data).flat();
    allWords.forEach(k => {
      const len = k.length;
      if (len >= 4 && len <= 8) {
        if (!words[len]) words[len] = [];
        words[len].push(k.toLocaleUpperCase("tr-TR"));
      }
    });
  });

function selectAvatar(emoji, element) {
  playerAvatar = emoji;
  document.querySelectorAll('.avatar').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
}

function typeEffect() {
  const label = document.getElementById('inputLabel');
  if(!label) return;
  const text = "İsmini buraya yaz dedektif...";
  label.innerText = "";
  let i = 0;
  const timerType = setInterval(() => {
    if (i < text.length) {
      label.innerText += text.charAt(i);
      i++;
    } else {
      clearInterval(timerType);
    }
  }, 40);
}

startBtn.addEventListener("click", () => {
  const nameInput = document.getElementById("username").value;
  if (nameInput.trim() !== "") playerName = nameInput;

  document.getElementById("message").innerHTML = `İyi şanslar ${playerAvatar} <b>${playerName}</b>!`;
  document.querySelector(".menu").style.display = "none";
  document.querySelector(".buttons").style.display = "flex";
  startLevel();
});

function startLevel() {
  gameActive = true;
  attempt = 0;
  currentCol = 1;
  grid.innerHTML = "";
  document.getElementById("level").innerText = level;

  const list = words[level];
  if (!list || list.length === 0) {
    setTimeout(startLevel, 500);
    return;
  }

  word = list[Math.floor(Math.random() * list.length)];

  for (let i = 0; i < maxAttempts; i++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let j = 0; j < level; j++) {
      const box = document.createElement("div");
      box.className = "box";
      row.appendChild(box);
    }
    grid.appendChild(row);
  }
  setFirstLetter();
  startTimer();
}

function setFirstLetter() {
  const row = grid.children[attempt];
  if(row) {
    row.children[0].textContent = word[0];
    currentCol = 1;
  }
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  const timerDisplay = document.getElementById("timer");
  timerDisplay.innerText = timeLeft;
  timerDisplay.style.color = "";

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = timeLeft;
    if (timeLeft <= 10 && timeLeft > 0) timerDisplay.style.color = "#ff4d4d";
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame(false, "⏰ Süre doldu!");
    }
  }, 1000);
}

function handleKey(e) {
  if (!gameActive) return;
  const row = grid.children[attempt];
  if (!row) return;
  const boxes = row.children;

  if (e.key === "Backspace" && currentCol > 1) {
    currentCol--;
    boxes[currentCol].textContent = "";
  } else if (e.key === "Enter") {
    checkWord();
  } else if (/^[a-zA-ZçğıöşüÇĞİÖŞÜ]$/.test(e.key) && currentCol < level) {
    const activeBox = boxes[currentCol];
    activeBox.textContent = e.key.toLocaleUpperCase("tr-TR");
    activeBox.style.boxShadow = "0 0 15px #00c6ff"; 
    setTimeout(() => activeBox.style.boxShadow = "", 150);
    currentCol++;
  }
}

function checkWord() {
  if (!gameActive) return;
  const row = grid.children[attempt];
  const boxes = row.children;
  let guess = "";
  for (let i = 0; i < level; i++) guess += boxes[i].textContent;

  if (guess.length !== level) {
    playError(); // Anında çal
    row.classList.add("shake");
    document.getElementById("message").innerText = "Eksik harf!";
    setTimeout(() => row.classList.remove("shake"), 400);
    return;
  }

  if (!words[level].includes(guess)) {
    showError(row, boxes);
    return;
  }

  let wordArr = word.split("");
  let guessArr = guess.split("");
  let result = new Array(level).fill("wrong");

  for (let i = 0; i < level; i++) {
    if (guessArr[i] === wordArr[i]) {
      result[i] = "correct";
      wordArr[i] = null;
    }
  }
  for (let i = 0; i < level; i++) {
    if (result[i] === "correct") continue;
    let index = wordArr.indexOf(guessArr[i]);
    if (index !== -1) {
      result[i] = "present";
      wordArr[index] = null;
    }
  }

  result.forEach((r, i) => {
    setTimeout(() => boxes[i].classList.add("flip", r), i * 200);
  });

 if (guess === word) {
    gameActive = false;
    clearInterval(timer);
    successSound.play();

    // --- YENİ ÇAFÇAFLI KONFETİ EFEKTİ ---
    const count = 200;
    const defaults = {
        origin: { y: 0.7 },
        zIndex: 10000
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
            // Dedektif/Neon Renk Paleti: Altın, Turkuaz, Gece Mavisi, Beyaz
            colors: ['#00c6ff', '#f1c40f', '#ffffff', '#0072ff']
        });
    }

    // 5 Farklı açıyla patlatma yapıyoruz
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    // Yanlardan fışkırma efekti (Ekstra görsel şölen)
    setTimeout(() => {
        confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#00c6ff', '#f1c40f']
        });
        confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#00c6ff', '#f1c40f']
        });
    }, 200);
    // --- KONFETİ EFEKTİ BİTİŞ ---

    // Mevcut dans animasyonun devam ediyor
    for (let i = 0; i < level; i++) {
        setTimeout(() => boxes[i].classList.add('dance'), i * 100);
    }

    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    
    score += (level * 100) + (timeLeft * 5);
    document.getElementById("score").innerText = score;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('kelimeDedektifi_bestScore', bestScore);
        document.getElementById("bestScore").innerText = bestScore;
    }

    level++; 
    if (level <= 8) {
      setTimeout(startLevel, 2500);
    } else {
      setTimeout(() => endGame(true, "🏆 Tüm seviyeleri tamamladın!"), 2000);
    }
    return;
  }

  attempt++;
  currentCol = 1;
  if (attempt >= maxAttempts) {
    endGame(false, "Doğru kelime: " + word);
  } else {
    setTimeout(setFirstLetter, level * 200 + 200);
  }
}

// Harf Al butonu fonksiyonu
function getHint() {
    if (!gameActive) return;

    // Puan kontrolü (20 puanın altındaysa)
    if (score < 20) {
        playError(); // Daha önce hazırladığımız hızlı hata sesini çal
        document.getElementById("puanHataPopup").classList.remove("hidden"); // Pop-up'ı göster
        return;
    }

    const row = grid.children[attempt];
    const boxes = row.children;
    
    if (currentCol < level) {
        const hintBox = boxes[currentCol];
        hintBox.textContent = word[currentCol];
        hintBox.classList.add('hint-flash');
        setTimeout(() => hintBox.classList.remove('hint-flash'), 800);

        // Puan düşürme ve görsel efekt
        score -= 20;
        document.getElementById("score").innerText = score;
        
        // Puan eksilme animasyonu (sayı uçurma)
        const scoreElem = document.getElementById("score");
        const rect = scoreElem.getBoundingClientRect();
        const floatingText = document.createElement("div");
        floatingText.className = "score-minus";
        floatingText.innerText = "-20";
        floatingText.style.left = (rect.left + 20) + "px";
        floatingText.style.top = rect.top + "px";
        document.body.appendChild(floatingText);
        setTimeout(() => floatingText.remove(), 1000);

        currentCol++; 
    }
}

// Pop-up kapatma fonksiyonu
function closePuanPopup() {
    document.getElementById("puanHataPopup").classList.add("hidden");
}

function endGame(win, msg) {
    gameActive = false;
    clearInterval(timer);
    tensionSound.pause();

    const popup = document.getElementById("gameOver");
    const title = document.getElementById("gameOverTitle");
    const text = document.getElementById("gameOverText");

    title.innerText = win ? `🏆 TEBRİKLER ${playerAvatar}` : `💀 DOSYA KAPANDI ${playerAvatar}`;
    
    if (!win) {
        text.innerHTML = `${playerName}, ${msg}<br><br>Aranan Kelime: <span class="reveal-word">${word}</span><br>Skor: ${score}`;
    } else {
        text.innerHTML = `${playerName}, ${msg}<br>Skor: ${score}`;
    }

    popup.classList.remove("hidden");
}

function showError(row, boxes) {
    playError(); // Anında çal

    let toast = document.querySelector('.toast-error');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-error';
        document.body.appendChild(toast);
    }
    
    let overlay = document.querySelector('.screen-shake-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'screen-shake-overlay';
        document.body.appendChild(overlay);
    }

    toast.innerText = "❌ KAYIT DIŞI KELİME!";
    toast.classList.add('show');
    overlay.classList.add('active');
    row.classList.add("shake");
    document.getElementById("message").innerText = "";

    setTimeout(() => {
        toast.classList.remove('show');
        overlay.classList.remove('active');
        row.classList.remove("shake");
        
        for (let i = 1; i < boxes.length; i++) boxes[i].textContent = "";
        setFirstLetter();
    }, 1200);
}

howBtn.addEventListener("click", () => howPopup.classList.remove("hidden"));
function closeHow() { howPopup.classList.add("hidden"); }

document.getElementById("bestScore").innerText = bestScore;
document.addEventListener("keydown", handleKey);
guessBtn.addEventListener("click", checkWord);
hintBtn.addEventListener("click", getHint);
window.onload = typeEffect;
