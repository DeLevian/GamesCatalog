/**
 * CONFIG — File di configurazione centralizzato
 * ================================================
 * Modifica SOLO questo file per personalizzare l'aspetto del sito.
 * Tutti i colori, font, suoni e parametri sono qui.
 */

const CONFIG = {

    // ========================
    //  SITO
    // ========================
    site: {
        name: "Digital Game",
        nameHighlight: "Catalog",
        title: "DigitalGame Catalog",
        gamesPerPageDefault: 60,
        gamesPerPageOptions: [30, 60, 120, 0], // 0 = Tutti
    },

    // ========================
    //  COLORI (CSS Variables)
    // ========================
    colors: {
        bgDark: "#0a0a0f",
        bgCard: "#16161e",
        bgSidebar: "#101018",
        bgSurface: "#1c1c28",
        textPrimary: "#f0f0f5",
        textSecondary: "#8888a0",
        accent: "#6366f1",
        accentHover: "#4f46e5",
        accentGlow: "rgba(99, 102, 241, 0.15)",
        likeColor: "#ef4444",
        border: "#2a2a3a",
    },

    // ========================
    //  SFONDO ANIMATO
    // ========================
    background: {
        enabled: true,
        gradient1: "rgba(99, 102, 241, 0.12)",
        gradient2: "rgba(16, 185, 129, 0.08)",
        gradient3: "rgba(139, 92, 246, 0.10)",
        animationDuration: "20s",
    },

    // ========================
    //  TIPOGRAFIA
    // ========================
    font: {
        family: "'Inter', sans-serif",
        googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    },

    // ========================
    //  BORDI E OMBRE
    // ========================
    ui: {
        radius: "10px",
        radiusLg: "16px",
        shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        transition: "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        placeholderCover: "https://placehold.co/400x600/1c1c28/8888a0?text=No+Cover",
    },

    // ========================
    //  SUPABASE
    // ========================
    supabase: {
        url: "https://awltugoloqmhbsumyzhj.supabase.co",
        key: "sb_publishable_-Um9KT4Z-GS-5qryUh00bw_Th_FgRtH",
    },

    // ========================
    //  EFFETTI SONORI
    // ========================
    sfx: {
        enabled: true,
        hover: { freq: 880, duration: 0.06, type: "sine", volume: 0.04 },
        click: { freq: 660, duration: 0.08, type: "sine", volume: 0.07 },
        clickHi: { freq: 990, duration: 0.06, type: "sine", volume: 0.04 },
        open: [
            { freq: 440, duration: 0.10, type: "sine", volume: 0.06, delay: 0 },
            { freq: 660, duration: 0.12, type: "sine", volume: 0.05, delay: 60 },
            { freq: 880, duration: 0.14, type: "sine", volume: 0.04, delay: 120 },
        ],
        close: [
            { freq: 660, duration: 0.08, type: "sine", volume: 0.05, delay: 0 },
            { freq: 440, duration: 0.10, type: "sine", volume: 0.04, delay: 50 },
        ],
        nav: { freq: 520, duration: 0.06, type: "triangle", volume: 0.05 },
    },
};

// ========================
//  APPLICAZIONE AUTOMATICA
// ========================
(function applyConfig() {
    const root = document.documentElement;
    const c = CONFIG.colors;
    root.style.setProperty('--bg-dark', c.bgDark);
    root.style.setProperty('--bg-card', c.bgCard);
    root.style.setProperty('--bg-sidebar', c.bgSidebar);
    root.style.setProperty('--bg-surface', c.bgSurface);
    root.style.setProperty('--text-primary', c.textPrimary);
    root.style.setProperty('--text-secondary', c.textSecondary);
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--accent-hover', c.accentHover);
    root.style.setProperty('--accent-glow', c.accentGlow);
    root.style.setProperty('--like-color', c.likeColor);
    root.style.setProperty('--border', c.border);

    const u = CONFIG.ui;
    root.style.setProperty('--radius', u.radius);
    root.style.setProperty('--radius-lg', u.radiusLg);
    root.style.setProperty('--shadow', u.shadow);
    root.style.setProperty('--transition', u.transition);

    root.style.setProperty('font-family', CONFIG.font.family);

    if (CONFIG.background.enabled) {
        const bg = CONFIG.background;
        root.style.setProperty('--bg-grad-1', bg.gradient1);
        root.style.setProperty('--bg-grad-2', bg.gradient2);
        root.style.setProperty('--bg-grad-3', bg.gradient3);
        root.style.setProperty('--bg-anim-duration', bg.animationDuration);
    }

    document.title = CONFIG.site.title;
})();
