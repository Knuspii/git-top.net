const CACHE_DURATION = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

// Color mapping for different programming languages
const languageColors = {
    'javascript': '#ffdf00',
    'typescript': '#00c8ff',
    'python': '#39ff14',
    'go': '#00f0ff',
    'rust': '#ff7700',
    'html': '#ff007f',
    'css': '#9d4edd',
    'c++': '#f34b7d',
    'c': '#555555',
    'java': '#b07219',
    'shell': '#89e051'
};

// --------------------------------------------------------------------------
// LIVE DATE & CLOCK SYSTEM
// --------------------------------------------------------------------------
function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('date');
    const clockEl = document.getElementById('clock');
    
    // Format date as YYYY-MM-DD
    if (dateEl) dateEl.textContent = now.toISOString().split('T')[0];
    
    // Format time as HH:MM:SS
    if (clockEl) clockEl.textContent = now.toTimeString().split(' ')[0];
}
setInterval(updateDateTime, 1000);
updateDateTime();

// --------------------------------------------------------------------------
// CALCULATE ISO START DATE FOR GITHUB SEARCH API
// --------------------------------------------------------------------------
function getStartDateIso(timeframe) {
    const now = new Date();
    if (timeframe === 'day') now.setDate(now.getDate() - 1);
    else if (timeframe === 'week') now.setDate(now.getDate() - 7);
    else if (timeframe === 'month') now.setMonth(now.getMonth() - 1);
    else if (timeframe === 'three_months') now.setMonth(now.getMonth() - 3);
    return now.toISOString().split('T')[0];
}

// --------------------------------------------------------------------------
// CORE FETCH & CACHE ENGINE
// --------------------------------------------------------------------------
async function loadGridData(timeframe, containerSelector) {
    const gridContainer = document.querySelector(`${containerSelector} .repo-grid`);
    if (!gridContainer) return null;

    const cacheKey = `git_top_${timeframe}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(`${cacheKey}_time`);
    const now = Date.now();

    // 1. Check if valid browser-side cache data exists
    if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        renderRepoCards(JSON.parse(cachedData), gridContainer);
        // Returns the remaining cache lifetime for this specific timeframe query
        return CACHE_DURATION - (now - cachedTime);
    }

    // 2. Cache expired or empty: Fetch fresh data from GitHub Search API
    const startDate = getStartDateIso(timeframe);
    // Requesting top repositories to fit the UI template high-density design
    const url = `https://api.github.com/search/repositories?q=created:>${startDate}&sort=stars&order=desc&per_page=5`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API_LIMIT_OR_FAILURE');
        
        const data = await response.json();
        const repos = data.items || [];

        // Save fresh payload and current timestamp to LocalStorage
        localStorage.setItem(cacheKey, JSON.stringify(repos));
        localStorage.setItem(`${cacheKey}_time`, now.toString());

        renderRepoCards(repos, gridContainer);
        return CACHE_DURATION; // Returns full lifetime since it was freshly synced
    } catch (error) {
        console.error(`[Git-Top API Error] Fetch failed for timeframe "${timeframe}":`, error);
        
        // Smart fallback: If API is rate-limited, try using the expired cache as offline backup
        if (cachedData) {
            renderRepoCards(JSON.parse(cachedData), gridContainer);
            return 0; // Cache is depleted but available as a structural backup
        } else {
            gridContainer.innerHTML = `<div class="error-msg">⚠️ API Rate Limit / Connection Error</div>`;
            return null;
        }
    }
}

// --------------------------------------------------------------------------
// RENDER DYNAMIC REPOSITORY CARDS
// --------------------------------------------------------------------------
function renderRepoCards(repos, gridContainer) {
    if (repos.length === 0) {
        gridContainer.innerHTML = `<div class="empty-msg">No data found</div>`;
        return;
    }

    const top = repos.slice(0, 5);

    gridContainer.innerHTML = top.map((repo, index) => {
        const lang = repo.language || 'Plain Text';
        const langKey = lang.toLowerCase().trim();
        const color = languageColors[langKey] || 'var(--text-main)';
        
        const stars = repo.stargazers_count ? repo.stargazers_count.toLocaleString() : 0;
        const forks = repo.forks_count ? repo.forks_count.toLocaleString() : 0;
        
        const description = repo.description ? (repo.description.length > 80 ? repo.description.substring(0, 77) + '...' : repo.description) : 'No description provided.';

        return `
            <div class="repo-card">
                <div class="repo-rank"><i class="fa-solid fa-hashtag"></i> ${index + 1}</div>
                <div class="repo-info">
                    <a class="repo-name" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
                    <p class="repo-desc" title="${repo.description || ''}">${description}</p>
                </div>
                <div class="repo-stats">
                    <span class="stat-item stars"><i class="fa-solid fa-star"></i> STARS: ${stars}</span>
                    <span class="stat-item forks"><i class="fa-solid fa-code-branch"></i> FORKS: ${forks}</span>
                    <span class="stat-lang" style="--lang-color: ${color}">${lang}</span>
                </div>
            </div>
        `;
    }).join('');
}

// --------------------------------------------------------------------------
// UPDATE STATUS BAR WITH CACHE LIVE TIMER
// --------------------------------------------------------------------------
function updateCacheStatusDisplay(remainingTimes) {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;

    // Filter out null values to work with valid tracker numbers only
    const validTimes = remainingTimes.filter(t => t !== null);
    
    // Case 1: Absolute error (API down & no local cache available)
    if (validTimes.length === 0) {
        statusBar.innerHTML = `Cache System: Error - GitHub API limit reached!`;
        return;
    }

    // Identify the shortest remaining time to trigger the next global sync cycle accurately
    const shortestRemaining = Math.min(...validTimes);
    
    // Case 2: API blocks, but old cache is displayed as a fallback
    if (shortestRemaining === 0) {
        statusBar.innerHTML = `Cache System: API limit reached! (Using offline cache)`;
    // Case 3: The regular countdown (standard operational mode)
    } else {
        const remainingMins = Math.round(shortestRemaining / 60 / 1000);
        const hrs = Math.floor(remainingMins / 60);
        const mins = remainingMins % 60;
        statusBar.innerHTML = `Cache System: Next refresh in ${hrs}h ${mins}m`;
    }
}

// --------------------------------------------------------------------------
// CORE DASHBOARD INITIALIZATION
// --------------------------------------------------------------------------
async function initDashboard() {
    // Fire all API requests/cache checks in parallel for maximum speed performance
    const remainingTimes = await Promise.all([
        loadGridData('day', '.container-daily'),
        loadGridData('week', '.container-weekly'),
        loadGridData('month', '.container-monthly'),
        loadGridData('three_months', '.container-three-months')
    ]);

    // Inject cache status and countdown timer into the layout header bar
    updateCacheStatusDisplay(remainingTimes);

    // Reveal main interface after engines successfully completed processing tasks
    const contents = document.querySelector('.contents');
    if (contents) contents.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', initDashboard);