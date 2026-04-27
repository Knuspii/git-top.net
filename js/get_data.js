// -------------------------
// Helper Functions
// -------------------------
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  return res.json();
}

function createLinkedName(name, url) {
  return url && url !== "#" 
    ? `<a href="${url}" target="_blank" class="repo-link"><strong>${name}</strong></a>` 
    : `<strong>${name}</strong>`;
}

function createTableRow(cells) {
  const row = document.createElement("tr");
  cells.forEach(content => {
    const td = document.createElement("td");
    td.innerHTML = content;
    row.appendChild(td);
  });
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
      <div class="status-item">Git-Terminal-Services: ${getBadge(status.git_service)}</div>
      <div class="status-item" style="opacity: 0.5">Last Sync: ${status.last_check} [UTC+1/UTC+2]</div>
    `;
  } catch (err) {
    console.warn("Status could not be loaded", err);
  }
  console.log("Loading status done!")
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
      const row = createTableRow([
        createLinkedName(item.name, item.url),
        item.version,
        item.description
      ]);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading software:", err);
  }
  console.log("Loading software done!")
}

// -------------------------
// Top Repos (Monthly)
// -------------------------
async function loadRepos() {
  try {
    const repos = await fetchJSON("../data/monthly_repos.json");
    const tbody = document.querySelector(".repos-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    repos.forEach(repo => {
      const row = createTableRow([
        createLinkedName(repo.name, repo.url),
        `${repo.stars} ⭐`,
        repo.language
      ]);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading monthly repos:", err);
  }
  console.log("Loading monthly repos done!")
}

// -------------------------
// Daily Repos (24h)
// -------------------------
async function loadDailyRepos() {
  try {
    const repos = await fetchJSON("../data/daily_repos.json");
    const tbody = document.querySelector(".daily-repos-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (repos.length === 0) {
      tbody.innerHTML = "<tr><td colspan='3'>No new trending repos in the last 24h.</td></tr>";
      return;
    }

    repos.forEach(repo => {
      const row = createTableRow([
        createLinkedName(repo.name, repo.url),
        `${repo.stars} ⭐`,
        repo.language
      ]);
      tbody.appendChild(row);
    });
  } catch (err) {
    console.warn("Daily repos not found or empty:", err);
  }
  console.log("Loading daily repos done!")
}

// -------------------------
// Init
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  loadSoftware();
  loadRepos();
  loadDailyRepos();
});
