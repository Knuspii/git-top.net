// ========== Config ==========
const maintenanceMode = true; // ?admin=true
const TERM_VERSION = "[ 0.3 ]";
const USERNAME = "user";
const HOSTNAME = `terminal-${Math.floor(Math.random() * 120) + 1}`;
const PROMPT = `${USERNAME}@${HOSTNAME}:$`;
const RANDOMIP = Math.floor(Math.random() * 254);
const RANDOMIP2 = Math.floor(Math.random() * 254);
const LOGNAME = "[Git-Top]";

// ========== BOOT SEQUENCE LOGIC ==========
async function runBootSequence() {
  const bootTerminal = document.getElementById("boot-terminal");
  const bootScreen = document.getElementById("boot-screen");
  const mainContents = document.querySelector(".contents");

  if (!bootTerminal) return;

  // --- VORTEX START ---
  const vortexLayer = document.createElement("pre");
  vortexLayer.id = "vortex-layer";
  bootTerminal.appendChild(vortexLayer);

  let frame = 0;
  let vortexActive = true;
  
  function renderVortex() {
    // Exit if the vortex is no longer supposed to be active
    if (!vortexActive) return;
    
    const elapsed = (Date.now() - startTime) / 1000;
    
    // Define grid dimensions (Wide and short to compensate for tall monospace fonts)
    let vWidth = 80, vHeight = 25; 
    let grid = Array(vHeight).fill().map(() => Array(vWidth).fill(' '));
    
    // Number of particles in the spiral
    const points = 30; 
    
    for (let i = 0; i < points; i++) {
      // Spiral Math: 
      // angle: i * spread + (frame * rotationSpeed)
      // r: distance from center increases with i
      let angle = i * 0.5 + (frame * 0.15); 
      let r = i * 0.28; 
      
      // COMPENSATING ASPECT RATIO:
      // We multiply the X coordinate by 3.5 to make the spiral look flat/circular.
      let x = Math.floor(vWidth/2 + r * Math.cos(angle) * 3.5);
      let y = Math.floor(vHeight/2 + r * Math.sin(angle));
      
      // Check if the calculated point is within the grid boundaries
      if (x >= 0 && x < vWidth && y >= 0 && y < vHeight) {
        const glyphs = "01";
        grid[y][x] = glyphs[i % glyphs.length];
      }
    }

    // Join the grid into a single string and update the display
    vortexLayer.textContent = grid.map(row => row.join('')).join('\n');
    
    frame++;
    requestAnimationFrame(renderVortex);
  }
  
  const startTime = Date.now();
  renderVortex();

  setTimeout(() => {
    vortexActive = false;
    vortexLayer.style.transition = "opacity 0.5s";
    vortexLayer.style.opacity = "0";
    setTimeout(() => vortexLayer.remove(), 500);
  }, 3000);

  if (!bootTerminal) return;

  const bootWrite = (text, delay = 100) => {
    return new Promise(resolve => {
      const line = document.createElement("div");
      line.textContent = text;
      bootTerminal.appendChild(line);
      // Auto-Scroll
      bootTerminal.scrollTop = bootTerminal.scrollHeight;
      setTimeout(resolve, delay);
    });
  };

  // Phase 1 Boot
    await bootWrite(`░█▀▀░▀█▀░▀█▀░░░░░▀█▀░█▀█░█▀█░
░█░█░░█░░░█░░▄▄▄░░█░░█░█░█▀▀░
░▀▀▀░▀▀▀░░▀░░░░░░░▀░░▀▀▀░▀░░░`);
  await bootWrite(" ");
  await bootWrite(`Independent project and is not affiliated with, endorsed by, or sponsored by GitHub.`);
  await bootWrite("BIOS Revision 4.0.2.26", 400);
  await bootWrite(`CPU: KNU-GEN 12 @ 4.2GHz`, 200);
  await bootWrite("Memory Test: 524288MB OK", 600);
  await bootWrite("Initializing Network Stack...", 800);
  await bootWrite(`[✓] Node connected: 10.0.${RANDOMIP}.${RANDOMIP2}:1337`, 300);

  await bootWrite("Boot Sequence Complete. Loading GUI...", 1000);

  // Phase 3 Start
  document.documentElement.style.backgroundColor = "black";
  bootScreen.style.opacity = "0";
  bootScreen.style.transition = "opacity 0.3s ease";


  setTimeout(() => {
    bootScreen.remove()
    mainContents.style.display = "flex";
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
  }, 300);
}

// Terminal global
const terminal = document.getElementById("terminal");

// Admin check
function isAdmin() {
  return new URLSearchParams(window.location.search).get("admin") === "true";
}

// ========== On Load ==========
window.onload = () => {
  runBootSequence();
};

// === CLOCK & DATE ===
function updateDateTime() {
  const now = new Date();

  // Formate time
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  // Format date ("10 OCT 2025")
  const day = now.getDate().toString().padStart(2, "0");
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();

  // Refresh elements
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");

  if (clockEl) clockEl.textContent = `${hours}:${minutes}:${seconds}`;
  if (dateEl) dateEl.textContent = `${day} ${month} ${year}`;
}

// ========== TYPE-TEXT ==========
const textElement = document.querySelector('.type-text');
const texts = [
  "Loading . . . . .",
  "C2 node connection stable.",
  "Welcome.",
  "This is a community website.",
  "Why are u here?",
  "Are u lost?",
  "Wake up.",
  "Take care.",
  "There are no accidents.",
  "You are not alone here.",
  "Look behind the screen.",
  "Reality is just a buffer.",
  "Nothing stays hidden forever.",
  "The rabbit hole goes deeper.",
  "Question everything.",
];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingDelay = 70;
const deletingDelay = 35;
const pauseAfterTyping = 900;
const pauseAfterDeleting = 400;

function type() {
  const current = texts[textIndex];
  let displayText;

  if (isDeleting) {
    displayText = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    displayText = current.substring(0, charIndex + 1);
    charIndex++;
  }

  textElement.innerHTML = displayText || "&nbsp;";
  let delay = isDeleting ? deletingDelay : typingDelay;

  if (!isDeleting && charIndex === current.length) {
    isDeleting = true;
    delay = pauseAfterTyping;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % texts.length;
    delay = pauseAfterDeleting;
  }

  setTimeout(type, delay);
}