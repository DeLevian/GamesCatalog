/**
 * API Handler (Supabase)
 * Gestisce commenti e like salvati nel cloud.
 * Usa CONFIG.supabase per URL e chiave.
 */

let db = null;
try {
    if (window.supabase && window.supabase.createClient) {
        db = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
        console.log('✅ Supabase connesso.');
    } else {
        console.warn('⚠️ Supabase SDK non caricato. I commenti non saranno disponibili.');
    }
} catch (e) {
    console.error('❌ Errore inizializzazione Supabase:', e);
}

/* ============================
 *  COMMENTI
 * ============================ */

async function getComments(gameId) {
    if (!db) return [];
    try {
        const { data, error } = await db
            .from('comments')
            .select('*')
            .eq('game_id', gameId)
            .eq('is_favorite', false)
            .order('created_at', { ascending: false });

        if (error) { console.error('Errore caricamento commenti:', error); return []; }
        return data || [];
    } catch (e) {
        console.error('Errore rete:', e);
        return [];
    }
}

async function addComment(gameId, gameTitle, author, content) {
    if (!db) { alert('Database non disponibile. Controlla la connessione.'); return null; }

    const authorName = author.trim() || 'Anonimo';
    const { data, error } = await db
        .from('comments')
        .insert({
            game_id: gameId,
            game_title: gameTitle,
            author: authorName,
            content: content,
            is_favorite: false
        })
        .select();

    if (error) { console.error('Errore invio commento:', error); alert('Errore nell\'invio del commento.'); return null; }
    return data;
}

/* ============================
 *  LIKE / PREFERITI
 * ============================ */

async function getLikeCount(gameId) {
    if (!db) return 0;
    try {
        const { count, error } = await db
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', gameId)
            .eq('is_favorite', true);

        if (error) { console.error('Errore conteggio like:', error); return 0; }
        return count || 0;
    } catch (e) {
        return 0;
    }
}

async function addLike(gameId, gameTitle) {
    if (!db) { alert('Database non disponibile.'); return false; }

    const { error } = await db
        .from('comments')
        .insert({
            game_id: gameId,
            game_title: gameTitle,
            author: 'like',
            content: '❤️',
            is_favorite: true
        });

    if (error) { console.error('Errore invio like:', error); return false; }
    return true;
}

/* ============================
 *  ADMIN: Tutti i giochi con interazioni
 * ============================ */

async function getAllInteractions() {
    if (!db) return [];
    const { data, error } = await db
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) { console.error('Errore:', error); return []; }
    return data || [];
}

async function getRecentActivity(limit = 15) {
    if (!db) return [];
    try {
        const { data, error } = await db
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) { console.error('Errore attività recenti:', error); return []; }
        return data || [];
    } catch (e) {
        console.error('Errore rete:', e);
        return [];
    }
}

/* ============================
 *  PROPOSTE GIOCHI
 * ============================ */

async function getSuggestions() {
    if (!db) return [];
    try {
        const { data, error } = await db
            .from('suggestions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) { console.error('Errore caricamento proposte:', error); return []; }
        return data || [];
    } catch (e) {
        console.error('Errore rete:', e);
        return [];
    }
}

async function addSuggestion(title, platform, notes, author) {
    if (!db) { alert('Database non disponibile. Controlla la connessione.'); return null; }

    const authorName = (author || '').trim() || 'Anonimo';
    const { data, error } = await db
        .from('suggestions')
        .insert({
            game_title: title.trim(),
            platform: (platform || '').trim(),
            notes: (notes || '').trim(),
            suggested_by: authorName,
            status: 'in_attesa'
        })
        .select();

    if (error) { console.error('Errore invio proposta:', error); alert('Errore nell\'invio della proposta.'); return null; }
    return data;
}
