/**
 * GAMES CATALOG - App (Versione Ospite / GitHub)
 * Nessuna funzione admin. Solo navigazione, filtri, commenti, like.
 */

const AppState = {
    games: [],
    filteredGames: [],
    currentGameId: null,
    currentPage: 1,
    gamesPerPage: parseInt(localStorage.getItem('gamesPerPage')) || CONFIG.site.gamesPerPageDefault,
    sortMode: 'az',
    filters: {
        platform: new Set(),
        genre: new Set(),
        feature: new Set(),
        label: new Set(),
        search: ""
    }
};

const PLACEHOLDER = CONFIG.ui.placeholderCover;
const MAX_SUGGESTIONS = 8;

// ===================== INIT =====================
async function init() {
    const grid = document.getElementById('games-grid');
    try {
        const response = await fetch('db.json');
        if (!response.ok) throw new Error("Impossibile caricare db.json");
        AppState.games = await response.json();

        AppState.games.sort((a, b) => a.title.localeCompare(b.title));
        AppState.filteredGames = [...AppState.games];

        populateFilters();
        renderGrid();
        setupEventListeners();
        restoreSidebarState();

        document.getElementById('btn-mute').textContent = SFX.isMuted() ? '🔇' : '🔊';
        console.log(`Caricati ${AppState.games.length} giochi.`);
    } catch (error) {
        console.error(error);
        grid.innerHTML = `<div class="error">Errore nel caricamento dati: ${error.message}</div>`;
    }
}

// ===================== FILTRI =====================
function populateFilters() {
    const platforms = new Set(), genres = new Set(), features = new Set(), labels = new Set();
    AppState.games.forEach(game => {
        game.platforms.forEach(p => { if (p) platforms.add(p); });
        game.genres.forEach(g => { if (g) genres.add(g); });
        game.features.forEach(f => { if (f) features.add(f); });
        game.labels.forEach(l => { if (l) labels.add(l); });
    });
    renderCheckboxList('filter-platform', Array.from(platforms).sort(), 'platform');
    renderCheckboxList('filter-genre', Array.from(genres).sort(), 'genre');
    renderCheckboxList('filter-features', Array.from(features).sort(), 'feature');
    renderCheckboxList('filter-labels', Array.from(labels).sort(), 'label');
}

function renderCheckboxList(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => `
        <label class="checkbox-item">
            <input type="checkbox" value="${escapeHtml(item)}" data-type="${type}">
            ${escapeHtml(item)}
        </label>
    `).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===================== ORDINAMENTO =====================
function applySorting() {
    switch (AppState.sortMode) {
        case 'az': AppState.filteredGames.sort((a, b) => a.title.localeCompare(b.title)); break;
        case 'za': AppState.filteredGames.sort((a, b) => b.title.localeCompare(a.title)); break;
        case 'platform':
            AppState.filteredGames.sort((a, b) => {
                const pa = (a.platforms[0] || '').localeCompare(b.platforms[0] || '');
                return pa !== 0 ? pa : a.title.localeCompare(b.title);
            }); break;
        case 'genre':
            AppState.filteredGames.sort((a, b) => {
                const ga = (a.genres[0] || '').localeCompare(b.genres[0] || '');
                return ga !== 0 ? ga : a.title.localeCompare(b.title);
            }); break;
    }
}

// ===================== GRIGLIA =====================
function renderGrid() {
    const grid = document.getElementById('games-grid');
    const total = AppState.filteredGames.length;
    const perPage = AppState.gamesPerPage;
    let displayGames, totalPages;

    if (perPage === 0) {
        displayGames = AppState.filteredGames;
        totalPages = 1;
        AppState.currentPage = 1;
    } else {
        totalPages = Math.max(1, Math.ceil(total / perPage));
        if (AppState.currentPage > totalPages) AppState.currentPage = totalPages;
        const start = (AppState.currentPage - 1) * perPage;
        displayGames = AppState.filteredGames.slice(start, start + perPage);
    }

    const globalOffset = perPage === 0 ? 0 : (AppState.currentPage - 1) * perPage;

    grid.innerHTML = displayGames.map((game, i) => {
        const gi = globalOffset + i;
        return `
        <div class="game-card" data-index="${gi}" onclick="openModalByIndex(${gi})">
            <div class="card-image">
                <img src="${game.cover_url}" loading="lazy" alt="${escapeHtml(game.title)}" onerror="this.src='${PLACEHOLDER}'">
            </div>
            <div class="card-info">
                <div class="card-title" title="${escapeHtml(game.title)}">${escapeHtml(game.title)}</div>
                <div class="badges-mini">
                    ${game.platforms.slice(0, 3).map(p => `<span class="badge-mini">${escapeHtml(p)}</span>`).join('')}
                    ${game.platforms.length > 3 ? `<span class="badge-plus">+${game.platforms.length - 3}</span>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');

    document.getElementById('results-count').textContent = `${total} risultati`;
    renderPagination(totalPages);
}

// ===================== PAGINAZIONE =====================
function renderPagination(totalPages) {
    const bar = document.getElementById('pagination-bar');
    const selectPerPage = document.getElementById('select-perpage');
    selectPerPage.value = String(AppState.gamesPerPage);

    if (AppState.filteredGames.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    const page = AppState.currentPage;
    document.getElementById('page-indicator').textContent = totalPages <= 1 ? `${AppState.filteredGames.length} giochi` : `Pagina ${page} di ${totalPages}`;
    document.getElementById('btn-first-page').disabled = page <= 1;
    document.getElementById('btn-prev-page').disabled = page <= 1;
    document.getElementById('btn-next-page').disabled = page >= totalPages;
    document.getElementById('btn-last-page').disabled = page >= totalPages;
}

// ===================== LOGICA FILTRO =====================
function applyFilters() {
    const term = AppState.filters.search.toLowerCase();
    AppState.filteredGames = AppState.games.filter(game => {
        const s = game.title.toLowerCase().includes(term) || game.series.toLowerCase().includes(term);
        const p = AppState.filters.platform.size === 0 || game.platforms.some(x => AppState.filters.platform.has(x));
        const g = AppState.filters.genre.size === 0 || game.genres.some(x => AppState.filters.genre.has(x));
        const f = AppState.filters.feature.size === 0 || game.features.some(x => AppState.filters.feature.has(x));
        const l = AppState.filters.label.size === 0 || game.labels.some(x => AppState.filters.label.has(x));
        return s && p && g && f && l;
    });
    applySorting();
    AppState.currentPage = 1;
    renderGrid();
    renderActiveFilters();
}

// ===================== AUTOCOMPLETE =====================
function renderSearchSuggestions(term) {
    const container = document.getElementById('search-suggestions');
    if (!term || term.length < 2) { container.classList.remove('show'); container.innerHTML = ''; return; }

    const lower = term.toLowerCase();
    const matches = AppState.games
        .filter(g => g.title.toLowerCase().includes(lower) || g.series.toLowerCase().includes(lower))
        .slice(0, MAX_SUGGESTIONS);

    if (matches.length === 0) { container.classList.remove('show'); container.innerHTML = ''; return; }

    container.innerHTML = matches.map(g => {
        const idx = AppState.games.indexOf(g);
        return `<div class="suggestion-item" data-game-index="${idx}">
            <img class="suggestion-thumb" src="${g.cover_url}" alt="" onerror="this.src='${PLACEHOLDER}'">
            <div class="suggestion-info">
                <div class="suggestion-title">${escapeHtml(g.title)}</div>
                <div class="suggestion-meta">${g.platforms.slice(0, 2).join(', ')}</div>
            </div>
        </div>`;
    }).join('');
    container.classList.add('show');

    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const game = AppState.games[parseInt(item.dataset.gameIndex)];
            if (game) {
                const fi = AppState.filteredGames.indexOf(game);
                if (fi >= 0) { openModalByIndex(fi); }
                else { AppState.filteredGames = [...AppState.games]; applySorting(); renderGrid(); openModalByIndex(AppState.filteredGames.indexOf(game)); }
            }
            container.classList.remove('show');
        });
    });
}

// ===================== FILTRI ATTIVI (CHIPS) =====================
function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    const chips = [];
    const typeLabels = { platform: 'Piattaforma', genre: 'Genere', feature: 'Funzione', label: 'Etichetta' };
    ['platform', 'genre', 'feature', 'label'].forEach(type => {
        AppState.filters[type].forEach(val => {
            chips.push(`<span class="filter-chip"><span class="chip-type">${typeLabels[type]}</span> ${escapeHtml(val)} <span class="chip-remove" data-type="${type}" data-value="${escapeHtml(val)}">&times;</span></span>`);
        });
    });
    if (AppState.filters.search) {
        chips.push(`<span class="filter-chip"><span class="chip-type">Cerca</span> "${escapeHtml(AppState.filters.search)}" <span class="chip-remove" data-type="search">&times;</span></span>`);
    }
    container.innerHTML = chips.join('');
    container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'search') { AppState.filters.search = ''; document.getElementById('search-input').value = ''; }
            else { AppState.filters[type].delete(btn.dataset.value); document.querySelectorAll(`input[data-type="${type}"]`).forEach(cb => { if (cb.value === btn.dataset.value) cb.checked = false; }); }
            SFX.click();
            applyFilters();
        });
    });
}

// ===================== EVENTI =====================
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const sidebar = document.querySelector('.sidebar');
    const modal = document.getElementById('game-modal');

    // Search + autocomplete
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            renderSearchSuggestions(e.target.value);
            searchTimeout = setTimeout(() => { AppState.filters.search = e.target.value; applyFilters(); }, 300);
        });
        searchInput.addEventListener('blur', () => { setTimeout(() => { document.getElementById('search-suggestions')?.classList.remove('show'); }, 200); });
        searchInput.addEventListener('focus', () => { if (searchInput.value.length >= 2) renderSearchSuggestions(searchInput.value); });
    }

    // Checkboxes
    document.querySelectorAll('.checkbox-list').forEach(list => {
        list.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const val = e.target.value, type = e.target.dataset.type;
                e.target.checked ? AppState.filters[type].add(val) : AppState.filters[type].delete(val);
                applyFilters();
            }
        });
    });

    // Reset
    document.getElementById('reset-filters')?.addEventListener('click', () => {
        AppState.filters.platform.clear(); AppState.filters.genre.clear();
        AppState.filters.feature.clear(); AppState.filters.label.clear();
        AppState.filters.search = ""; AppState.currentPage = 1;
        if (searchInput) searchInput.value = "";
        document.querySelectorAll('.checkbox-list input[type="checkbox"]').forEach(cb => cb.checked = false);
        applyFilters();
    });

    // Paginazione
    document.getElementById('btn-first-page')?.addEventListener('click', () => { SFX.nav(); AppState.currentPage = 1; renderGrid(); scrollToTop(); });
    document.getElementById('btn-prev-page')?.addEventListener('click', () => { SFX.nav(); AppState.currentPage = Math.max(1, AppState.currentPage - 1); renderGrid(); scrollToTop(); });
    document.getElementById('btn-next-page')?.addEventListener('click', () => { SFX.nav(); AppState.currentPage++; renderGrid(); scrollToTop(); });
    document.getElementById('btn-last-page')?.addEventListener('click', () => {
        SFX.nav();
        const pp = AppState.gamesPerPage || AppState.filteredGames.length;
        AppState.currentPage = Math.max(1, Math.ceil(AppState.filteredGames.length / pp));
        renderGrid(); scrollToTop();
    });
    document.getElementById('select-perpage')?.addEventListener('change', (e) => {
        SFX.click(); AppState.gamesPerPage = parseInt(e.target.value); AppState.currentPage = 1;
        localStorage.setItem('gamesPerPage', AppState.gamesPerPage); renderGrid(); scrollToTop();
    });

    // Ordinamento
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
        SFX.click(); AppState.sortMode = e.target.value; applySorting(); AppState.currentPage = 1; renderGrid();
    });

    // Desktop Sidebar
    document.getElementById('desktop-sidebar-toggle')?.addEventListener('click', () => {
        SFX.click(); const collapsed = sidebar?.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar_collapsed', collapsed);
    });

    // Mute
    document.getElementById('btn-mute')?.addEventListener('click', () => {
        const muted = SFX.toggleMute();
        const btn = document.getElementById('btn-mute');
        if (btn) btn.textContent = muted ? '🔇' : '🔊';
    });

    // View Switcher
    document.getElementById('view-grid')?.addEventListener('click', () => setView('grid'));
    document.getElementById('view-list')?.addEventListener('click', () => setView('list'));

    // Mobile Sidebar
    document.getElementById('mobile-filter-toggle')?.addEventListener('click', () => {
        sidebar?.classList.toggle('active'); toggleOverlay();
    });

    // Game Modal
    document.querySelector('.close-modal')?.addEventListener('click', () => { SFX.close(); closeGameModal(); });
    window.addEventListener('click', (e) => { if (e.target === modal) closeGameModal(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGameModal(); });

    // Social
    document.getElementById('btn-like')?.addEventListener('click', handleLike);
    document.getElementById('btn-submit-comment')?.addEventListener('click', handleSubmitComment);

    // Scroll to Top
    const scrollTopBtn = document.getElementById('btn-scroll-top');
    const mainContent = document.querySelector('.main-content');
    if (mainContent && scrollTopBtn) {
        mainContent.addEventListener('scroll', () => {
            scrollTopBtn.classList.toggle('visible', mainContent.scrollTop > 400);
        });
        scrollTopBtn.addEventListener('click', () => { SFX.click(); scrollToTop(); });
    }
}

function setView(view) {
    const grid = document.getElementById('games-grid');
    const gridBtn = document.getElementById('view-grid');
    const listBtn = document.getElementById('view-list');
    if (view === 'grid') { grid.classList.remove('list-view'); gridBtn.classList.add('active'); listBtn.classList.remove('active'); }
    else { grid.classList.add('list-view'); listBtn.classList.add('active'); gridBtn.classList.remove('active'); }
}

function toggleOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div'); overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => { document.querySelector('.sidebar').classList.remove('active'); overlay.classList.remove('active'); });
    }
    overlay.classList.toggle('active');
}

function scrollToTop() { document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' }); }
function closeGameModal() { document.getElementById('game-modal').classList.remove('show'); AppState.currentGameId = null; }

// ===================== MODALE =====================
window.openModalByIndex = function (index) {
    const game = AppState.filteredGames[index];
    if (!game) return;
    AppState.currentGameId = game.id;

    document.getElementById('modal-title').textContent = game.title;
    document.getElementById('modal-desc').innerHTML = game.description || "<em>Nessuna descrizione disponibile.</em>";
    document.getElementById('modal-dev').textContent = game.developers.join(', ') || "N/A";
    document.getElementById('modal-pub').textContent = game.publishers.join(', ') || "N/A";

    const coverImg = document.getElementById('modal-cover');
    coverImg.src = game.cover_url;
    coverImg.onerror = function () { this.src = PLACEHOLDER; };

    document.getElementById('modal-badges').innerHTML = [
        ...game.genres.map(g => `<span class="badge">${escapeHtml(g)}</span>`),
        ...game.platforms.map(p => `<span class="badge">${escapeHtml(p)}</span>`)
    ].join('');

    loadSocialData(game.id);
    renderSimilarGames(game);
    document.getElementById('game-modal').classList.add('show');
    SFX.open();
};

// ===================== SOCIAL =====================
async function loadSocialData(gameId) {
    const commentsList = document.getElementById('comments-list');
    const likeCount = document.getElementById('like-count');
    const likeBtn = document.getElementById('btn-like');

    commentsList.innerHTML = '<p class="no-comments">Caricamento...</p>';
    likeCount.textContent = '(...)';

    const likes = await getLikeCount(gameId);
    likeCount.textContent = `(${likes})`;

    const likedGames = JSON.parse(localStorage.getItem('liked_games') || '[]');
    likeBtn.classList.toggle('liked', likedGames.includes(gameId));

    const comments = await getComments(gameId);
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">Nessun commento ancora. Sii il primo!</p>';
    } else {
        commentsList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-author">${escapeHtml(c.author)} <span class="comment-date">${new Date(c.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                <div class="comment-text">${escapeHtml(c.content)}</div>
            </div>`).join('');
    }
}

async function handleLike() {
    const gameId = AppState.currentGameId;
    if (!gameId) return;
    const likedGames = JSON.parse(localStorage.getItem('liked_games') || '[]');
    if (likedGames.includes(gameId)) { alert('Hai già messo Like!'); return; }
    const game = AppState.games.find(g => g.id === gameId);
    const success = await addLike(gameId, game ? game.title : '');
    if (success) {
        likedGames.push(gameId); localStorage.setItem('liked_games', JSON.stringify(likedGames));
        document.getElementById('btn-like').classList.add('liked');
        document.getElementById('like-count').textContent = `(${await getLikeCount(gameId)})`;
    }
}

async function handleSubmitComment() {
    const gameId = AppState.currentGameId;
    if (!gameId) return;
    const content = document.getElementById('comment-text').value.trim();
    if (!content) { alert('Scrivi un commento prima di inviare.'); return; }
    const game = AppState.games.find(g => g.id === gameId);
    const result = await addComment(gameId, game ? game.title : '', document.getElementById('comment-author').value, content);
    if (result) { document.getElementById('comment-text').value = ''; await loadSocialData(gameId); }
}

// ===================== GIOCHI SIMILI =====================
function findSimilarGames(game, count = 6) {
    return AppState.games.filter(g => g.id !== game.id).map(g => {
        let score = 0;
        game.genres.forEach(ge => { if (g.genres.includes(ge)) score += 3; });
        game.labels.forEach(l => { if (g.labels.includes(l)) score += 2; });
        game.platforms.forEach(p => { if (g.platforms.includes(p)) score += 1; });
        if (game.series && g.series && game.series === g.series) score += 5;
        return { game: g, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, count).map(x => x.game);
}

function renderSimilarGames(game) {
    const container = document.getElementById('similar-games');
    const similar = findSimilarGames(game);
    if (similar.length === 0) { container.innerHTML = '<p class="no-similar">Nessun gioco simile trovato.</p>'; return; }
    container.innerHTML = similar.map(g => {
        const idx = AppState.filteredGames.indexOf(g);
        const gi = idx >= 0 ? idx : AppState.games.indexOf(g);
        return `<div class="similar-card" onclick="openModalByIndex(${gi})">
            <img src="${g.cover_url}" alt="${escapeHtml(g.title)}" onerror="this.src='${PLACEHOLDER}'">
            <span class="similar-title">${escapeHtml(g.title)}</span>
        </div>`;
    }).join('');
}

// ===================== SIDEBAR =====================
function restoreSidebarState() {
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
        document.querySelector('.sidebar').classList.add('sidebar-collapsed');
    }
}

document.addEventListener('DOMContentLoaded', init);


