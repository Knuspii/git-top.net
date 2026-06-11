// ========== Config ==========
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

  // Phase 2 Start
  document.documentElement.style.backgroundColor = "black";
  bootScreen.style.opacity = "0";
  bootScreen.style.transition = "opacity 0.3s ease";


  setTimeout(() => {
    bootScreen.remove()
    mainContents.style.display = "flex";
  }, 300);
}

// ========== On Load ==========
window.onload = () => {
  runBootSequence();
};
