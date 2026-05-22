// Developer-centric theme coloring system for popular tech stacks
const LANGUAGE_STYLE_MAP = {
  "JavaScript": "#f1e05a",
  "TypeScript": "#3178c6",
  "Python":     "#3572A5",
  "Go":         "#00ADD8",
  "Rust":       "#dea584",
  "C++":        "#f34b7d",
  "C":          "#555555",
  "HTML":       "#e34c26",
  "CSS":        "#563d7c",
  "Shell":      "#89e051",
  "Powershell": "#5183e0ff",
  "Java":       "#b07219",
  "PHP":        "#4f5d95",
  "Ruby":       "#701516",
  "Markdown":   "#083fa1"
};

// -------------------------
// Helper Functions
// -------------------------
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  return res.json();
}

function renderRepoRow(repo) {
  let owner = "";
  let name = repo.name;

  if (repo.name.includes("/")) {
    const parts = repo.name.split("/");
    owner = parts[0] + "/";
    name = parts.slice(1).join("/");
  }

  const row = document.createElement("tr");
  const td = document.createElement("td");
  
  const lang = repo.language || "Markdown";
  const license = repo.license || "No License";
  const issuesCount = (repo.issues !== undefined && repo.issues !== null) ? parseInt(repo.issues, 10) : 0;
  
  const langColor = LANGUAGE_STYLE_MAP[lang] || "var(--highlight)";

  td.innerHTML = `
    <div class="repo-row-content">
      <div class="repo-title">
        <a href="${repo.url}" target="_blank" class="repo-link">
          <i class="fa-solid fa-folder" style="color: var(--border-muted); margin-right: 6px;"></i>
          <span class="repo-owner" style="color: var(--highlight);">${owner}</span><span class="repo-name-highlight" style="color: var(--input-color); font-weight: bold;">${name}</span>
        </a>
      </div>
      <div class="repo-meta-row">
        <div class="meta-item">
          <i class="fa-solid fa-star" style="color: var(--input-color);"></i>
          <span>${repo.stars || 0}</span>
        </div>
        
        <div class="meta-item">
          <i class="fa-solid fa-circle lang-symbol" style="color: ${langColor}; margin-right: 2px;"></i>
          <span>${lang}</span>
        </div>

        <div class="meta-item" style="opacity: 0.75;">
          <i class="fa-solid fa-scale-balanced" style="color: var(--highlight);"></i>
          <span>${license}</span>
        </div>

        <div class="meta-item" style="opacity: 0.75;">
          <i class="fa-solid fa-circle-dot" style="color: var(--color-error);"></i>
          <span>${issuesCount} Issues,MRs</span>
        </div>
      </div>
    </div>
  `;
  row.appendChild(td);
  return row;
}

// -------------------------
// Status (Ping)
// -------------------------
async function loadStatus() {
  try {
    const status = await fetchJSON("../data/status.json");
    const container = document.querySelector(".status-bar");
    if (!container) return;

    const getBadge = (state) => {
      const color = state === "online" ? "greenyellow" : "red";
      return `<span style="color: ${color}">●</span> ${state.toUpperCase()}`;
    };

    container.innerHTML = `
      <div class="status-item">GitHub API: ${getBadge(status.github_api)}</div>
      <div class="status-item">Git-Top-Service: ${getBadge(status.git_service)}</div>
      <div class="status-item" style="opacity: 0.5">Last Sync: ${status.last_check} [UTC+1/UTC+2]</div>
    `;
  } catch (err) {
    console.warn("Status could not be loaded", err);
  }
}

// -------------------------
// Software
// -------------------------
async function loadSoftware() {
  try {
    const software = await fetchJSON("../data/software.json");
    const tbody = document.querySelector(".software-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    software.forEach(item => {
      const row = document.createElement("tr");
      const nameCell = item.url && item.url !== "#" 
        ? `<a href="${item.url}" target="_blank" class="repo-link"><strong>${item.name}</strong></a>` 
        : `<strong>${item.name}</strong>`;
        
      row.innerHTML = `<td>${nameCell}</td><td>${item.version}</td><td>${item.description}</td>`;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading software:", err);
  }
}

// -------------------------
// Generic Table Injector Core Logic
// -------------------------
async function fillRepoTable(selector, path, errorMsg) {
  try {
    const repos = await fetchJSON(path);
    const tbody = document.querySelector(selector);
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!repos || repos.length === 0) {
      tbody.innerHTML = `<tr><td style="text-align:center; color: var(--border-muted);">${errorMsg}</td></tr>`;
      return;
    }

    repos.forEach(repo => tbody.appendChild(renderRepoRow(repo)));
  } catch (err) {
    console.warn(`Data pipeline dropped for path: ${path}`, err);
  }
}

// -------------------------
// Pipeline Master Loop
// -------------------------
function loadAllRepoTables() {
  const targets = [
    { sel: ".daily-repos-table tbody", path: "../data/daily_repos.json", msg: "No new trending repos in the last 24h." },
    { sel: ".weekly-repos-table tbody", path: "../data/weekly_repos.json", msg: "No new trending repos in the last 7d." },
    { sel: ".monthly-repos-table tbody", path: "../data/monthly_repos.json", msg: "No entries found." },
    { sel: ".three-months-repos-table tbody", path: "../data/three_months_repos.json", msg: "No entries found." }
  ];
  
  targets.forEach(t => fillRepoTable(t.sel, t.path, t.msg));
}

// -------------------------
// Init
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadSoftware();
  loadAllRepoTables();
});