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
      // Monospace characters are usually ~3x taller than they are wide.
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

  // Phase 2 Maintenance Check
  if (maintenanceMode && !isAdmin()) {
    await bootWrite(" ");
    await bootWrite("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    await bootWrite("!! ERROR: ACCESS DENIED              !!");
    await bootWrite("!! SYSTEM UNDER MAINTENANCE          !!");
    await bootWrite("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    mainContents.remove()
    console.warn(`${LOGNAME} Maintenance Mode active. Halt.`);
    return;
  }

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
    type();
    initBootup();
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

// ========== TERMINAL ==========
function initBootup() {
  console.log(`${LOGNAME} Bootup started.`);
  if (!terminal) return;

  terminal.innerHTML = ""; // clear terminal

  const bootLines = [
    `Starting...`,
    `[✓] Connection to C2 node: 10.0.${RANDOMIP}.${RANDOMIP2}:1337 established`,
    `### server 6.1.0-34-amd64 #1 SMP`,
    `A dashboard for tracking trending GitHub repositories and software releases. Minimalist, automated, and open-source.`
  ];

  let index = 0;

  function showNextLine() {
    if (index < bootLines.length) {
      printBootupLine(bootLines[index++], showNextLine);
    } else {
      // Boot Lines → ASCII → Infos → Help → Prompt
      printBootupLine(handleCommand("ascii"), () => {
        const infoLines = [
          `Git-TopTerminal ${TERM_VERSION}`,
        ];

        infoLines.forEach((line, i) => {
          setTimeout(() => printBootupLine(line), i * 150);
        });

        setTimeout(() => {
          printBootupLine("Type 'help' for a list of commands");
          initTerminal();
        }, infoLines.length * 150);
      });
    }
  }

  showNextLine();
}

function printBootupLine(text, callback) {
  const line = document.createElement("div");
  line.textContent = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
  if (callback) setTimeout(callback, 200);
}

// ========== PROMPT & TERMINAL ==========
function initTerminal() {
  createPrompt();
}

function createPrompt() {
  const prompt = document.createElement("div");
  prompt.classList.add("prompt-line");
  prompt.innerHTML = `<span class="prompt">${PROMPT} </span><input type="text" class="terminal-input" placeholder="[ Type here... ]"/>`;
  terminal.appendChild(prompt);

  const input = prompt.querySelector("input");

  terminal.addEventListener('click', () => input.focus());

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const value = input.value.trim();
      printLine(`<span class="prompt">${PROMPT}</span> ${escapeHTML(value)}`, true);
      const output = handleCommand(value);
      if (output) printLine(output);
      prompt.remove();
      createPrompt();
    }
  });

  terminal.scrollTop = terminal.scrollHeight;
  input.focus();
  console.log(`${LOGNAME} Terminal ready.`);
}

// ========== Output ==========
function printLine(text, isHtml = false) {
  const div = document.createElement("div");

  if (isHtml) {
    div.innerHTML = text;

    // Wenn die Zeile eine Eingabezeile ist (enthält Prompt):
    if (text.includes(`${PROMPT}`)) {
      div.classList.add("terminal-command");
    }

  } else {
    div.textContent = text;
  }

  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

// ========== COMMAND HANDLING ==========
function handleCommand(raw) {
  const [cmd, ...args] = raw.trim().split(" ");
  switch(cmd.toLowerCase()) {
    case "help":
      return `Available commands:
- help
- info/about
- privacy
- files
- read [file.txt]
- cd [folder]
- whoami
- date
- clear
- reload`;
    case "info":
    case "about":
      return `Git-TopTerminal ${TERM_VERSION} \nMade by Knuspii`;
    case "ascii":
      return `                                                              
░█▀▀░▀█▀░▀█▀░░░░░▀█▀░█▀█░█▀█░
░█░█░░█░░░█░░▄▄▄░░█░░█░█░█▀▀░
░▀▀▀░▀▀▀░░▀░░░░░░░▀░░▀▀▀░▀░░░
_
\\ \\
 \\ \\
  > >
 / /  _______
/_/  |_______|
`;
    case "clear":
      terminal.innerHTML = "";
      return "";
    case "date":
      return new Date().toString();
    case "cd":
      return "Changing directories is not supported in this terminal.";
    case "privacy":
      window.open("https://data.knuspii.net/privacy.html", "_blank");
      return "Opened Privacy Policy in a new tab.";
    case "whoami":
      return USERNAME;
    case "reload":
      location.reload();
      return "Reloading...";
    case "files":
      return `Available files and folders:
.
..
Downloads/
Documents/
Projects/
Tools/
stuff/
test.txt
aboutme.txt`;
    case "read":
      if (args.length === 0) return "Usage: read [file]";
      if (args[0].toLowerCase() === "test.txt") {
        return `Hello World!`;
      }
      else if (args[0].toLowerCase() === "aboutme.txt") {
        return `I am Knuspii. I like coding and making fun projects.`;
      } else {
        return `File '${args[0]}' not found.`;
      }
    default:
      return `'${cmd}' is not recognized. Type 'help'`;
  }
}