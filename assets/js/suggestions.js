/**
 * GESTIONE SUGGERIMENTI E BACHECA
 * Separato da app.js per garantire il funzionamento anche se app.js ha errori (es. fetch locale).
 */

// Utility interna per evitare dipendenze
function escapeHtmlSuggestions(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===================== SUGGERISCI GIOCO =====================
window.openSuggestModal = function () {
    const modal = document.getElementById('suggest-modal');
    if (modal) {
        modal.classList.add('show');
        const feedback = document.getElementById('suggest-feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.className = 'suggest-feedback';
        }
    }
};

window.closeSuggestModal = function () {
    const modal = document.getElementById('suggest-modal');
    if (modal) modal.classList.remove('show');
};

window.submitSuggestion = async function () {
    const titleEl = document.getElementById('suggest-title');
    const platformEl = document.getElementById('suggest-platform');
    const notesEl = document.getElementById('suggest-notes');
    const authorEl = document.getElementById('suggest-author');
    const feedback = document.getElementById('suggest-feedback');
    const btn = document.getElementById('btn-submit-suggestion');

    if (!titleEl || !feedback || !btn) return;

    const title = titleEl.value.trim();
    const platform = platformEl.value.trim();
    const notes = notesEl.value.trim();
    const author = authorEl.value.trim();

    if (!title) {
        feedback.textContent = 'Inserisci almeno il titolo del gioco.';
        feedback.className = 'suggest-feedback error';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Invio in corso...';

    // check if API is available
    if (typeof addSuggestion === 'undefined') {
        feedback.textContent = 'Errore: API non disponibile.';
        feedback.className = 'suggest-feedback error';
        btn.disabled = false;
        btn.textContent = 'Invia Proposta';
        return;
    }

    const result = await addSuggestion(title, platform, notes, author);

    if (result) {
        feedback.textContent = 'Grazie! La tua proposta è stata registrata.';
        feedback.className = 'suggest-feedback success';
        titleEl.value = '';
        platformEl.value = '';
        notesEl.value = '';
        authorEl.value = '';
        setTimeout(function () { window.closeSuggestModal(); }, 2000);
    } else {
        feedback.textContent = 'Errore nell\'invio. Riprova.';
        feedback.className = 'suggest-feedback error';
    }

    btn.disabled = false;
    btn.textContent = 'Invia Proposta';
};

// ===================== BACHECA PROPOSTE =====================
window.openBoardModal = async function () {
    const modal = document.getElementById('board-modal');
    const list = document.getElementById('suggestions-list');
    if (!modal || !list) return;

    modal.classList.add('show');
    list.innerHTML = '<p class="loading-text">Caricamento proposte...</p>';

    if (typeof getSuggestions === 'undefined') {
        list.innerHTML = '<p class="error-text">Servizio non disponibile.</p>';
        return;
    }

    const suggestions = await getSuggestions();
    renderSuggestionsList(suggestions);
};

window.closeBoardModal = function () {
    const modal = document.getElementById('board-modal');
    if (modal) modal.classList.remove('show');
};

function renderSuggestionsList(suggestions) {
    const list = document.getElementById('suggestions-list');
    if (!list) return;

    if (!suggestions || suggestions.length === 0) {
        list.innerHTML = '<p class="no-suggestions">Nessuna proposta ancora. Sii il primo a suggerire un gioco!</p>';
        return;
    }

    const statusLabels = {
        'in_attesa': { label: 'In Attesa', cls: 'status-pending' },
        'in_cerca': { label: 'In Cerca', cls: 'status-searching' },
        'aggiunto': { label: 'Aggiunto', cls: 'status-added' },
        'rifiutato': { label: 'Rifiutato', cls: 'status-rejected' }
    };

    list.innerHTML = suggestions.map(s => {
        const st = statusLabels[s.status] || statusLabels['in_attesa'];
        const date = new Date(s.created_at).toLocaleDateString('it-IT', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        return `
        <div class="suggestion-card">
            <div class="suggestion-card-header">
                <span class="suggestion-game-title">${escapeHtmlSuggestions(s.game_title)}</span>
                <span class="suggestion-status ${st.cls}">${st.label}</span>
            </div>
            <div class="suggestion-card-meta">
                ${s.platform ? `<span class="suggestion-platform">${escapeHtmlSuggestions(s.platform)}</span>` : ''}
                <span class="suggestion-author">${escapeHtmlSuggestions(s.suggested_by || 'Anonimo')}</span>
                <span class="suggestion-date">${date}</span>
            </div>
            ${s.notes ? `<div class="suggestion-notes">${escapeHtmlSuggestions(s.notes)}</div>` : ''}
        </div>`;
    }).join('');
}

// ===================== CHIUSURA EVENTI GLOBALI =====================
(function () {
    var suggestModal = document.getElementById('suggest-modal');
    var boardModal = document.getElementById('board-modal');

    window.addEventListener('click', function (e) {
        if (suggestModal && e.target === suggestModal) window.closeSuggestModal();
        if (boardModal && e.target === boardModal) window.closeBoardModal();
    });

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (suggestModal && suggestModal.classList.contains('show')) window.closeSuggestModal();
            if (boardModal && boardModal.classList.contains('show')) window.closeBoardModal();
        }
    });
})();
