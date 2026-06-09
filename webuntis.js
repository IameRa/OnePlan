// ===== WebUntis Integration =====
// Kommuniziert mit der WebUntis API über einen CORS-Proxy

const WebUntisAPI = {
    // Konfiguration (wird aus localStorage geladen)
    config: null,

    // Proxy-Server auf Render
    PROXIES: ['https://oneplan.onrender.com/proxy?url='],
    PROXY: 'https://oneplan.onrender.com/proxy?url=',

    // ===== Konfiguration =====
    loadConfig() {
        const saved = localStorage.getItem('schulOrganizer_webuntis_config');
        this.config = saved ? JSON.parse(saved) : null;
        return this.config;
    },

    saveConfig(school, username, password, server) {
        this.config = { school, username, password, server };
        localStorage.setItem('schulOrganizer_webuntis_config', JSON.stringify(this.config));
    },

    clearConfig() {
        this.config = null;
        localStorage.removeItem('schulOrganizer_webuntis_config');
        localStorage.removeItem('schulOrganizer_webuntis_session');
    },

    isConfigured() {
        this.loadConfig();
        return this.config !== null;
    },

    // ===== API Basis =====
    getBaseUrl(proxy) {
        const target = `https://${this.config.server}/WebUntis/jsonrpc.do`;
        return (proxy || this.PROXY) + encodeURIComponent(target);
    },

    async rpc(method, params = {}, sessionId = null) {
        let targetUrl = `https://${this.config.server}/WebUntis/jsonrpc.do`;
        if (sessionId) targetUrl += `?school=&sessionId=${sessionId}`;

        const body = JSON.stringify({
            id: String(Date.now()),
            method,
            params,
            jsonrpc: '2.0'
        });

        let lastError = null;
        for (const proxy of this.PROXIES) {
            try {
                const res = await fetch(proxy + encodeURIComponent(targetUrl), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    credentials: 'omit'
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error.message || 'API Fehler');
                this.PROXY = proxy;
                return data.result;
            } catch (err) {
                lastError = err;
                continue;
            }
        }
        throw new Error(`Verbindung fehlgeschlagen: ${lastError?.message}. Bitte prüfe Server und Schulname.`);
    },

    // ===== Session =====
    async login() {
        const { username, password } = this.config;
        const result = await this.rpc('authenticate', { user: username, password: password, client: 'OnePlan' });
        const session = { sessionId: result.sessionId, klasseId: result.klasseId, personId: result.personId };
        sessionStorage.setItem('schulOrganizer_webuntis_session', JSON.stringify(session));
        return session;
    },

    async logout(sessionId) {
        try { await this.rpc('logout', {}, sessionId); } catch (_) {}
        sessionStorage.removeItem('schulOrganizer_webuntis_session');
    },

    getSession() {
        const s = sessionStorage.getItem('schulOrganizer_webuntis_session');
        return s ? JSON.parse(s) : null;
    },

    async ensureSession() {
        let session = this.getSession();
        if (!session) session = await this.login();
        return session;
    },

    // Datum-Hilfsfunktionen
    toUntisDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return parseInt(`${y}${m}${d}`);
    },

    fromUntisDate(n) {
        const s = String(n);
        return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    },

    fromUntisTime(n) {
        const s = String(n).padStart(4, '0');
        return `${s.slice(0,2)}:${s.slice(2,4)}`;
    },

    // ===== Stundenplan abrufen =====
    async fetchTimetable() {
        this.loadConfig();
        const session = await this.ensureSession();
        
        // Aktuelle Woche berechnen (Mo-Fr)
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        const params = {
            id: session.personId,
            type: 5, // 5 = Schüler
            startDate: this.toUntisDate(monday),
            endDate: this.toUntisDate(friday)
        };

        const lessons = await this.rpc('getTimetable', params, session.sessionId);
        await this.logout(session.sessionId);
        return this.parseTimetable(lessons);
    },

    parseTimetable(lessons) {
        // Leeres Raster: 10 Stunden x 5 Tage
        const timetable = Array.from({ length: 10 }, () =>
            Array.from({ length: 5 }, () => ({ subject: '', teacher: '', room: '' }))
        );

        lessons.forEach(lesson => {
            const dayOfWeek = new Date(this.fromUntisDate(lesson.date)).getDay(); // 1=Mo, 5=Fr
            const dayIndex = dayOfWeek - 1;
            if (dayIndex < 0 || dayIndex > 4) return;

            // Stundennummer bestimmen (aus Startzeit)
            const periodIndex = this.getPeriodIndex(lesson.startTime);
            if (periodIndex === null) return;

            const subject = lesson.su?.[0]?.longname || lesson.su?.[0]?.name || '';
            const teacher = lesson.te?.[0]?.longname || lesson.te?.[0]?.name || '';
            const room = lesson.ro?.[0]?.name || '';

            if (timetable[periodIndex] && timetable[periodIndex][dayIndex] !== undefined) {
                timetable[periodIndex][dayIndex] = { subject, teacher, room };
            }
        });

        return timetable;
    },

    // Stunden-Zeiten → Index
    getPeriodIndex(startTime) {
        const timeMap = {
            740: 0,  // 07:40
            830: 1,  // 08:30
            930: 2,  // 09:30
            1020: 3, // 10:20
            1125: 4, // 11:25
            1215: 5, // 12:15
            1345: 6, // 13:45
            1430: 7, // 14:30
            1515: 8, // 15:15
            1600: 9  // 16:00
        };
        return timeMap[startTime] ?? null;
    },

    // ===== Vertretungsplan abrufen =====
    async fetchSubstitutions() {
        this.loadConfig();
        const session = await this.ensureSession();

        // Heute + nächste 7 Tage
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const params = {
            startDate: this.toUntisDate(today),
            endDate: this.toUntisDate(nextWeek)
        };

        const result = await this.rpc('getSubstitutions', params, session.sessionId);
        await this.logout(session.sessionId);
        return this.parseSubstitutions(result);
    },

    parseSubstitutions(data) {
        if (!Array.isArray(data)) return [];
        
        return data.map(s => ({
            id: Date.now() + Math.random(),
            date: this.fromUntisDate(s.date),
            period: s.period || '',
            original: s.subject?.longname || s.subject?.name || s.cancelledSubject?.longname || 'Unbekannt',
            replacement: s.type === 'cancel' ? 'Entfall' : (s.subject?.longname || s.subject?.name || 'Vertretung'),
            room: s.room?.name || '',
            note: s.text || '',
            fromWebUntis: true
        }));
    }
};
