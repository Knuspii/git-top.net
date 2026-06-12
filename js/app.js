const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

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

// Dictionary translating keys to dynamic section header titles with Font Awesome Icons
const titleMap = {
    'day': '<i class="fa-solid fa-calendar-day"></i> Top Repositories of the Day!',
    'week': '<i class="fa-solid fa-calendar-week"></i> Top Repositories of the Week!',
    'month': '<i class="fa-solid fa-calendar-days"></i> Top Repositories of the Month!',
    'three_months': '<i class="fa-solid fa-timeline"></i> Top Repositories of the last 3 Months!'
};

// Global system operational memory cache tracker
let currentTimings = { day: null, week: null, month: null, three_months: null };

// --------------------------------------------------------------------------
// LIVE DATE & CLOCK SYSTEM
// --------------------------------------------------------------------------
function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('date');
    const clockEl = document.getElementById('clock');
    
    if (dateEl) dateEl.textContent = now.toISOString().split('T')[0];
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
// CORE FETCH & CACHE ENGINE (MODIFIED TO RENDER INTO SELECTED TARGETS)
// --------------------------------------------------------------------------
async function loadGridData(timeframe, containerSelector, shouldRender = true) {
    // Select container conditionally based on operational intent
    const gridContainer = document.querySelector(`${containerSelector} .repo-grid`);
    if (!gridContainer && shouldRender) return null;

    const cacheKey = `git_top_${timeframe}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(`${cacheKey}_time`);
    const now = Date.now();

    // 1. Check if valid browser-side cache data exists
    if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
        if (shouldRender) renderRepoCards(JSON.parse(cachedData), gridContainer);
        return CACHE_DURATION - (now - cachedTime);
    }

    // 2. Cache expired or empty: Fetch fresh data from GitHub Search API
    const startDate = getStartDateIso(timeframe);
    const url = `https://api.github.com/search/repositories?q=created:>${startDate}&sort=stars&order=desc&per_page=10`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API_LIMIT_OR_FAILURE');
        
        const data = await response.json();
        const repos = data.items || [];

        localStorage.setItem(cacheKey, JSON.stringify(repos));
        localStorage.setItem(`${cacheKey}_time`, now.toString());

        if (shouldRender) renderRepoCards(repos, gridContainer);
        return CACHE_DURATION; 
    } catch (error) {
        console.error(`[Git-Top API Error] Fetch failed for timeframe "${timeframe}":`, error);
        
        if (cachedData) {
            if (shouldRender) renderRepoCards(JSON.parse(cachedData), gridContainer);
            return 0; 
        } else {
            if (shouldRender) gridContainer.innerHTML = `<div class="error-msg">⚠️ API Rate Limit / Connection Error</div>`;
            return null;
        }
    }
}

// --------------------------------------------------------------------------
// RENDER DYNAMIC REPOSITORY CARDS
// --------------------------------------------------------------------------
function renderRepoCards(repos, gridContainer) {
    if (!gridContainer) return;
    if (repos.length === 0) {
        gridContainer.innerHTML = `<div class="empty-msg">No data found</div>`;
        return;
    }

    const top = repos.slice(0, 10);

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

    const validTimes = remainingTimes.filter(t => t !== null);
    
    if (validTimes.length === 0) {
        statusBar.innerHTML = `Cache System: Error - GitHub API limit reached!`;
        return;
    }

    const shortestRemaining = Math.min(...validTimes);
    
    if (shortestRemaining === 0) {
        statusBar.innerHTML = `Cache System: API limit reached! (Using offline cache)`;
    } else {
        const remainingMins = Math.round(shortestRemaining / 60 / 1000);
        const hrs = Math.floor(remainingMins / 60);
        const mins = remainingMins % 60;
        statusBar.innerHTML = `Cache System: Next refresh in ${hrs}h ${mins}m`;
    }
}

// --------------------------------------------------------------------------
// TAB INTERACTION CONTROL SYSTEM ROUTINES
// --------------------------------------------------------------------------
async function switchTab(timeframe) {
    const titleEl = document.getElementById('dynamic-title');
    if (titleEl) titleEl.innerHTML = titleMap[timeframe]; 

    // Load fresh or cached components explicitly inside the interactive layer container
    const remainingTime = await loadGridData(timeframe, '.container-dynamic', true);
    currentTimings[timeframe] = remainingTime;

    // Instantly notify telemetry updates
    updateCacheStatusDisplay(Object.values(currentTimings));
}

function setupTabListeners() {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remove active frame markers from previous targets
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const timeframe = btn.getAttribute('data-timeframe');
            await switchTab(timeframe);
        });
    });
}

// --------------------------------------------------------------------------
// CORE DASHBOARD INITIALIZATION
// --------------------------------------------------------------------------
async function initDashboard() {
    // Register event interface loops before showing the visual viewport frames
    setupTabListeners();

    // Default processing stream visualization load path on execution initialization
    await switchTab('day');

    // Run underlying parallel execution logic to load or refresh other intervals quietly 
    // into localStorage without executing frame layouts until clicked
    Promise.all([
        loadGridData('week', '.container-dynamic', false).then(t => currentTimings.week = t),
        loadGridData('month', '.container-dynamic', false).then(t => currentTimings.month = t),
        loadGridData('three_months', '.container-dynamic', false).then(t => currentTimings.three_months = t)
    ]).then(() => {
        updateCacheStatusDisplay(Object.values(currentTimings));
    });

    // Reveal main interface after engines successfully completed processing tasks
    const contents = document.querySelector('.contents');
    if (contents) contents.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', initDashboard);