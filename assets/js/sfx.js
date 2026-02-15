/**
 * SFX — Effetti Sonori UI sintetici con Web Audio API
 * Usa CONFIG.sfx per frequenze, volumi e durate.
 */
const SFX = (() => {
    let ctx = null;
    let muted = localStorage.getItem('sfx_muted') === 'true';

    function getCtx() {
        if (!ctx) {
            try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { return null; }
        }
        return ctx;
    }

    function playTone(freq, duration, type = 'sine', volume = 0.08) {
        if (muted || !CONFIG.sfx.enabled) return;
        const c = getCtx();
        if (!c) return;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    function playSequence(notes) {
        notes.forEach(n => {
            setTimeout(() => playTone(n.freq, n.duration, n.type, n.volume), n.delay || 0);
        });
    }

    return {
        hover() {
            const s = CONFIG.sfx.hover;
            playTone(s.freq, s.duration, s.type, s.volume);
        },
        click() {
            const s = CONFIG.sfx.click;
            const h = CONFIG.sfx.clickHi;
            playTone(s.freq, s.duration, s.type, s.volume);
            playTone(h.freq, h.duration, h.type, h.volume);
        },
        open() {
            playSequence(CONFIG.sfx.open);
        },
        close() {
            playSequence(CONFIG.sfx.close);
        },
        nav() {
            const s = CONFIG.sfx.nav;
            playTone(s.freq, s.duration, s.type, s.volume);
        },
        toggleMute() {
            muted = !muted;
            localStorage.setItem('sfx_muted', muted);
            return muted;
        },
        isMuted() { return muted; }
    };
})();
