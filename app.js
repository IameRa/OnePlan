// ===== Boot-Splash =====
// Wird sofort beim Laden angezeigt (siehe index.html) und hier wieder
// ausgeblendet, sobald klar ist, ob Login-Screen oder App gezeigt wird.
// Eine Mindestanzeigedauer verhindert ein störendes Aufblitzen bei
// sehr schnellem Session-Check.
const BOOT_SPLASH_MIN_MS = 700;
const bootSplashShownAt = Date.now();
let bootSplashHidden = false;

function hideBootSplash() {
    if (bootSplashHidden) return;
    bootSplashHidden = true;
    const el = document.getElementById('boot-splash');
    if (!el) return;
    const elapsed = Date.now() - bootSplashShownAt;
    const wait = Math.max(0, BOOT_SPLASH_MIN_MS - elapsed);
    setTimeout(() => {
        el.classList.add('boot-splash-hide');
        setTimeout(() => el.remove(), 500);
    }, wait);
}
// Sicherheitsnetz: falls der Session-Check aus irgendeinem Grund nie
// abschließt (z.B. Netzwerkfehler), soll der Splash trotzdem verschwinden.
setTimeout(hideBootSplash, 8000);

// ===== Supabase Setup =====
const SUPABASE_URL = 'https://nothxzhzhjgpheqwquhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdGh4emh6aGpncGhlcXdxdWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTIwNDcsImV4cCI6MjA5NjYyODA0N30.yDXDBzHXJxy_Re-dNejiXAZiZyzoyrTPlS7X7fP_YeI';
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Push-Benachrichtigungen =====
// Öffentlicher VAPID-Key aus `npx web-push generate-vapid-keys`. Der Private Key
// gehört NUR als Supabase Edge-Function-Secret auf den Server, niemals hierhin.
const VAPID_PUBLIC_KEY = 'BOsvbwTDCAkgrPNF_s50TTmi_rRX-4Q92q4A6_HEU2AF8g0UV0PxCZ7j3a2kLghjoptHrMmVjs9603GTWZxgddw';

// ===== Schulferien Schleswig-Holstein =====
// Quelle: Landesverordnung über Ferientermine (schleswig-holstein.de/Ferientermine),
// Stand Ferienverordnung 2024/25 bis 2030/31. Gilt für das Festland; auf Sylt, Föhr,
// Amrum, Helgoland und den Halligen enden die Sommerferien und beginnen die
// Herbstferien jeweils eine Woche früher.
const FERIEN_SH = [
    { name: 'Sommerferien', start: '2026-07-04', end: '2026-08-15' },
    { name: 'Herbstferien', start: '2026-10-12', end: '2026-10-24' },
    { name: 'Weihnachtsferien', start: '2026-12-21', end: '2027-01-06' },
    { name: 'Osterferien', start: '2027-03-30', end: '2027-04-10' },
    { name: 'Himmelfahrt (schulfrei)', start: '2027-05-07', end: '2027-05-07' },
    { name: 'Sommerferien', start: '2027-07-03', end: '2027-08-14' },
    { name: 'Herbstferien', start: '2027-10-11', end: '2027-10-23' },
    { name: 'Weihnachtsferien', start: '2027-12-23', end: '2028-01-08' },
    { name: 'Osterferien', start: '2028-04-03', end: '2028-04-15' },
    { name: 'Himmelfahrt (schulfrei)', start: '2028-05-26', end: '2028-05-26' },
    { name: 'Sommerferien', start: '2028-06-24', end: '2028-08-04' },
    { name: 'Herbstferien', start: '2028-10-16', end: '2028-10-30' },
    { name: 'Weihnachtsferien', start: '2028-12-21', end: '2029-01-05' },
    { name: 'Osterferien', start: '2029-03-23', end: '2029-04-06' },
    { name: 'Himmelfahrt (schulfrei)', start: '2029-05-11', end: '2029-05-11' },
    { name: 'Sommerferien', start: '2029-06-23', end: '2029-08-03' },
    { name: 'Herbstferien', start: '2029-10-08', end: '2029-10-19' },
    { name: 'Weihnachtsferien', start: '2029-12-21', end: '2030-01-08' },
    { name: 'Osterferien', start: '2030-04-08', end: '2030-04-20' },
    { name: 'Himmelfahrt (schulfrei)', start: '2030-05-31', end: '2030-05-31' },
    { name: 'Sommerferien', start: '2030-07-08', end: '2030-08-17' },
    { name: 'Herbstferien', start: '2030-10-14', end: '2030-10-25' },
    { name: 'Weihnachtsferien', start: '2030-12-20', end: '2031-01-06' },
    { name: 'Osterferien', start: '2031-03-28', end: '2031-04-10' },
    { name: 'Himmelfahrt (schulfrei)', start: '2031-05-23', end: '2031-05-23' }
];

// ===== Stundenplan-Zeiten =====
// Zentrale Definition der 8 Unterrichtsstunden, genutzt vom Stundenplan-Rendering
// und vom "Nächste Stunde"-Widget auf dem Dashboard.
const TIMETABLE_PERIODS = [
    { label: '1.', start: '07:40', end: '08:25' },
    { label: '2.', start: '08:30', end: '09:15' },
    { label: '3.', start: '09:30', end: '10:15' },
    { label: '4.', start: '10:20', end: '11:05' },
    { label: '5.', start: '11:25', end: '12:10' },
    { label: '6.', start: '12:15', end: '13:00' },
    { label: '7.', start: '13:45', end: '14:30' },
    { label: '8.', start: '14:30', end: '15:15' }
];

// ===== Push-Benachrichtigungen (Web Push) =====
const Push = {
    on(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    },

    isSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    async init() {
        this.on('btn-enable-push', 'click', () => this.toggle());
        await this.syncButtonUI();
    },

    async getExistingSubscription() {
        if (!this.isSupported()) return null;
        const reg = await navigator.serviceWorker.ready;
        return reg.pushManager.getSubscription();
    },

    async syncButtonUI() {
        const btn = document.getElementById('btn-enable-push');
        if (!btn) return;
        if (!this.isSupported()) {
            btn.style.display = 'none';
            return;
        }
        btn.style.display = '';
        const sub = await this.getExistingSubscription();
        btn.innerHTML = sub
            ? '<i class="fas fa-bell-slash"></i> Push-Benachrichtigungen deaktivieren'
            : '<i class="fas fa-bell"></i> Push-Benachrichtigungen aktivieren';
    },

    async toggle() {
        const sub = await this.getExistingSubscription();
        if (sub) {
            await this.unsubscribe(sub);
        } else {
            await this.subscribe();
        }
        this.syncButtonUI();
    },

    // Wandelt den base64url-kodierten VAPID-Key in das von PushManager erwartete Format um
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
    },

    async subscribe() {
        if (!this.isSupported()) {
            App.showNotification('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt', 'error');
            return;
        }
        if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.startsWith('HIER_')) {
            App.showNotification('Push ist noch nicht eingerichtet (VAPID-Key fehlt)', 'error');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            App.showNotification('Push-Berechtigung wurde nicht erteilt', 'warning');
            return;
        }

        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const json = sub.toJSON();
            const { error } = await supabase.from('push_subscriptions').upsert({
                user_id: App.userId,
                endpoint: json.endpoint,
                p256dh: json.keys.p256dh,
                auth: json.keys.auth
            }, { onConflict: 'endpoint' });

            if (error) throw error;
            App.showNotification('Push-Benachrichtigungen aktiviert', 'success');
        } catch (err) {
            console.error('[Push] Abo fehlgeschlagen:', err);
            App.showNotification('Push-Abo fehlgeschlagen', 'error');
        }
    },

    async unsubscribe(sub) {
        try {
            const endpoint = sub.endpoint;
            await sub.unsubscribe();
            await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
            App.showNotification('Push-Benachrichtigungen deaktiviert', 'success');
        } catch (err) {
            console.error('[Push] Abmelden fehlgeschlagen:', err);
        }
    }
};

// ===== Account System =====
const Auth = {
    currentUser: null,

    async init() {
        this.setupListeners();
        this._sessionHandled = false;
        this._passwordRecovery = false;

        // Listen for auth changes. This also fires immediately with the
        // current session state when subscribed, so it covers the initial
        // page load too — no separate getSession()+loadProfile call needed.
        supabase.auth.onAuthStateChange(async (event, session) => {
            // Nutzer kommt über den "Passwort zurücksetzen"-Link aus der E-Mail:
            // Supabase liefert dafür eine gültige Session, aber wir wollen erst
            // das neue Passwort abfragen, bevor die App normal geladen wird.
            if (event === 'PASSWORD_RECOVERY') {
                this._passwordRecovery = true;
                document.getElementById('auth-overlay').classList.add('active');
                document.getElementById('login-form').classList.remove('active');
                document.getElementById('forgot-form').classList.remove('active');
                document.getElementById('reset-form').classList.add('active');
                hideBootSplash();
                return;
            }
            if (event === 'SIGNED_OUT') {
                this._sessionHandled = false;
                this._passwordRecovery = false;
                this.showAuthScreen();
                return;
            }
            if (session && !this._sessionHandled && !this._passwordRecovery) {
                this._sessionHandled = true;
                await this.loadProfile(session.user);
            }
        });

        // If there's no session at all, show the login screen right away
        // (the listener above only fires for actual sessions).
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            document.getElementById('auth-overlay').classList.add('active');
            hideBootSplash();
        }
    },

    async loadProfile(user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        this.currentUser = { ...user, ...(profile || {}) };
        this.showApp(this.currentUser);
    },

    // Registriert einen Listener nur, wenn das Element existiert — verhindert,
    // dass ein einzelnes fehlendes Element (z.B. durch einen Cache-Übergang
    // zwischen alter app.js und neuer index.html) die komplette App zum
    // Einfrieren bringt.
    on(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
        else console.warn(`[Auth] Element #${id} nicht gefunden — evtl. veralteter Cache?`);
    },

    setupListeners() {
        this.on('btn-login', 'click', () => this.login());

        this.on('show-forgot', 'click', (e) => {
            e.preventDefault();
            document.getElementById('login-form')?.classList.remove('active');
            document.getElementById('forgot-form')?.classList.add('active');
        });
        this.on('show-login-from-forgot', 'click', (e) => {
            e.preventDefault();
            document.getElementById('forgot-form')?.classList.remove('active');
            document.getElementById('login-form')?.classList.add('active');
        });

        this.on('btn-forgot', 'click', () => this.forgotPassword());
        this.on('btn-reset-password', 'click', () => this.resetPassword());

        this.on('btn-logout', 'click', () => this.logout());
        this.on('btn-open-settings', 'click', () => this.openSettingsModal());
        this.syncThemeUI();

        this.on('user-avatar-btn', 'click', () => {
            document.getElementById('user-dropdown')?.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            const menuBtn = document.getElementById('user-menu-btn');
            if (menuBtn && !menuBtn.contains(e.target)) {
                document.getElementById('user-dropdown')?.classList.add('hidden');
            }
        });

        ['login-username', 'login-password'].forEach(id => {
            this.on(id, 'keydown', (e) => {
                if (e.key === 'Enter') this.login();
            });
        });
        this.on('forgot-email', 'keydown', (e) => {
            if (e.key === 'Enter') this.forgotPassword();
        });
        ['reset-password', 'reset-password2'].forEach(id => {
            this.on(id, 'keydown', (e) => {
                if (e.key === 'Enter') this.resetPassword();
            });
        });
    },

    async login() {
        const username = document.getElementById('login-username').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showAuthError('login-form', 'Bitte alle Felder ausfüllen');
            return;
        }

        this.setLoading('btn-login', true);

        const { data, error } = await supabase.functions.invoke('login-with-username', {
            body: { username, password }
        });

        if (error || data?.error || !data?.session) {
            this.showAuthError('login-form', 'Benutzername oder Passwort falsch');
            this.setLoading('btn-login', false);
            return;
        }

        await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        });

        this.setLoading('btn-login', false);
    },

    async forgotPassword() {
        const email = document.getElementById('forgot-email').value.trim().toLowerCase();
        if (!email) {
            this.showAuthError('forgot-form', 'Bitte E-Mail-Adresse eingeben');
            return;
        }

        this.setLoading('btn-forgot', true);
        const redirectTo = `${location.origin}${location.pathname}`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        this.setLoading('btn-forgot', false);

        if (error) {
            this.showAuthError('forgot-form', error.message);
            return;
        }
        // Bewusst dieselbe Meldung, unabhängig davon ob die E-Mail existiert (kein Konten-Enumeration)
        this.showAuthInfo('forgot-form', 'Falls ein Konto mit dieser E-Mail existiert, wurde dir ein Link zum Zurücksetzen geschickt.');
    },

    async resetPassword() {
        const p1 = document.getElementById('reset-password').value;
        const p2 = document.getElementById('reset-password2').value;

        if (!p1 || !p2) {
            this.showAuthError('reset-form', 'Bitte beide Felder ausfüllen');
            return;
        }
        if (p1.length < 6) {
            this.showAuthError('reset-form', 'Passwort muss mindestens 6 Zeichen haben');
            return;
        }
        if (p1 !== p2) {
            this.showAuthError('reset-form', 'Passwörter stimmen nicht überein');
            return;
        }

        this.setLoading('btn-reset-password', true);
        const { error } = await supabase.auth.updateUser({ password: p1 });
        this.setLoading('btn-reset-password', false);

        if (error) {
            this.showAuthError('reset-form', error.message);
            return;
        }

        this._passwordRecovery = false;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await this.loadProfile(session.user);
    },

    showApp(user) {
        document.getElementById('auth-overlay').classList.remove('active');
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('user-menu-btn').style.display = 'flex';
        document.getElementById('mobile-nav').style.display = 'flex';
        hideBootSplash();

        const displayName = user.name || user.email || 'Nutzer';
        const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('user-initials').textContent = initials;
        document.getElementById('dropdown-name').textContent = displayName;
        document.getElementById('dropdown-username').textContent = user.username ? '@' + user.username : user.email;

        App.userId = user.id;
        App.init().then(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }).catch((err) => {
            console.error('App init error:', err);
            document.getElementById('loading-screen').style.display = 'none';
        });
    },

    showAuthScreen() {
        document.getElementById('auth-overlay').classList.add('active');
        document.getElementById('user-menu-btn').style.display = 'none';
        document.getElementById('mobile-nav').style.display = 'none';
        document.getElementById('user-dropdown').classList.add('hidden');
        document.getElementById('login-form').classList.add('active');
        document.getElementById('forgot-form').classList.remove('active');
        document.getElementById('reset-form').classList.remove('active');
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        App.userId = null;
        hideBootSplash();
    },

    async logout() {
        await supabase.auth.signOut();
    },

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('oneplan-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('oneplan-theme', 'dark');
        }
        this.syncThemeUI();
    },

    syncThemeUI() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const icon = document.getElementById('theme-toggle-icon');
        const label = document.getElementById('theme-toggle-label');
        if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        if (label) label.textContent = isDark ? 'Hellmodus' : 'Dunkelmodus';
    },

    async deleteAccount() {
        if (!confirm('Konto und alle Daten wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
        const user = this.currentUser;
        if (user) {
            await supabase.from('user_data').delete().eq('user_id', user.id);
            await supabase.from('profiles').delete().eq('id', user.id);
        }
        await supabase.auth.signOut();
    },

    setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) {
            if (btn.dataset.idleHtml === undefined) btn.dataset.idleHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bitte warten...';
        } else {
            btn.disabled = false;
            if (btn.dataset.idleHtml !== undefined) btn.innerHTML = btn.dataset.idleHtml;
        }
    },

    showAuthError(formId, msg) {
        const form = document.getElementById(formId);
        let err = form.querySelector('.auth-error');
        if (!err) {
            err = document.createElement('div');
            err.className = 'auth-error';
            form.querySelector('.btn-primary').before(err);
        }
        err.textContent = msg;
        err.style.display = 'block';
        setTimeout(() => { if (err) err.style.display = 'none'; }, 5000);
    },

    showAuthInfo(formId, msg) {
        const form = document.getElementById(formId);
        let info = form.querySelector('.auth-info');
        if (!info) {
            info = document.createElement('div');
            info.className = 'auth-info';
            form.querySelector('.btn-primary').before(info);
        }
        info.textContent = msg;
        info.style.display = 'block';
    },

    // ===== Passwort ändern (im eingeloggten Zustand, über das Nutzermenü) =====
    openChangePasswordModal() {
        document.getElementById('user-dropdown').classList.add('hidden');
        App.showModal(`
            <h3><i class="fas fa-key"></i> Passwort ändern</h3>
            <input type="password" id="cp-current" placeholder="Aktuelles Passwort" autocomplete="current-password">
            <input type="password" id="cp-new" placeholder="Neues Passwort (mind. 6 Zeichen)" autocomplete="new-password">
            <input type="password" id="cp-new2" placeholder="Neues Passwort wiederholen" autocomplete="new-password">
            <div id="cp-error" class="auth-error"></div>
            <button class="btn-primary btn-full" id="btn-save-password" style="margin-top:10px;">
                <i class="fas fa-check"></i> Passwort speichern
            </button>
        `);
        document.getElementById('btn-save-password').addEventListener('click', () => this.changePassword());
    },

    async changePassword() {
        const current = document.getElementById('cp-current').value;
        const next = document.getElementById('cp-new').value;
        const next2 = document.getElementById('cp-new2').value;
        const errEl = document.getElementById('cp-error');
        const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = 'block'; };

        if (!current || !next || !next2) { showErr('Bitte alle Felder ausfüllen'); return; }
        if (next.length < 6) { showErr('Neues Passwort muss mindestens 6 Zeichen haben'); return; }
        if (next !== next2) { showErr('Neue Passwörter stimmen nicht überein'); return; }

        this.setLoading('btn-save-password', true);

        // Aktuelles Passwort verifizieren, bevor es geändert wird
        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: this.currentUser.email,
            password: current
        });
        if (verifyError) {
            this.setLoading('btn-save-password', false);
            showErr('Aktuelles Passwort ist falsch');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: next });
        this.setLoading('btn-save-password', false);

        if (error) {
            showErr(error.message);
            return;
        }

        document.getElementById('modal').classList.remove('active');
        App.showNotification('Passwort geändert', 'success');
    },

    // ===== E-Mail für "Passwort vergessen" hinterlegen =====
    // Konten haben keine echte E-Mail beim Anlegen — damit "Passwort vergessen"
    // trotzdem funktioniert, kann der Nutzer hier freiwillig seine echte
    // E-Mail-Adresse hinterlegen. Läuft über eine Edge Function mit
    // Admin-Rechten, damit keine Bestätigungsmail an eine nicht existierende
    // alte Adresse nötig ist.
    openSetEmailModal() {
        document.getElementById('user-dropdown').classList.add('hidden');
        const currentEmail = this.currentUser?.email?.endsWith('@oneplan.internal') ? '' : (this.currentUser?.email || '');
        App.showModal(`
            <h3><i class="fas fa-envelope"></i> E-Mail hinterlegen</h3>
            <p class="field-hint">Wird nur für „Passwort vergessen" genutzt, nicht für den Login. Ohne hinterlegte E-Mail kannst du dein Passwort nur über deinen Admin zurücksetzen lassen.</p>
            <input type="email" id="se-email" placeholder="Deine echte E-Mail-Adresse" value="${currentEmail}" autocomplete="email">
            <div id="se-error" class="auth-error"></div>
            <button class="btn-primary btn-full" id="btn-save-email" style="margin-top:10px;">
                <i class="fas fa-check"></i> Speichern
            </button>
        `);
        document.getElementById('btn-save-email').addEventListener('click', () => this.setRecoveryEmail());
    },

    async setRecoveryEmail() {
        const email = document.getElementById('se-email').value.trim().toLowerCase();
        const errEl = document.getElementById('se-error');
        const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = 'block'; };

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showErr('Bitte eine gültige E-Mail-Adresse eingeben');
            return;
        }

        this.setLoading('btn-save-email', true);
        const { data, error } = await supabase.functions.invoke('set-user-email', { body: { email } });
        this.setLoading('btn-save-email', false);

        if (error || data?.error) {
            showErr(data?.error || error.message);
            return;
        }

        this.currentUser.email = email;
        document.getElementById('modal').classList.remove('active');
        App.showNotification('E-Mail hinterlegt', 'success');
    },

    // ===== Einstellungen-Fenster =====
    async openSettingsModal() {
        document.getElementById('user-dropdown').classList.add('hidden');
        await this.renderSettingsModal();
    },

    async renderSettingsModal() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gradeHidden = !!App.settings?.hideGradeAverage;
        const pushSupported = Push.isSupported();
        // Nie unbegrenzt warten: falls der Service Worker nicht bereit wird
        // (z.B. kein aktiver SW), soll sich das Fenster trotzdem öffnen.
        const pushOn = pushSupported ? await Promise.race([
            Push.getExistingSubscription().then(sub => !!sub).catch(() => false),
            new Promise(resolve => setTimeout(() => resolve(false), 1200))
        ]) : false;
        const user = this.currentUser || {};
        const displayName = user.name || user.username || user.email || '';
        const subtitle = user.username ? '@' + user.username : (user.email || '');

        App.showModal(`
            <h3><i class="fas fa-gear"></i> Einstellungen</h3>

            <div class="settings-group">
                <div class="settings-group-title">Darstellung</div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-moon"></i></div>
                    <div class="settings-row-text">
                        <div class="settings-row-label">Dunkelmodus</div>
                    </div>
                    <label class="settings-switch">
                        <input type="checkbox" id="settings-theme-toggle" ${isDark ? 'checked' : ''}>
                        <span class="settings-switch-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Dashboard</div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="settings-row-text">
                        <div class="settings-row-label">Notendurchschnitt anzeigen</div>
                        <div class="settings-row-hint">Blendet den Wert auf dem Dashboard aus</div>
                    </div>
                    <label class="settings-switch">
                        <input type="checkbox" id="settings-grade-toggle" ${!gradeHidden ? 'checked' : ''}>
                        <span class="settings-switch-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Benachrichtigungen</div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-bell"></i></div>
                    <div class="settings-row-text">
                        <div class="settings-row-label">Push-Benachrichtigungen</div>
                        ${!pushSupported ? '<div class="settings-row-hint">Auf diesem Gerät nicht unterstützt</div>' : ''}
                    </div>
                    <label class="settings-switch">
                        <input type="checkbox" id="settings-push-toggle" ${pushOn ? 'checked' : ''} ${!pushSupported ? 'disabled' : ''}>
                        <span class="settings-switch-slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Hilfe</div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-map-signs"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">Tutorial erneut ansehen</div></div>
                    <button class="settings-row-action" onclick="App.closeModal(); App.startTutorial();"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Konto</div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-user"></i></div>
                    <div class="settings-row-text">
                        <div class="settings-row-label">${displayName}</div>
                        ${subtitle ? `<div class="settings-row-hint">${subtitle}</div>` : ''}
                    </div>
                </div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-key"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">Passwort ändern</div></div>
                    <button class="settings-row-action" onclick="Auth.openChangePasswordModal()"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-envelope"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">E-Mail hinterlegen</div></div>
                    <button class="settings-row-action" onclick="Auth.openSetEmailModal()"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-sign-out-alt"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">Abmelden</div></div>
                    <button class="settings-row-action" onclick="Auth.logout()"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="settings-row">
                    <div class="settings-row-icon" style="background:rgba(220,38,38,0.12);color:var(--danger-color);"><i class="fas fa-trash"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">Konto löschen</div></div>
                    <button class="settings-row-action danger" onclick="Auth.deleteAccount()"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Rechtliches</div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-file-lines"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">Impressum</div></div>
                    <a class="settings-row-action" href="impressum.html" target="_blank" rel="noopener"><i class="fas fa-chevron-right"></i></a>
                </div>
                <div class="settings-row">
                    <div class="settings-row-icon"><i class="fas fa-shield-halved"></i></div>
                    <div class="settings-row-text"><div class="settings-row-label">Datenschutzerklärung</div></div>
                    <a class="settings-row-action" href="datenschutz.html" target="_blank" rel="noopener"><i class="fas fa-chevron-right"></i></a>
                </div>
            </div>

            <p class="settings-app-version">OnePlan</p>
        `);

        document.getElementById('settings-theme-toggle')?.addEventListener('change', () => this.toggleTheme());
        document.getElementById('settings-grade-toggle')?.addEventListener('change', () => App.toggleGradeVisibility());
        document.getElementById('settings-push-toggle')?.addEventListener('change', async () => {
            await Push.toggle();
            this.renderSettingsModal();
        });
    }
};

// ===== Schul-Organizer App =====

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    setupMobileNav();
});

function setupMobileNav() {
    const moreBtn = document.getElementById('mobile-more-btn');
    const moreMenu = document.getElementById('mobile-more-menu');
    const closeMore = document.getElementById('close-more-menu');

    moreBtn.addEventListener('click', () => {
        moreMenu.classList.toggle('hidden');
    });
    closeMore.addEventListener('click', () => {
        moreMenu.classList.add('hidden');
    });

    document.querySelectorAll('.mobile-nav li[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.mobile-nav li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            App.navigateTo(item.dataset.section);
        });
    });

    document.querySelectorAll('.mobile-more-menu li[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.mobile-nav li').forEach(i => i.classList.remove('active'));
            App.navigateTo(item.dataset.section);
            moreMenu.classList.add('hidden');
        });
    });
}



const App = {
    // App state
    state: {
        currentSection: 'dashboard',
        currentMonth: new Date(),
        selectedRating: 0,
        homeworkFilter: 'all',
        previewAccent: null,
        previewFlame: null,
        previewCardDesign: null,
        previewTitleFont: null,
        collapsedCategories: {}
    },

    // Merkt sich für Badge- und Shop-Kategorien, ob sie ein-/ausgeklappt sind
    // (persistiert in localStorage, damit es nach einem Reload erhalten bleibt).
    loadCollapsedCategories() {
        try {
            this.state.collapsedCategories = JSON.parse(localStorage.getItem('oneplan-collapsed-categories')) || {};
        } catch (e) {
            this.state.collapsedCategories = {};
        }
    },

    isCategoryCollapsed(key) {
        return !!this.state.collapsedCategories[key];
    },

    toggleCategory(key) {
        this.state.collapsedCategories[key] = !this.state.collapsedCategories[key];
        localStorage.setItem('oneplan-collapsed-categories', JSON.stringify(this.state.collapsedCategories));
        const group = document.querySelector(`[data-category-key="${key}"]`);
        if (group) group.classList.toggle('collapsed', this.state.collapsedCategories[key]);
    },

    // Initialize the application
    async init() {
        this.loadCollapsedCategories();
        await this.loadAllData();
        this.setupNavigation();
        this.setupCalendar();
        this.setupTimetable();
        this.setupHomework();
        this.setupGrades();
        this.setupFeedback();
        this.setupFlashcards();
        this.setupPomodoro();
        this.setupProgress();
        this.setupShop();
        this.setupModal();
        this.renderDashboardGrid();
        this.checkReminders();
        Push.init();
        // Check reminders every minute
        setInterval(() => this.checkReminders(), 60000);

        // Wurde die App über einen Teilen-Link (?import=CODE) geöffnet?
        const importCode = new URLSearchParams(location.search).get('import');
        if (importCode) {
            this.openImportModal(importCode.toUpperCase());
            history.replaceState(null, '', location.pathname);
        }

        this.maybeShowOnboarding();
    },

    // ===== Erstes Login: Tutorial, danach Passwort-Empfehlung =====
    maybeShowOnboarding() {
        if (!this.settings) this.settings = {};
        if (this.settings.tutorialShown) {
            this.maybeShowPasswordHint();
            return;
        }
        this.settings.tutorialShown = true;
        this.saveData('settings', this.settings);

        setTimeout(() => this.startTutorial(() => this.maybeShowPasswordHint()), 600);
    },

    // ===== Passwort-Empfehlung beim ersten Login =====
    // Zeigt EINMALIG (kontogebunden über die Supabase-Settings, also auch
    // geräteübergreifend) den Hinweis, das Passwort zu ändern. Wird direkt
    // beim Anzeigen als "gezeigt" markiert, damit er garantiert nur beim
    // allerersten Login erscheint und danach nie wieder.
    maybeShowPasswordHint() {
        if (!this.settings) this.settings = {};
        if (this.settings.passwordHintShown) return;

        this.settings.passwordHintShown = true;
        this.saveData('settings', this.settings);

        // Kurze Verzögerung, damit erst das Dashboard sichtbar wird und das
        // Popup nicht mit dem Lade-Screen kollidiert.
        setTimeout(() => {
            this.showModal(`
                <h3><i class="fas fa-shield-halved"></i> Passwort ändern empfohlen</h3>
                <p style="margin-bottom: 16px; color: var(--text-secondary);">
                    Willkommen bei OnePlan! Aus Sicherheitsgründen empfehlen wir dir, dein Passwort jetzt zu ändern.
                </p>
                <button class="btn-primary btn-full" onclick="App.closeModal(); Auth.openChangePasswordModal();" style="margin-bottom: 8px;">
                    <i class="fas fa-key"></i> Passwort jetzt ändern
                </button>
                <button class="btn-secondary btn-full" onclick="App.closeModal()">
                    Später
                </button>
            `);
        }, 600);
    },

    // ===== Tutorial (Onboarding-Tour) =====
    // Läuft beim allerersten Login (kontogebunden, siehe maybeShowOnboarding)
    // einmalig durch die wichtigsten Bereiche der App. Kann jederzeit über
    // die Einstellungen erneut gestartet werden (dann ohne onFinish-Callback).
    tutorialSteps: [
        {
            icon: 'fa-hand-sparkles',
            title: 'Willkommen bei OnePlan! 🎉',
            titleReplay: 'Nochmal alles im Überblick',
            text: 'Schön, dass du da bist! Das ist deine allererste Anmeldung — bevor es losgeht, zeigen wir dir in ein paar kurzen Schritten, was OnePlan alles kann.',
            textReplay: 'Hier nochmal ein kompakter Rundgang durch die wichtigsten Bereiche von OnePlan.'
        },
        {
            icon: 'fa-calendar-alt',
            title: 'Kalender',
            text: 'Termine, Klassenarbeiten und Ereignisse landen alle im Kalender — auf einen Blick für die ganze Woche oder den ganzen Monat.'
        },
        {
            icon: 'fa-clock',
            title: 'Stundenplan',
            text: 'Trage deinen Stundenplan einmal ein und importiere ihn danach ganz einfach von Klassenkamerad:innen oder teile deinen eigenen.'
        },
        {
            icon: 'fa-book',
            title: 'Hausaufgaben',
            text: 'Offene Aufgaben eintragen, abhaken und bei Bedarf mit der Klasse teilen — nichts geht mehr unter.'
        },
        {
            icon: 'fa-calculator',
            title: 'Notenrechner',
            text: 'Noten eintragen und den Durchschnitt automatisch berechnen lassen, inklusive Gewichtung.'
        },
        {
            icon: 'fa-layer-group',
            title: 'Karteikarten',
            text: 'Lerne mit dem Leitner-System: OnePlan merkt sich, welche Karten du kannst, und zeigt dir automatisch, was gerade fällig ist.'
        },
        {
            icon: 'fa-stopwatch',
            title: 'Pomodoro-Timer',
            text: 'Konzentriert lernen mit Fokus-Phasen und eingebauten Pausen.'
        },
        {
            icon: 'fa-robot',
            title: 'KI-Assistent',
            text: 'Hängst du bei den Hausaufgaben fest? Der KI-Assistent hilft dir direkt in der App weiter.'
        },
        {
            icon: 'fa-fire',
            title: 'Fortschritt & Punkte-Shop',
            text: 'Für erledigte Aufgaben gibt es XP und Coins. Im Punkte-Shop tauschst du sie gegen neue Farben und Icons ein.'
        },
        {
            icon: 'fa-comments',
            title: 'Feedback',
            text: 'Wünsche, Ideen oder Bugs? Über den Feedback-Bereich erreichst du uns direkt aus der App.'
        }
    ],
    tutorialStepIndex: 0,
    tutorialOnFinish: null,
    tutorialFirstOpen: false,

    startTutorial(onFinish) {
        this.tutorialStepIndex = 0;
        this.tutorialOnFinish = onFinish || null;
        // Nur der Aufruf beim allerersten Login übergibt einen onFinish-Callback
        // (siehe maybeShowOnboarding) — daran unterscheiden wir "echter erster
        // Start" von "über die Einstellungen erneut angesehen".
        this.tutorialFirstOpen = !!onFinish;
        this.renderTutorialStep();
    },

    renderTutorialStep() {
        const steps = this.tutorialSteps;
        const i = this.tutorialStepIndex;
        const step = steps[i];
        const isLast = i === steps.length - 1;
        const isFirst = i === 0;
        const progressPct = Math.round(((i + 1) / steps.length) * 100);
        const dots = steps.map((_, idx) => `<span class="tutorial-dot ${idx === i ? 'active' : idx < i ? 'done' : ''}"></span>`).join('');

        const title = (isFirst && !this.tutorialFirstOpen && step.titleReplay) ? step.titleReplay : step.title;
        const text = (isFirst && !this.tutorialFirstOpen && step.textReplay) ? step.textReplay : step.text;

        this.showModal(`
            <div class="tutorial">
                <div class="tutorial-progress-track"><div class="tutorial-progress-fill" style="width:${progressPct}%;"></div></div>
                <div class="tutorial-step-label">Schritt ${i + 1} von ${steps.length}</div>
                <div class="tutorial-icon"><i class="fas ${step.icon}"></i></div>
                <h3>${title}</h3>
                <p class="tutorial-text">${text}</p>
                <div class="tutorial-dots">${dots}</div>
                <div class="tutorial-actions">
                    ${isFirst
                        ? `<button class="btn-secondary" onclick="App.skipTutorial()">Überspringen</button>`
                        : `<button class="btn-secondary" onclick="App.tutorialPrev()"><i class="fas fa-arrow-left"></i> Zurück</button>`}
                    <button class="btn-primary" onclick="App.${isLast ? 'finishTutorial' : 'tutorialNext'}()">
                        ${isLast ? 'Los geht\'s! <i class="fas fa-check"></i>' : 'Weiter <i class="fas fa-arrow-right"></i>'}
                    </button>
                </div>
            </div>
        `);
    },

    tutorialNext() {
        if (this.tutorialStepIndex < this.tutorialSteps.length - 1) {
            this.tutorialStepIndex++;
            this.renderTutorialStep();
        }
    },

    tutorialPrev() {
        if (this.tutorialStepIndex > 0) {
            this.tutorialStepIndex--;
            this.renderTutorialStep();
        }
    },

    skipTutorial() {
        this.closeModal();
        this.afterTutorialClosed();
    },

    finishTutorial() {
        this.closeModal();
        this.afterTutorialClosed();
    },

    afterTutorialClosed() {
        if (this.tutorialOnFinish) {
            const cb = this.tutorialOnFinish;
            this.tutorialOnFinish = null;
            setTimeout(cb, 400);
        }
    },

    // ===== Data Management =====
    async loadAllData() {
        const keys = ['events', 'timetable', 'homework', 'grades', 'progress'];
        const { data, error } = await supabase
            .from('user_data')
            .select('data_key, data_value')
            .eq('user_id', this.userId);

        const map = {};
        if (data) data.forEach(row => { map[row.data_key] = row.data_value; });

        this.events = map['events'] || [];
        this.timetable = map['timetable'] || this.getEmptyTimetable();
        this.homework = map['homework'] || [];
        this.grades = map['grades'] || [];
        this.feedback = []; // now global via feedback_global table
        // Migration: ältere Karten ohne Leitner-Felder bekommen Box 1 und sind sofort fällig
        this.flashcards = (map['flashcards'] || []).map(c => ({
            ...c,
            box: c.box || 1,
            due: c.due || this.todayStr()
        }));
        this.progress = map['progress'] || { xp: 0, coins: 0, streak: 0, lastActiveDate: null, totalActions: 0, badges: [], streakFreezes: 0, stats: { homework: 0, cards: 0, pomodoro: 0, grades: 0 } };
        if (!this.progress.stats) this.progress.stats = { homework: 0, cards: 0, pomodoro: 0, grades: 0 };
        if (this.progress.streakFreezes === undefined) this.progress.streakFreezes = 0;
        if (this.progress.coins === undefined) this.progress.coins = 0;
        this.checkStreakExpiry();
        this.shop = map['shop'] || { unlockedAccents: ['default'], activeAccent: 'default', unlockedLevelUpIcons: ['star'], activeLevelUpIcon: 'star', unlockedFlames: ['classic'], activeFlame: 'classic', unlockedCardDesigns: ['classic'], activeCardDesign: 'classic', unlockedTitleFonts: ['default'], activeTitleFont: 'default', history: [] };
        if (!this.shop.unlockedAccents || !this.shop.unlockedAccents.length) this.shop.unlockedAccents = ['default'];
        if (!this.shop.unlockedAccents.includes('default')) this.shop.unlockedAccents.push('default');
        if (!this.shop.activeAccent) this.shop.activeAccent = 'default';
        if (!this.shop.unlockedLevelUpIcons || !this.shop.unlockedLevelUpIcons.length) this.shop.unlockedLevelUpIcons = ['star'];
        if (!this.shop.unlockedLevelUpIcons.includes('star')) this.shop.unlockedLevelUpIcons.push('star');
        if (!this.shop.activeLevelUpIcon) this.shop.activeLevelUpIcon = 'star';
        if (!this.shop.unlockedFlames || !this.shop.unlockedFlames.length) this.shop.unlockedFlames = ['classic'];
        if (!this.shop.unlockedFlames.includes('classic')) this.shop.unlockedFlames.push('classic');
        if (!this.shop.activeFlame) this.shop.activeFlame = 'classic';
        if (!this.shop.unlockedCardDesigns || !this.shop.unlockedCardDesigns.length) this.shop.unlockedCardDesigns = ['classic'];
        if (!this.shop.unlockedCardDesigns.includes('classic')) this.shop.unlockedCardDesigns.push('classic');
        if (!this.shop.activeCardDesign) this.shop.activeCardDesign = 'classic';
        if (!this.shop.unlockedTitleFonts || !this.shop.unlockedTitleFonts.length) this.shop.unlockedTitleFonts = ['default'];
        if (!this.shop.unlockedTitleFonts.includes('default')) this.shop.unlockedTitleFonts.push('default');
        if (!this.shop.activeTitleFont) this.shop.activeTitleFont = 'default';
        if (!this.shop.history) this.shop.history = [];
        this.applyAccent(this.shop.activeAccent);
        this.applyFlame(this.shop.activeFlame);
        this.applyCardDesign(this.shop.activeCardDesign);
        this.applyTitleFont(this.shop.activeTitleFont);
        this.settings = map['settings'] || { hideGradeAverage: false };
        if (!this.settings.dashboardWidgets) this.settings.dashboardWidgets = this.getDashboardWidgetOrder();
    },

    async saveData(key, data) {
        await supabase.from('user_data').upsert({
            user_id: this.userId,
            data_key: key,
            data_value: data,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,data_key' });
    },

    getEmptyTimetable() {
        const timetable = [];
        for (let i = 0; i < 10; i++) {
            timetable.push([
                { subject: '', teacher: '', room: '', color: '' },
                { subject: '', teacher: '', room: '', color: '' },
                { subject: '', teacher: '', room: '', color: '' },
                { subject: '', teacher: '', room: '', color: '' },
                { subject: '', teacher: '', room: '', color: '' }
            ]);
        }
        return timetable;
    },

    // ===== Leitner-System =====
    // Box 1 = neu/falsch beantwortet, Box 5 = gemeistert.
    // Wert = Anzahl Tage bis zur nächsten Wiederholung nach richtiger Antwort.
    leitnerIntervals: { 1: 1, 2: 2, 3: 4, 4: 9, 5: 14 },

    todayStr() {
        return new Date().toISOString().slice(0, 10);
    },

    addDays(dateStr, days) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    },

    // ===== Sharing: Code-Generierung =====
    // Ohne mehrdeutige Zeichen (0/O, 1/I) für bessere Lesbarkeit beim Abtippen
    generateShareCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },

    // Feste Vorschlagsfarben für den Fach-Farbwähler
    subjectColorPresets: [
        '#15803d', '#16a34a', '#65a30d', '#84cc16',
        '#2563eb', '#0891b2', '#0d9488', '#06b6d4',
        '#dc2626', '#ea580c', '#d97706', '#f59e0b',
        '#7c3aed', '#9333ea', '#a21caf', '#c026d3',
        '#db2777', '#e11d48', '#4f46e5', '#6366f1',
        '#0369a1', '#1d4ed8', '#525252', '#78716c'
    ],

    // ===== Navigation =====
    setupNavigation() {
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.navigateTo(section);
            });
        });
    },

    navigateTo(section) {
        // Vorschauen beenden, wenn der Shop verlassen wird
        if (this.state.currentSection === 'shop' && section !== 'shop') {
            if (this.state.previewAccent) this.stopAccentPreview(true);
            if (this.state.previewFlame) this.stopFlamePreview(true);
            if (this.state.previewCardDesign) this.stopCardDesignPreview(true);
            if (this.state.previewTitleFont) this.stopTitleFontPreview(true);
        }

        document.querySelectorAll('.nav-links li').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });
        this.state.currentSection = section;
        
        // Refresh section data
        switch(section) {
            case 'dashboard': this.renderDashboardGrid(); break;
            case 'kalender': this.renderCalendar(); break;
            case 'stundenplan': this.renderTimetable(); break;
            case 'hausaufgaben': this.renderHomework(); break;
            case 'noten': this.renderGrades(); break;
            case 'feedback': if (this.isAdmin()) this.loadAdminFeedback(); break;
            case 'karteikarten': this.renderFlashcardDecks(); break;
            case 'fortschritt': this.renderProgress(); break;
            case 'shop': this.renderShop(); break;
        }
    },

    // ===== Calendar =====
    setupCalendar() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.state.currentMonth.setMonth(this.state.currentMonth.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.state.currentMonth.setMonth(this.state.currentMonth.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('add-event').addEventListener('click', () => this.addEvent());

        this.renderCalendar();
        this.renderEventList();
    },

    // Gibt den Ferieneintrag zurück, in den das übergebene Datum (YYYY-MM-DD) fällt, sonst null.
    getFerienForDate(dateStr) {
        return FERIEN_SH.find(f => dateStr >= f.start && dateStr <= f.end) || null;
    },

    // Liefert die aktuell laufenden Ferien (falls heute Ferien sind) oder die nächsten bevorstehenden.
    getCurrentOrNextFerien() {
        const today = this.todayStr();
        const current = this.getFerienForDate(today);
        if (current) return { ...current, running: true };
        const next = FERIEN_SH
            .filter(f => f.start >= today)
            .sort((a, b) => a.start.localeCompare(b.start))[0];
        return next ? { ...next, running: false } : null;
    },

    renderCalendar() {
        const year = this.state.currentMonth.getFullYear();
        const month = this.state.currentMonth.getMonth();
        
        const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                           'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
        
        const daysContainer = document.getElementById('calendar-days');
        daysContainer.innerHTML = '';
        
        // Previous month days
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = prevMonthDays - i;
            daysContainer.appendChild(day);
        }
        
        // Current month days
        const today = new Date();
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = i;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year) {
                day.classList.add('today');
            }
            
            if (this.events.some(e => e.date === dateStr)) {
                day.classList.add('has-event');
            }

            const ferien = this.getFerienForDate(dateStr);
            if (ferien) {
                day.classList.add('is-ferien');
                day.title = ferien.name;
            }
            
            day.addEventListener('click', () => {
                document.getElementById('event-date').value = dateStr;
            });
            
            daysContainer.appendChild(day);
        }
        
        // Next month days
        const totalCells = startDay + lastDay.getDate();
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = i;
            daysContainer.appendChild(day);
        }

        this.renderFerienInfo();
    },

    // Zeigt oberhalb des Kalenders an, ob gerade Ferien laufen oder wann die nächsten beginnen (SH).
    renderFerienInfo() {
        const el = document.getElementById('ferien-info');
        if (!el) return;

        const f = this.getCurrentOrNextFerien();
        if (!f) {
            el.innerHTML = '';
            return;
        }

        const fmt = (iso) => this.formatDate(iso);
        if (f.running) {
            el.innerHTML = `<i class="fas fa-umbrella-beach"></i> Aktuell ${f.name} (bis ${fmt(f.end)})`;
        } else {
            el.innerHTML = `<i class="fas fa-umbrella-beach"></i> Nächste Ferien: ${f.name}, ${fmt(f.start)} – ${fmt(f.end)}`;
        }
    },

    addEvent() {
        const title = document.getElementById('event-title').value.trim();
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const reminder = parseInt(document.getElementById('event-reminder').value);
        const description = document.getElementById('event-description').value.trim();

        if (!title || !date) {
            this.showNotification('Bitte Titel und Datum eingeben', 'error');
            return;
        }

        const event = {
            id: Date.now(),
            title,
            date,
            time,
            reminder,
            description,
            reminded: false
        };

        this.events.push(event);
        this.saveData('events', this.events);
        
        // Clear form
        document.getElementById('event-title').value = '';
        document.getElementById('event-date').value = '';
        document.getElementById('event-time').value = '';
        document.getElementById('event-reminder').value = '0';
        document.getElementById('event-description').value = '';

        this.renderCalendar();
        this.renderEventList();
        this.awardXP(5, 'Termin hinzugefügt', 'events');
        this.showNotification('Termin hinzugefügt', 'success');
    },

    renderEventList() {
        const container = document.getElementById('event-list');
        const upcoming = this.events
            .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
            .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>Keine anstehenden Termine</p>
                </div>
            `;
            return;
        }

        const monthShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

        container.innerHTML = '<h3>Anstehende Termine</h3>' + upcoming.map(event => {
            const d = new Date(event.date);
            return `
            <div class="event-item">
                <div class="event-date-badge">
                    <div class="event-date-day">${d.getDate()}</div>
                    <div class="event-date-month">${monthShort[d.getMonth()]}</div>
                </div>
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <span>${this.formatDate(event.date)}${event.time ? ' um ' + event.time : ''}</span>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                </div>
                <button class="btn-small btn-danger" onclick="App.deleteEvent(${event.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        }).join('');
    },

    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveData('events', this.events);
        this.renderCalendar();
        this.renderEventList();
        this.showNotification('Termin gelöscht', 'success');
    },

    checkReminders() {
        const now = new Date();
        
        this.events.forEach(event => {
            if (event.reminder && !event.reminded && event.time) {
                const eventDateTime = new Date(event.date + 'T' + event.time);
                const reminderTime = new Date(eventDateTime.getTime() - event.reminder * 60000);
                
                if (now >= reminderTime && now < eventDateTime) {
                    this.showNotification(`Erinnerung: ${event.title} in ${event.reminder} Minuten`, 'warning');
                    event.reminded = true;
                    this.saveData('events', this.events);
                    
                    // Browser notification if supported
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Schul-Organizer Erinnerung', {
                            body: `${event.title} in ${event.reminder} Minuten`,
                            icon: '/favicon.ico'
                        });
                    }
                }
            }
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    // ===== Timetable =====
    setupTimetable() {
        const periodSelect = document.getElementById('edit-period');
        const periodEndSelect = document.getElementById('edit-period-end');
        for (let i = 1; i <= 10; i++) {
            periodSelect.innerHTML += `<option value="${i-1}">${i}. Stunde</option>`;
            periodEndSelect.innerHTML += `<option value="${i-1}">${i}. Stunde</option>`;
        }
        periodSelect.addEventListener('change', () => this.syncPeriodEndMin());

        document.getElementById('edit-subject').addEventListener('input', (e) => {
            const existingColor = this.findExistingColorForSubject(e.target.value);
            if (existingColor) {
                document.getElementById('edit-color').value = existingColor;
            }
        });

        document.getElementById('save-timetable').addEventListener('click', () => this.saveTimetableEntry());

        // Vorschlagsfarben rendern
        const presetContainer = document.getElementById('color-presets');
        presetContainer.innerHTML = this.subjectColorPresets.map(c =>
            `<button type="button" class="color-preset" style="background:${c}" data-color="${c}" onclick="App.pickPresetColor('${c}')"></button>`
        ).join('');

        this.renderTimetable();
    },

    pickPresetColor(color) {
        document.getElementById('edit-color').value = color;
    },

    // Sucht die zuerst gefundene Farbe, die im Stundenplan bereits für dieses Fach verwendet wird
    findExistingColorForSubject(subject) {
        const key = subject.trim().toLowerCase();
        if (!key) return null;

        for (const row of this.timetable) {
            if (!row) continue;
            for (const cell of row) {
                if (cell && cell.subject && cell.subject.trim().toLowerCase() === key && cell.color) {
                    return cell.color;
                }
            }
        }
        return null;
    },

    // Färbt alle Stunden mit diesem Fach (egal an welchem Tag/Stunde) in derselben Farbe
    applyColorToSubject(subject, color) {
        const key = subject.trim().toLowerCase();
        if (!key) return;

        this.timetable.forEach(row => {
            if (!row) return;
            row.forEach(cell => {
                if (cell && cell.subject && cell.subject.trim().toLowerCase() === key) {
                    cell.color = color;
                }
            });
        });
    },

    syncPeriodEndMin() {
        const start = parseInt(document.getElementById('edit-period').value);
        const endSelect = document.getElementById('edit-period-end');
        if (parseInt(endSelect.value) < start) {
            endSelect.value = start;
        }
    },

    // Prüft, ob zwei Stundenplan-Zellen denselben (nicht-leeren) Inhalt haben
    timetableCellsMatch(a, b) {
        if (!a || !b) return false;
        if (!a.subject || !b.subject) return false;
        return a.subject === b.subject && a.teacher === b.teacher &&
               a.room === b.room && (a.color || '') === (b.color || '');
    },

    // Findet die zusammenhängende Stundenblock-Range (z.B. Doppelstunde), zu der `period` an `day` gehört
    getTimetableBlockRange(day, period) {
        const cell = (this.timetable[period] || [])[day];
        if (!cell || !cell.subject) return { start: period, end: period };

        let start = period;
        while (start > 0 && this.timetableCellsMatch(cell, (this.timetable[start - 1] || [])[day])) {
            start--;
        }
        let end = period;
        while (end < 7 && this.timetableCellsMatch(cell, (this.timetable[end + 1] || [])[day])) {
            end++;
        }
        return { start, end };
    },

    renderTimetable() {
        const tbody = document.getElementById('timetable-body');
        tbody.innerHTML = '';

        const periods = TIMETABLE_PERIODS.map(p => `<span class="period-num">${p.label}</span><span class="period-time">${p.start}-${p.end}</span>`);

        // skipRows[d] = wie viele kommende Zeilen für diesen Tag noch übersprungen werden müssen,
        // weil sie Teil einer Doppelstunden-Zelle (rowspan) weiter oben sind
        const skipRows = [0, 0, 0, 0, 0];

        for (let p = 0; p < 8; p++) {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${periods[p]}</strong></td>`;

            for (let d = 0; d < 5; d++) {
                if (skipRows[d] > 0) {
                    skipRows[d]--;
                    continue;
                }

                const cell = (this.timetable[p] || [])[d] || { subject: '', teacher: '', room: '', color: '' };
                const color = cell.color || '';
                const cellStyle = cell.subject && color ? `style="background:${color}22;border-left:4px solid ${color};"` : '';

                // Prüfen, ob diese Stunde der Beginn einer Doppel-/Mehrfachstunde ist
                let span = 1;
                if (cell.subject) {
                    let lookahead = p;
                    while (lookahead < 7 && this.timetableCellsMatch(cell, (this.timetable[lookahead + 1] || [])[d])) {
                        lookahead++;
                        span++;
                    }
                }
                skipRows[d] = span - 1;

                const rowspanAttr = span > 1 ? `rowspan="${span}"` : '';
                const cellClass = span > 1 ? 'timetable-cell-double' : '';

                row.innerHTML += `
                    <td onclick="App.editTimetableCell(${d}, ${p})" ${rowspanAttr} ${cellStyle}>
                        <div class="timetable-cell ${cellClass}">
                            ${cell.subject ? `
                                <div class="subject" ${color ? `style="color:${color};"` : ''}>${cell.subject}</div>
                                <div class="teacher">${cell.teacher}</div>
                                <div class="room">${cell.room}</div>
                            ` : '<span class="empty-slot">–</span>'}
                        </div>
                    </td>
                `;
            }

            tbody.appendChild(row);
        }
    },

    editTimetableCell(day, period) {
        const range = this.getTimetableBlockRange(day, period);

        document.getElementById('edit-day').value = day;
        document.getElementById('edit-period').value = range.start;
        document.getElementById('edit-period-end').value = range.end;

        const cell = (this.timetable[range.start] || [])[day] || { subject: '', teacher: '', room: '', color: '' };
        document.getElementById('edit-subject').value = cell.subject;
        document.getElementById('edit-teacher').value = cell.teacher;
        document.getElementById('edit-room').value = cell.room;
        document.getElementById('edit-color').value = cell.color || '#15803d';
    },

    saveTimetableEntry() {
        const day = parseInt(document.getElementById('edit-day').value);
        let start = parseInt(document.getElementById('edit-period').value);
        let end = parseInt(document.getElementById('edit-period-end').value);

        if (end < start) {
            [start, end] = [end, start];
        }

        const entry = {
            subject: document.getElementById('edit-subject').value.trim(),
            teacher: document.getElementById('edit-teacher').value.trim(),
            room: document.getElementById('edit-room').value.trim(),
            color: document.getElementById('edit-color').value
        };

        for (let p = start; p <= end; p++) {
            if (!this.timetable[p]) this.timetable[p] = [];
            this.timetable[p][day] = { ...entry };
        }

        // Alle Stunden mit demselben Fach (z.B. an anderen Tagen) bekommen automatisch dieselbe Farbe
        if (entry.subject) {
            this.applyColorToSubject(entry.subject, entry.color);
        }

        this.saveData('timetable', this.timetable);
        this.renderTimetable();

        // Clear form
        document.getElementById('edit-subject').value = '';
        document.getElementById('edit-teacher').value = '';
        document.getElementById('edit-room').value = '';
        document.getElementById('edit-color').value = '#15803d';
        document.getElementById('edit-period-end').value = document.getElementById('edit-period').value;

        const message = end > start ? `Doppelstunde (${start + 1}.–${end + 1}. Stunde) aktualisiert` : 'Stundenplan aktualisiert';
        this.awardXP(3, 'Stundenplan aktualisiert', 'timetable');
        this.showNotification(message, 'success');
    },

    // ===== Homework =====
    setupHomework() {
        document.getElementById('add-homework').addEventListener('click', () => this.addHomework());
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.homeworkFilter = btn.dataset.filter;
                this.renderHomework();
            });
        });

        this.renderHomework();
    },

    addHomework() {
        const subject = document.getElementById('hw-subject').value.trim();
        const task = document.getElementById('hw-task').value.trim();
        const due = document.getElementById('hw-due').value;
        const priority = document.getElementById('hw-priority').value;

        if (!subject || !task || !due) {
            this.showNotification('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        const homework = {
            id: Date.now(),
            subject,
            task,
            due,
            priority,
            done: false,
            createdAt: new Date().toISOString()
        };

        this.homework.push(homework);
        this.saveData('homework', this.homework);

        // Clear form
        document.getElementById('hw-subject').value = '';
        document.getElementById('hw-task').value = '';
        document.getElementById('hw-due').value = '';
        document.getElementById('hw-priority').value = 'low';

        this.renderHomework();
        this.showNotification('Hausaufgabe hinzugefügt', 'success');
    },

    renderHomework() {
        const container = document.getElementById('homework-list');
        let filtered = [...this.homework];

        if (this.state.homeworkFilter === 'pending') {
            filtered = filtered.filter(h => !h.done);
        } else if (this.state.homeworkFilter === 'done') {
            filtered = filtered.filter(h => h.done);
        }

        filtered.sort((a, b) => new Date(a.due) - new Date(b.due));

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>Keine Hausaufgaben</p>
                </div>
            `;
            return;
        }

        const priorityLabels = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };

        container.innerHTML = filtered.map(hw => `
            <div class="homework-item ${hw.done ? 'done' : ''} priority-${hw.priority}">
                <div class="homework-item-main">
                    <div class="homework-avatar">${hw.subject.charAt(0).toUpperCase()}</div>
                    <div class="homework-info">
                        <div class="homework-info-top">
                            <h4>${hw.subject}</h4>
                            <span class="priority-badge priority-badge-${hw.priority}">${priorityLabels[hw.priority]}</span>
                        </div>
                        <p>${hw.task}</p>
                        <span class="due-date">
                            <i class="fas fa-clock"></i> Fällig: ${this.formatDate(hw.due)}
                        </span>
                    </div>
                </div>
                <div class="homework-actions">
                    <button class="btn-small btn-success" onclick="App.toggleHomework(${hw.id})">
                        <i class="fas fa-${hw.done ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="App.deleteHomework(${hw.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    toggleHomework(id) {
        const hw = this.homework.find(h => h.id === id);
        if (hw) {
            hw.done = !hw.done;
            this.saveData('homework', this.homework);
            this.renderHomework();
            if (hw.done) this.awardXP(10, 'Hausaufgabe erledigt', 'homework');
        }
    },

    deleteHomework(id) {
        this.homework = this.homework.filter(h => h.id !== id);
        this.saveData('homework', this.homework);
        this.renderHomework();
        this.showNotification('Hausaufgabe gelöscht', 'success');
    },

    // ===== Grades =====
    setupGrades() {
        this.state.gradeSystem = '1-6'; // default

        document.querySelectorAll('#grade-system-toggle .grade-system-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#grade-system-toggle .grade-system-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.gradeSystem = btn.dataset.system;
                const input = document.getElementById('grade-value');
                if (this.state.gradeSystem === '1-6') {
                    input.placeholder = 'Note (1–6)';
                    input.min = 1; input.max = 6; input.step = 0.5;
                } else {
                    input.placeholder = 'Punkte (1–15)';
                    input.min = 1; input.max = 15; input.step = 1;
                }
                input.value = '';
            });
        });

        document.getElementById('add-grade').addEventListener('click', () => this.addGrade());
        this.setupGradeGoal();
        this.renderGrades();
    },

    // ===== Notenziel-Rechner =====
    setupGradeGoal() {
        this.state.goalSystem = '1-6'; // default

        document.querySelectorAll('#goal-system-toggle .grade-system-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#goal-system-toggle .grade-system-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.goalSystem = btn.dataset.system;
                const input = document.getElementById('goal-target');
                const current = parseFloat(input.value);
                if (this.state.goalSystem === '1-6') {
                    input.step = 0.1;
                    if (!isNaN(current) && current > 6) input.value = '';
                } else {
                    input.step = 1;
                    if (!isNaN(current) && current <= 6) input.value = '';
                }
                this.calculateGradeGoal();
            });
        });

        document.getElementById('goal-subject').addEventListener('change', () => this.calculateGradeGoal());
        document.getElementById('goal-target').addEventListener('input', () => this.calculateGradeGoal());
        document.getElementById('goal-weight').addEventListener('input', () => this.calculateGradeGoal());
        document.getElementById('goal-calc-btn').addEventListener('click', () => this.calculateGradeGoal());

        this.populateGoalSubjects();
    },

    // Continuous grade<->points conversion, shared with the overview cards
    gradeToPointsDecimal(g) {
        return Math.max(1, Math.min(15, 15 - ((g - 1) / 5) * 14));
    },

    populateGoalSubjects() {
        const select = document.getElementById('goal-subject');
        if (!select) return;
        const previous = select.value;
        const subjects = [...new Set(this.grades.map(g => g.subject))].sort((a, b) => a.localeCompare(b, 'de'));

        if (subjects.length === 0) {
            select.innerHTML = '<option value="">Erst Noten eintragen</option>';
            select.disabled = true;
        } else {
            select.disabled = false;
            select.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
            if (subjects.includes(previous)) select.value = previous;
        }

        this.calculateGradeGoal();
    },

    // Weighted average (1-6 scale) of all grades for one subject
    subjectAverage(subject) {
        const subjectGrades = this.grades.filter(g => g.subject === subject);
        if (subjectGrades.length === 0) return null;

        let weightedSum = 0;
        let totalWeight = 0;
        subjectGrades.forEach(g => {
            const normalized = g.system === '1-15' ? this.pointsToGrade(g.value) : g.value;
            weightedSum += normalized * g.weight;
            totalWeight += g.weight;
        });
        return weightedSum / totalWeight;
    },

    calculateGradeGoal() {
        const subject = document.getElementById('goal-subject').value;
        const system = this.state.goalSystem || '1-6';
        const targetRaw = parseFloat(document.getElementById('goal-target').value);
        const weightRaw = parseFloat(document.getElementById('goal-weight').value);

        const currentOut = document.getElementById('goal-current-out');
        const targetOut = document.getElementById('goal-target-out');
        const badge = document.getElementById('goal-badge');
        const badgeMain = document.getElementById('goal-badge-main');
        const badgeSub = document.getElementById('goal-badge-sub');

        const currentAvg = subject ? this.subjectAverage(subject) : null;

        if (!subject || currentAvg === null || isNaN(targetRaw) || isNaN(weightRaw)) {
            currentOut.textContent = currentAvg !== null ? currentAvg.toFixed(2) : '–';
            targetOut.textContent = '–';
            badge.classList.remove('warning', 'danger');
            badgeMain.textContent = 'Note –';
            badgeSub.textContent = !subject
                ? 'Fach wählen und berechnen'
                : currentAvg === null
                    ? `Noch keine Noten für ${subject}`
                    : 'Zielschnitt und Gewichtung eingeben';
            return;
        }

        const weight = Math.min(100, Math.max(1, weightRaw));

        currentOut.textContent = currentAvg.toFixed(2);

        const targetGrade = system === '1-6' ? targetRaw : this.pointsToGrade(targetRaw);
        targetOut.textContent = system === '1-6' ? targetGrade.toFixed(2) : `${targetRaw.toFixed(1)} Pkt.`;

        let neededGrade = (targetGrade * 100 - currentAvg * (100 - weight)) / weight;
        neededGrade = Math.max(1, Math.min(6, neededGrade));
        const neededPoints = this.gradeToPointsDecimal(neededGrade);

        badge.classList.remove('warning', 'danger');
        if (neededGrade > 3.5) badge.classList.add('danger');
        else if (neededGrade > 2) badge.classList.add('warning');

        badgeMain.textContent = `Note ${neededGrade.toFixed(1)}`;
        badgeSub.textContent = `≈ ${neededPoints.toFixed(1)} Punkte – nächste Arbeit`;
    },

    addGrade() {
        const subject = document.getElementById('grade-subject').value.trim();
        const type = document.getElementById('grade-type').value;
        const value = parseFloat(document.getElementById('grade-value').value);
        const weight = parseInt(document.getElementById('grade-weight').value) || 100;
        const description = document.getElementById('grade-description').value.trim();
        const system = this.state.gradeSystem || '1-6';

        const max = system === '1-15' ? 15 : 6;
        if (!subject || isNaN(value) || value < 1 || value > max) {
            this.showNotification(`Bitte gültiges Fach und ${system === '1-15' ? 'Punkte (1–15)' : 'Note (1–6)'} eingeben`, 'error');
            return;
        }

        const grade = {
            id: Date.now(),
            subject,
            type,
            value,
            weight,
            description,
            system,
            createdAt: new Date().toISOString()
        };

        this.grades.push(grade);
        this.saveData('grades', this.grades);

        document.getElementById('grade-subject').value = '';
        document.getElementById('grade-value').value = '';
        document.getElementById('grade-weight').value = '100';
        document.getElementById('grade-description').value = '';

        this.renderGrades();
        this.populateGoalSubjects();
        this.showNotification('Note hinzugefügt', 'success');
        this.awardXP(5, 'Note eingetragen', 'grades');
    },

    // Converts a 1-15 point to 1-6 grade for unified averaging
    pointsToGrade(points) {
        // Standard German conversion table
        if (points >= 15) return 1.0;
        if (points >= 13) return 1.0 + (15 - points) * 0.33;
        if (points >= 10) return 2.0 + (12 - points) * 0.33;
        if (points >= 7)  return 3.0 + (9 - points) * 0.33;
        if (points >= 4)  return 4.0 + (6 - points) * 0.33;
        if (points >= 1)  return 5.0 + (3 - points) * 0.33;
        return 6.0;
    },

    renderGrades() {
        const overviewContainer = document.getElementById('grades-overview');
        const listContainer = document.getElementById('grades-list');

        const subjects = {};
        this.grades.forEach(g => {
            if (!subjects[g.subject]) subjects[g.subject] = [];
            subjects[g.subject].push(g);
        });

        if (Object.keys(subjects).length === 0) {
            overviewContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Noch keine Noten eingetragen</p>
                </div>
            `;
            listContainer.innerHTML = '';
            return;
        }

        let overviewHTML = '<h3>Durchschnitt pro Fach</h3>';
        let totalAvg = 0;
        let subjectCount = 0;

        Object.entries(subjects).forEach(([subject, grades]) => {
            let weightedSum = 0;
            let totalWeight = 0;

            grades.forEach(g => {
                const normalized = g.system === '1-15' ? this.pointsToGrade(g.value) : g.value;
                weightedSum += normalized * g.weight;
                totalWeight += g.weight;
            });

            const avg = weightedSum / totalWeight;
            totalAvg += avg;
            subjectCount++;

            const barWidth = ((6 - avg) / 5) * 100;
            const avgColor = avg <= 2 ? 'var(--success-color)' : avg <= 3.5 ? 'var(--warning-color)' : 'var(--danger-color)';
            const barColor = avg <= 2 ? 'var(--success-color)' : avg <= 3.5 ? 'var(--warning-color)' : 'var(--danger-color)';
            const avgPoints = Math.max(1, Math.min(15, 15 - ((avg - 1) / 5) * 14));

            overviewHTML += `
                <div class="grade-subject-card">
                    <h4>
                        <span>${subject}</span>
                        <span class="average" style="color:${avgColor}">${avg.toFixed(2)} <span style="font-size:0.8rem;font-weight:400;color:var(--text-light)">/ ${avgPoints.toFixed(2)} Pkt.</span></span>
                    </h4>
                    <div class="grade-bar">
                        <div class="grade-bar-fill" style="width: ${barWidth}%; background: ${barColor};"></div>
                    </div>
                    <small>${grades.length} Note${grades.length !== 1 ? 'n' : ''}</small>
                </div>
            `;
        });

        const overallAvg = totalAvg / subjectCount;
        // Continuous grade→points conversion for decimal display
        const gradeToPointsDecimal = (g) => Math.max(1, Math.min(15, 15 - ((g - 1) / 5) * 14));
        const overallPoints = gradeToPointsDecimal(overallAvg);
        overviewHTML = `
            <div class="grade-subject-card" style="background: var(--primary-color); color: white;">
                <h4>
                    <span>Gesamtdurchschnitt</span>
                    <span class="average" style="color: white;">${overallAvg.toFixed(2)}</span>
                </h4>
                <div style="display:flex;gap:16px;margin-top:6px;font-size:0.85rem;opacity:0.9;">
                    <span>📊 Note: <strong>${overallAvg.toFixed(2)}</strong></span>
                    <span>🎯 Punkte: <strong>${overallPoints.toFixed(2)}</strong></span>
                </div>
            </div>
        ` + overviewHTML;

        overviewContainer.innerHTML = overviewHTML;

        const typeLabels = { written: 'Schriftlich', oral: 'Mündlich', other: 'Sonstige' };

        listContainer.innerHTML = '<h3>Alle Noten</h3>' + this.grades
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(g => {
                const is15 = g.system === '1-15';
                const displayVal = g.value;
                const normalized = is15 ? this.pointsToGrade(g.value) : g.value;
                const gradeClass = `grade-${Math.min(6, Math.max(1, Math.round(normalized)))}`;
                const badge = is15
                    ? `<span class="grade-system-badge points">Punkte</span>`
                    : `<span class="grade-system-badge noten">Note</span>`;

                return `
                    <div class="grade-item">
                        <div class="grade-value ${gradeClass}">${displayVal}</div>
                        <div class="grade-info">
                            <h4>${g.subject} ${badge}</h4>
                            <span>${typeLabels[g.type]} · ${g.weight}% Gewichtung</span>
                            ${is15 ? `<span style="font-size:0.8rem;color:var(--text-light)">≈ Note ${normalized.toFixed(1)}</span>` : ''}
                            ${g.description ? `<p>${g.description}</p>` : ''}
                        </div>
                        <button class="btn-small btn-danger" onclick="App.deleteGrade(${g.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');
    },

    deleteGrade(id) {
        this.grades = this.grades.filter(g => g.id !== id);
        this.saveData('grades', this.grades);
        this.renderGrades();
        this.populateGoalSubjects();
        this.showNotification('Note gelöscht', 'success');
    },

    // ===== Feedback =====
    // Set your Supabase user ID here to get admin access
    ADMIN_USER_ID: '2294dbf3-e62a-4eaf-b419-0b03cb30635f',

    isAdmin() {
        return this.userId === this.ADMIN_USER_ID;
    },

    setupFeedback() {
        // Star rating
        document.querySelectorAll('#star-rating i').forEach(star => {
            star.addEventListener('click', () => {
                this.state.selectedRating = parseInt(star.dataset.rating);
                this.updateStarRating();
            });
            star.addEventListener('mouseenter', () => {
                this.highlightStars(parseInt(star.dataset.rating));
            });
        });
        document.getElementById('star-rating').addEventListener('mouseleave', () => {
            this.updateStarRating();
        });
        document.getElementById('send-feedback').addEventListener('click', () => this.sendFeedback());

        if (this.isAdmin()) {
            document.getElementById('feedback-user-view').style.display = 'none';
            document.getElementById('feedback-admin-view').style.display = 'block';
            this.loadAdminFeedback();
        }
    },

    generateAdminPassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        let pw = '';
        for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
        document.getElementById('admin-new-password').value = pw;
    },

    async adminCreateAccount() {
        const name = document.getElementById('admin-new-name').value.trim();
        const username = document.getElementById('admin-new-username').value.trim().toLowerCase();
        const password = document.getElementById('admin-new-password').value;
        const resultEl = document.getElementById('admin-create-user-result');

        resultEl.innerHTML = '';

        if (!name || !username || !password) {
            resultEl.innerHTML = '<div class="auth-error" style="display:block;">Bitte alle Felder ausfüllen</div>';
            return;
        }
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            resultEl.innerHTML = '<div class="auth-error" style="display:block;">Benutzername: 3–20 Zeichen, nur a-z/0-9/_</div>';
            return;
        }

        this.setLoadingBtn('btn-admin-create-user', true);
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
            body: { name, username, password }
        });
        this.setLoadingBtn('btn-admin-create-user', false);

        if (error || data?.error) {
            resultEl.innerHTML = `<div class="auth-error" style="display:block;">${data?.error || error.message}</div>`;
            return;
        }

        resultEl.innerHTML = `
            <div class="auth-info" style="display:block;">
                <i class="fas fa-check-circle"></i> Konto erstellt für <strong>${username}</strong>.<br>
                Gib der Person diese Zugangsdaten weiter: Benutzername <strong>${username}</strong>, Passwort <strong>${password}</strong>.
            </div>
        `;
        document.getElementById('admin-new-name').value = '';
        document.getElementById('admin-new-username').value = '';
        document.getElementById('admin-new-password').value = '';
        this.showNotification('Konto erstellt', 'success');
    },

    // Kleiner generischer Loading-Helper für einzelne Buttons (analog zu Auth.setLoading)
    setLoadingBtn(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) {
            if (btn.dataset.idleHtml === undefined) btn.dataset.idleHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bitte warten...';
        } else {
            btn.disabled = false;
            if (btn.dataset.idleHtml !== undefined) btn.innerHTML = btn.dataset.idleHtml;
        }
    },

    highlightStars(rating) {
        document.querySelectorAll('#star-rating i').forEach(star => {
            star.classList.toggle('active', parseInt(star.dataset.rating) <= rating);
        });
    },

    updateStarRating() {
        this.highlightStars(this.state.selectedRating || 0);
    },

    async sendFeedback() {
        const type = document.getElementById('feedback-type').value;
        const message = document.getElementById('feedback-message').value.trim();
        const anonymous = document.getElementById('feedback-anonymous').checked;

        if (!message) {
            this.showNotification('Bitte eine Nachricht eingeben', 'error');
            return;
        }

        const btn = document.getElementById('send-feedback');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Senden...';

        const profile = Auth.currentUser;
        const senderName = anonymous ? 'Anonym' : (profile?.name || profile?.username || profile?.email || 'Unbekannt');

        const { error } = await supabase.from('feedback_global').insert({
            type,
            rating: this.state.selectedRating || null,
            message,
            anonymous,
            sender_name: senderName,
            sender_id: anonymous ? null : this.userId,
            created_at: new Date().toISOString()
        });

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Feedback senden';

        if (error) {
            this.showNotification('Fehler beim Senden: ' + error.message, 'error');
            return;
        }

        document.getElementById('feedback-message').value = '';
        document.getElementById('feedback-anonymous').checked = false;
        document.getElementById('feedback-type').value = 'suggestion';
        this.state.selectedRating = 0;
        this.updateStarRating();

        const confirm = document.getElementById('feedback-sent-confirm');
        confirm.style.display = 'block';
        setTimeout(() => confirm.style.display = 'none', 4000);
    },

    async loadAdminFeedback() {
        const list = document.getElementById('feedback-admin-list');
        list.innerHTML = '<p style="color:var(--text-secondary);padding:20px 0;">Lade Feedbacks...</p>';

        const { data, error } = await supabase
            .from('feedback_global')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            list.innerHTML = '<p style="color:var(--danger-color);">Fehler: ' + error.message + '</p>';
            return;
        }

        this._adminFeedbacks = data || [];
        this.renderAdminFeedback();
    },

    renderAdminFeedback() {
        const list = document.getElementById('feedback-admin-list');
        const stats = document.getElementById('feedback-admin-stats');
        const filter = document.getElementById('feedback-admin-filter')?.value || 'all';
        const all = this._adminFeedbacks || [];

        // Stats
        const total = all.length;
        const avgRating = all.filter(f => f.rating).reduce((s, f) => s + f.rating, 0) / (all.filter(f => f.rating).length || 1);
        const byType = { bug: 0, suggestion: 0, praise: 0, other: 0 };
        all.forEach(f => { if (byType[f.type] !== undefined) byType[f.type]++; });

        stats.innerHTML = `
            <div class="feedback-stat-row">
                <div class="feedback-stat"><div class="fs-icon"><i class="fas fa-inbox"></i></div><div class="fs-num">${total}</div><div class="fs-label">Gesamt</div></div>
                <div class="feedback-stat"><div class="fs-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b;"><i class="fas fa-star"></i></div><div class="fs-num">${avgRating.toFixed(1)}</div><div class="fs-label">Ø Bewertung</div></div>
                <div class="feedback-stat"><div class="fs-icon" style="background:rgba(239,68,68,0.12);color:#ef4444;"><i class="fas fa-bug"></i></div><div class="fs-num">${byType.bug}</div><div class="fs-label">Fehler</div></div>
                <div class="feedback-stat"><div class="fs-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6;"><i class="fas fa-lightbulb"></i></div><div class="fs-num">${byType.suggestion}</div><div class="fs-label">Vorschläge</div></div>
                <div class="feedback-stat"><div class="fs-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b;"><i class="fas fa-heart"></i></div><div class="fs-num">${byType.praise}</div><div class="fs-label">Lob</div></div>
            </div>`;

        const filtered = filter === 'all' ? all : all.filter(f => f.type === filter);

        if (filtered.length === 0) {
            list.innerHTML = '<p style="color:var(--text-secondary);padding:20px 0;">Keine Feedbacks in dieser Kategorie.</p>';
            return;
        }

        const typeLabels = { bug: '🐛 Fehler', suggestion: '💡 Vorschlag', praise: '⭐ Lob', other: '💬 Sonstiges' };
        const typeColors = { bug: '#ef4444', suggestion: '#3b82f6', praise: '#f59e0b', other: '#8b5cf6' };

        list.innerHTML = filtered.map(fb => `
            <div class="feedback-admin-item" style="border-left-color:${typeColors[fb.type] || '#94a3b8'};">
                <div class="feedback-admin-item-header">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <span class="fb-type-badge" style="background:${typeColors[fb.type]}20;color:${typeColors[fb.type]};">${typeLabels[fb.type] || fb.type}</span>
                        <span class="fb-sender"><i class="fas fa-user"></i> ${fb.anonymous ? '<em>Anonym</em>' : (fb.sender_name || 'Unbekannt')}</span>
                        ${fb.rating ? `<span class="fb-stars">${'★'.repeat(fb.rating)}${'☆'.repeat(5-fb.rating)}</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <small style="color:var(--text-secondary);">${new Date(fb.created_at).toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</small>
                        <button class="btn-small btn-danger" onclick="App.deleteAdminFeedback('${fb.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="fb-message">${fb.message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
            </div>
        `).join('');
    },

    async deleteAdminFeedback(id) {
        if (!confirm('Feedback löschen?')) return;
        const { error } = await supabase.from('feedback_global').delete().eq('id', id);
        if (!error) {
            this._adminFeedbacks = this._adminFeedbacks.filter(f => f.id !== id);
            this.renderAdminFeedback();
            this.showNotification('Feedback gelöscht', 'success');
        }
    },

    // ===== Dashboard: Personalisierung (Reihenfolge & Sichtbarkeit) =====
    // Registry aller verfügbaren Dashboard-Widgets. `bodyId` ist die ID des
    // Inhalts-Containers, den updateDashboard()/renderNextLesson() befüllen.
    dashboardWidgetDefs: {
        events: { label: 'Anstehende Termine', icon: 'fa-bell', bodyId: 'upcoming-events' },
        homework: { label: 'Offene Hausaufgaben', icon: 'fa-tasks', bodyId: 'pending-homework' },
        streak: { label: 'Streak', icon: 'fa-fire', bodyId: 'dashboard-streak', cardClass: 'dashboard-streak-card' },
        nextLesson: { label: 'Nächste Stunde', icon: 'fa-clock', bodyId: 'dashboard-next-lesson' },
        grades: {
            label: 'Notendurchschnitt', icon: 'fa-chart-line', bodyId: 'grade-overview',
            headerExtra: '<button class="grade-visibility-toggle" onclick="App.toggleGradeVisibility()" title="Notendurchschnitt anzeigen/verbergen"><i class="fas fa-eye" id="grade-visibility-icon"></i></button>'
        },
        ferien: { label: 'Nächste Ferien', icon: 'fa-umbrella-beach', bodyId: 'dashboard-ferien' },
        level: { label: 'Level & Fortschritt', icon: 'fa-star', bodyId: 'dashboard-level' },
        gradeTrend: { label: 'Notentrend', icon: 'fa-chart-bar', bodyId: 'dashboard-grade-trend' },
        topHomeworkSubject: { label: 'Meiste Hausaufgaben', icon: 'fa-book-open', bodyId: 'dashboard-top-hw-subject' },
        weekPreview: { label: 'Wochenvorschau', icon: 'fa-calendar-week', bodyId: 'dashboard-week-preview' },
        activityStats: { label: 'Aktivität gesamt', icon: 'fa-chart-pie', bodyId: 'dashboard-activity-stats' },
        fcDue: { label: 'Fällige Karteikarten', icon: 'fa-layer-group', bodyId: 'dashboard-fc-due' },
        todaySchedule: { label: 'Stundenplan heute', icon: 'fa-list-ol', bodyId: 'dashboard-today-schedule' }
    },

    // Liefert die gespeicherte Reihenfolge/Sichtbarkeit, bereinigt um nicht mehr
    // existierende Widgets und ergänzt um neue Widgets (z.B. nach App-Updates),
    // die noch nicht in den gespeicherten Einstellungen vorkommen.
    getDashboardWidgetOrder() {
        const allIds = Object.keys(this.dashboardWidgetDefs);
        // Neu hinzukommende Widgets sind standardmäßig aus – nur diese drei Kern-Widgets
        // sind von Anfang an sichtbar. Alles andere muss der Nutzer bewusst einschalten.
        const defaultOnIds = ['nextLesson', 'events', 'homework'];
        const stored = ((this.settings && this.settings.dashboardWidgets) || [])
            .filter(w => allIds.includes(w.id));
        const missing = allIds.filter(id => !stored.some(w => w.id === id));
        return [...stored, ...missing.map(id => ({ id, visible: defaultOnIds.includes(id) }))];
    },

    // Baut das Dashboard-Grid entsprechend der aktuellen Reihenfolge/Sichtbarkeit
    // neu auf und füllt es anschließend mit Live-Daten.
    renderDashboardGrid() {
        const grid = document.getElementById('dashboard-grid');
        if (!grid) return;
        if (!this.settings) this.settings = {};

        const order = this.getDashboardWidgetOrder();
        this.settings.dashboardWidgets = order;

        const visible = order.filter(w => w.visible);
        grid.innerHTML = visible.length
            ? visible.map(w => {
                const def = this.dashboardWidgetDefs[w.id];
                if (!def) return '';
                const heading = def.headerExtra
                    ? `<h3 class="dashboard-card-header"><span><i class="fas ${def.icon}"></i> ${def.label}</span>${def.headerExtra}</h3>`
                    : `<h3><i class="fas ${def.icon}"></i> ${def.label}</h3>`;
                return `
                    <div class="dashboard-card ${def.cardClass || ''}">
                        ${heading}
                        <div id="${def.bodyId}"></div>
                    </div>
                `;
            }).join('')
            : `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center; padding: 40px 0;">
                   Alle Widgets sind ausgeblendet. Tippe oben auf „Anpassen“, um welche einzublenden.
               </p>`;

        this.updateDashboard();
    },

    // ===== Dashboard =====
    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];

        // Upcoming events
        const upcomingEventsEl = document.getElementById('upcoming-events');
        if (upcomingEventsEl) {
            const upcomingEvents = this.events
                .filter(e => e.date >= today)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5);

            upcomingEventsEl.innerHTML = upcomingEvents.length
                ? upcomingEvents.map(e => `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>${e.title}</strong><br>
                        <small>${this.formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</small>
                    </div>
                `).join('')
                : '<p style="color: var(--text-secondary);">Keine Termine</p>';
        }

        // Pending homework
        const pendingHomeworkEl = document.getElementById('pending-homework');
        if (pendingHomeworkEl) {
            const pendingHomework = this.homework
                .filter(h => !h.done && h.due >= today)
                .sort((a, b) => new Date(a.due) - new Date(b.due))
                .slice(0, 5);

            pendingHomeworkEl.innerHTML = pendingHomework.length
                ? pendingHomework.map(h => `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>${h.subject}</strong><br>
                        <small>${h.task.substring(0, 50)}${h.task.length > 50 ? '...' : ''}</small><br>
                        <small style="color: var(--warning-color);">Fällig: ${this.formatDate(h.due)}</small>
                    </div>
                `).join('')
                : '<p style="color: var(--text-secondary);">Alle Hausaufgaben erledigt! 🎉</p>';
        }

        // Grade overview
        const gradeOverviewEl = document.getElementById('grade-overview');
        const gradeHidden = !!this.settings?.hideGradeAverage;
        const visIcon = document.getElementById('grade-visibility-icon');
        if (visIcon) visIcon.className = `fas fa-eye${gradeHidden ? '-slash' : ''}`;

        if (gradeOverviewEl) {
            if (this.grades.length > 0) {
                const subjects = {};
                this.grades.forEach(g => {
                    if (!subjects[g.subject]) subjects[g.subject] = [];
                    subjects[g.subject].push(g);
                });

                let totalAvg = 0;
                let count = 0;
                Object.values(subjects).forEach(grades => {
                    let weightedSum = 0;
                    let totalWeight = 0;
                    grades.forEach(g => {
                        const normalized = g.system === '1-15' ? this.pointsToGrade(g.value) : g.value;
                        weightedSum += normalized * g.weight;
                        totalWeight += g.weight;
                    });
                    const avg = weightedSum / totalWeight;
                    totalAvg += avg;
                    count++;
                });

                gradeOverviewEl.innerHTML = `
                    <div style="text-align: center;">
                        <div class="grade-average-value ${gradeHidden ? 'grade-value-blurred' : ''}" style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);" onclick="App.toggleGradeVisibility()" title="${gradeHidden ? 'Zum Anzeigen tippen' : 'Zum Verbergen tippen'}">
                            ${(totalAvg / count).toFixed(2)}
                        </div>
                        <p>Gesamtdurchschnitt</p>
                        <small class="${gradeHidden ? 'grade-value-blurred' : ''}">${this.grades.length} Noten in ${count} Fächern</small>
                    </div>
                `;
            } else {
                gradeOverviewEl.innerHTML =
                    '<p style="color: var(--text-secondary);">Noch keine Noten</p>';
            }
        }

        // Streak
        this.checkStreakExpiry();
        const streakEl = document.getElementById('dashboard-streak');
        if (streakEl) {
            const streak = this.progress?.streak || 0;
            const streakActive = streak > 0 && this.isActiveToday();
            streakEl.innerHTML = `
                <div style="text-align: center;">
                    <div class="${streakActive ? 'streak-active' : ''}" style="font-size: 2.2rem; color: ${streakActive ? 'var(--flame-color)' : 'var(--text-light)'};">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--text-primary); margin-top: 4px;">${streak}</div>
                    <p>${streak === 1 ? 'Tag in Folge aktiv' : 'Tage in Folge aktiv'}</p>
                </div>
            `;
        }

        this.renderNextLesson();

        // Nächste Ferien (Schleswig-Holstein)
        const ferienEl = document.getElementById('dashboard-ferien');
        if (ferienEl) {
            const f = this.getCurrentOrNextFerien();
            if (!f) {
                ferienEl.innerHTML = '<p style="color: var(--text-secondary);">Keine Ferientermine hinterlegt</p>';
            } else {
                const targetDate = f.running ? f.end : f.start;
                const daysLeft = this.daysBetween(this.todayStr(), targetDate);
                const dayWord = daysLeft === 1 ? 'Tag' : 'Tage';
                ferienEl.innerHTML = `
                    <div style="text-align: center; cursor: pointer;" onclick="App.navigateTo('kalender')" title="Zum Kalender">
                        <div style="font-size: 2.2rem; font-weight: bold; color: var(--primary-color);">
                            ${f.running ? '🎉' : daysLeft}
                        </div>
                        <p>${f.running ? `noch ${daysLeft} ${dayWord} ${f.name}` : `${dayWord} bis ${f.name}`}</p>
                        <small style="color: var(--text-secondary);">${this.formatDate(f.start)} – ${this.formatDate(f.end)}</small>
                    </div>
                `;
            }
        }

        // Level & XP-Fortschritt
        const levelEl = document.getElementById('dashboard-level');
        if (levelEl) {
            const p = this.progress || {};
            const { level, xpIntoLevel, xpForNextLevel } = this.getLevelInfo(p.xp || 0);
            levelEl.innerHTML = `
                <div style="cursor: pointer;" onclick="App.navigateTo('fortschritt')" title="Zum Fortschritt">
                    <div class="level-card-top" style="margin-bottom: 10px;">
                        <span class="level-badge">Lvl ${level}</span>
                        <span class="level-xp-text">${xpIntoLevel} / ${xpForNextLevel} XP</span>
                    </div>
                    <div class="level-progress-bar" style="margin-bottom: 6px;">
                        <div class="level-progress-fill" style="width: ${(xpIntoLevel / xpForNextLevel) * 100}%;"></div>
                    </div>
                    <small style="color: var(--text-secondary);">Noch ${xpForNextLevel - xpIntoLevel} XP bis Level ${level + 1}</small>
                </div>
            `;
        }

        this.renderMoreDashboardWidgets();
    },

    // ===== Weitere Dashboard-Widgets =====
    renderMoreDashboardWidgets() {
        const today = this.todayStr();

        // Notentrend: letzte vs. vorletzte Note je Fach (normalisiert, niedriger = besser)
        const trendEl = document.getElementById('dashboard-grade-trend');
        if (trendEl) {
            const bySubject = {};
            this.grades.forEach(g => {
                if (!bySubject[g.subject]) bySubject[g.subject] = [];
                bySubject[g.subject].push(g);
            });
            const norm = g => g.system === '1-15' ? this.pointsToGrade(g.value) : g.value;

            const rows = Object.entries(bySubject).map(([subject, list]) => {
                const sorted = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                const last = sorted[sorted.length - 1];
                const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
                let icon = 'fa-minus', cls = 'grade-trend-neutral';
                if (prev) {
                    const diff = norm(prev) - norm(last); // positiv = verbessert (Zahl kleiner geworden)
                    if (diff > 0.001) { icon = 'fa-arrow-up'; cls = 'grade-trend-up'; }
                    else if (diff < -0.001) { icon = 'fa-arrow-down'; cls = 'grade-trend-down'; }
                }
                return { subject, last, icon, cls, sortDate: new Date(last.createdAt) };
            }).sort((a, b) => b.sortDate - a.sortDate).slice(0, 4);

            trendEl.innerHTML = rows.length
                ? rows.map(r => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-color);">
                        <span>${r.subject}</span>
                        <span class="${r.cls}"><i class="fas ${r.icon}"></i> ${r.last.value}${r.last.system === '1-15' ? ' P.' : ''}</span>
                    </div>
                `).join('')
                : '<p style="color: var(--text-secondary);">Noch keine Noten</p>';
        }

        // Fach mit den meisten offenen Hausaufgaben
        const topHwEl = document.getElementById('dashboard-top-hw-subject');
        if (topHwEl) {
            const openBySubject = {};
            this.homework.filter(h => !h.done).forEach(h => {
                openBySubject[h.subject] = (openBySubject[h.subject] || 0) + 1;
            });
            const entries = Object.entries(openBySubject).sort((a, b) => b[1] - a[1]);
            topHwEl.innerHTML = entries.length
                ? `<div style="text-align: center; cursor: pointer;" onclick="App.navigateTo('hausaufgaben')" title="Zu den Hausaufgaben">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${entries[0][1]}</div>
                        <p>offene ${entries[0][1] === 1 ? 'Aufgabe' : 'Aufgaben'} in <strong>${entries[0][0]}</strong></p>
                   </div>`
                : '<p style="color: var(--text-secondary);">Keine offenen Hausaufgaben 🎉</p>';
        }

        // Wochenvorschau: 7-Tage-Streifen mit Punkten für Termine/fällige Hausaufgaben
        const weekEl = document.getElementById('dashboard-week-preview');
        if (weekEl) {
            const dayLetters = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
            const now = new Date();
            let html = '<div style="display: flex; gap: 4px; justify-content: space-between;">';
            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const hasEvent = this.events.some(e => e.date === dateStr);
                const hasHw = this.homework.some(h => !h.done && h.due === dateStr);
                const dow = (d.getDay() + 6) % 7;
                html += `
                    <div style="flex: 1; text-align: center; padding: 6px 2px; border-radius: 8px; ${i === 0 ? 'background: rgba(21,128,61,0.12);' : ''}">
                        <div style="font-size: 0.66rem; color: var(--text-secondary);">${dayLetters[dow]}</div>
                        <div style="font-size: 0.85rem; font-weight: ${i === 0 ? '700' : '500'};">${d.getDate()}</div>
                        <div style="display: flex; gap: 2px; justify-content: center; margin-top: 3px; height: 6px;">
                            ${hasEvent ? '<span style="width:5px;height:5px;border-radius:50%;background:var(--secondary-color);display:inline-block;"></span>' : ''}
                            ${hasHw ? '<span style="width:5px;height:5px;border-radius:50%;background:var(--warning-color);display:inline-block;"></span>' : ''}
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            weekEl.innerHTML = html;
        }

        // Aktivität gesamt: Lebenszeit-Statistik aus dem Gamification-System
        const statsEl = document.getElementById('dashboard-activity-stats');
        if (statsEl) {
            const s = (this.progress && this.progress.stats) || {};
            statsEl.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
                    <div><div style="font-size: 1.4rem; font-weight: 700; color: var(--primary-color);">${s.homework || 0}</div><small style="color: var(--text-secondary);">Hausaufgaben</small></div>
                    <div><div style="font-size: 1.4rem; font-weight: 700; color: var(--primary-color);">${s.cards || 0}</div><small style="color: var(--text-secondary);">Karten gelernt</small></div>
                    <div><div style="font-size: 1.4rem; font-weight: 700; color: var(--primary-color);">${s.pomodoro || 0}</div><small style="color: var(--text-secondary);">Pomodoros</small></div>
                    <div><div style="font-size: 1.4rem; font-weight: 700; color: var(--primary-color);">${s.grades || 0}</div><small style="color: var(--text-secondary);">Noten</small></div>
                </div>
            `;
        }

        // Fällige Karteikarten heute (gesamt über alle Fächer)
        const fcDueEl = document.getElementById('dashboard-fc-due');
        if (fcDueEl) {
            const dueCount = this.flashcards.filter(c => c.due <= today).length;
            fcDueEl.innerHTML = `
                <div style="text-align: center; cursor: pointer;" onclick="App.navigateTo('karteikarten')" title="Zu den Karteikarten">
                    <div style="font-size: 2.2rem; font-weight: bold; color: ${dueCount > 0 ? 'var(--warning-color)' : 'var(--success-color)'};">${dueCount}</div>
                    <p>${dueCount === 1 ? 'Karte fällig' : 'Karten fällig'}</p>
                </div>
            `;
        }

        // Stundenplan heute (kompletter Tag statt nur der nächsten Stunde)
        const scheduleEl = document.getElementById('dashboard-today-schedule');
        if (scheduleEl) {
            const now = new Date();
            const todayIdx = (now.getDay() + 6) % 7;
            const todayFerien = this.getFerienForDate(today);

            if (todayFerien) {
                scheduleEl.innerHTML = `<p style="color: var(--text-secondary);">${todayFerien.name} 🎉</p>`;
            } else if (todayIdx > 4) {
                scheduleEl.innerHTML = '<p style="color: var(--text-secondary);">Kein Unterricht am Wochenende</p>';
            } else {
                const lessons = TIMETABLE_PERIODS
                    .map((period, p) => ({ period, cell: (this.timetable[p] || [])[todayIdx] }))
                    .filter(l => l.cell && l.cell.subject);

                if (lessons.length === 0) {
                    scheduleEl.innerHTML = '<p style="color: var(--text-secondary);">Kein Stundenplan für heute hinterlegt</p>';
                } else {
                    const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    scheduleEl.innerHTML = lessons.map(l => {
                        const isPast = l.period.end <= nowHM;
                        const isNow = l.period.start <= nowHM && nowHM < l.period.end;
                        return `
                            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid var(--border-color); ${isPast ? 'opacity: 0.45;' : ''} ${isNow ? 'font-weight: 700;' : ''}">
                                <span>${l.period.label} ${l.cell.subject}</span>
                                <small style="color: var(--text-secondary);">${l.period.start}${l.cell.room ? ' · ' + l.cell.room : ''}</small>
                            </div>
                        `;
                    }).join('');
                }
            }
        }
    },

    // ===== Nächste-Stunde-Widget (Dashboard) =====
    // Sucht ausgehend von jetzt die nächste Stunde mit Inhalt im Stundenplan,
    // unter Berücksichtigung von Wochenende und SH-Schulferien.
    renderNextLesson() {
        const el = document.getElementById('dashboard-next-lesson');
        if (!el) return;

        const now = new Date();
        const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const todayIdx = (now.getDay() + 6) % 7; // Montag = 0 ... Sonntag = 6

        const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

        // Sucht in this.timetable[period][dayIdx] den ersten befüllten Eintrag ab period 'fromPeriod'
        const findLessonOnDay = (dayIdx, fromPeriod) => {
            for (let p = fromPeriod; p < TIMETABLE_PERIODS.length; p++) {
                const cell = (this.timetable[p] || [])[dayIdx];
                if (cell && cell.subject) {
                    return { period: p, cell };
                }
            }
            return null;
        };

        const renderEmpty = (message) => {
            el.innerHTML = `<p style="color: var(--text-secondary);">${message}</p>`;
        };

        // Schulfrei heute (Ferien) -> direkt anzeigen, wann's weitergeht
        const todayFerien = this.getFerienForDate(this.todayStr());
        if (todayFerien) {
            renderEmpty(`${todayFerien.name} 🎉 – bis ${this.formatDate(todayFerien.end)}`);
            return;
        }

        let dayIdx = todayIdx;
        let fromPeriod = 0;
        let daysAhead = 0;

        // Ist heute noch Schule (Mo-Fr) und noch eine laufende/kommende Stunde übrig?
        if (todayIdx <= 4) {
            for (let p = 0; p < TIMETABLE_PERIODS.length; p++) {
                if (TIMETABLE_PERIODS[p].end > nowHM) {
                    fromPeriod = p;
                    break;
                }
                fromPeriod = TIMETABLE_PERIODS.length; // alle Stunden heute vorbei
            }
        } else {
            fromPeriod = TIMETABLE_PERIODS.length; // Wochenende: heute zählt nicht
        }

        let found = null;
        if (fromPeriod < TIMETABLE_PERIODS.length) {
            found = findLessonOnDay(dayIdx, fromPeriod);
        }

        // Nichts mehr heute -> nächste Schultage durchsuchen (max. 14 Tage voraus)
        while (!found && daysAhead < 14) {
            daysAhead++;
            dayIdx = (dayIdx + 1) % 7;
            const searchDate = new Date(now);
            searchDate.setDate(searchDate.getDate() + daysAhead);
            const searchDateStr = searchDate.toISOString().split('T')[0];

            if (dayIdx > 4) continue; // Wochenende überspringen
            if (this.getFerienForDate(searchDateStr)) continue; // Ferien überspringen

            const lesson = findLessonOnDay(dayIdx, 0);
            if (lesson) {
                found = lesson;
                break;
            }
        }

        if (!found) {
            renderEmpty('Kein Stundenplan hinterlegt');
            return;
        }

        const period = TIMETABLE_PERIODS[found.period];
        const cell = found.cell;
        const isToday = daysAhead === 0;
        const isTomorrow = daysAhead === 1;
        const dayLabel = isToday ? 'Heute' : isTomorrow ? 'Morgen' : dayNames[dayIdx];

        el.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 1.6rem; font-weight: bold; color: var(--text-primary);">${cell.subject}</div>
                <small style="color: var(--text-secondary);">${dayLabel} · ${period.label} Stunde (${period.start}-${period.end})</small>
                ${(cell.room || cell.teacher) ? `<div style="margin-top: 8px;"><small>${[cell.room, cell.teacher].filter(Boolean).join(' · ')}</small></div>` : ''}
            </div>
        `;
    },

    // Blendet den Notendurchschnitt auf dem Dashboard ein/aus (verpixelt),
    // ähnlich dem Verbergen des Kontostands in Banking-Apps.
    toggleGradeVisibility() {
        if (!this.settings) this.settings = {};
        this.settings.hideGradeAverage = !this.settings.hideGradeAverage;
        this.saveData('settings', this.settings);
        this.updateDashboard();
    },

    // ===== Dashboard anpassen (Reihenfolge & Sichtbarkeit der Widgets) =====
    renderDashboardCustomizeModal() {
        const order = this.getDashboardWidgetOrder();

        const rows = order.map(w => {
            const def = this.dashboardWidgetDefs[w.id];
            if (!def) return '';
            return `
                <li class="dashboard-widget-row" data-widget-id="${w.id}">
                    <span class="dashboard-widget-drag-handle" title="Ziehen zum Verschieben"><i class="fas fa-grip-vertical"></i></span>
                    <span class="dashboard-widget-row-icon"><i class="fas ${def.icon}"></i></span>
                    <span class="dashboard-widget-row-label">${def.label}</span>
                    <label class="settings-switch">
                        <input type="checkbox" class="dashboard-widget-visible-toggle" data-widget-id="${w.id}" ${w.visible ? 'checked' : ''}>
                        <span class="settings-switch-slider"></span>
                    </label>
                </li>
            `;
        }).join('');

        this.showModal(`
            <h3><i class="fas fa-sliders-h"></i> Dashboard anpassen</h3>
            <p class="settings-row-hint" style="margin-bottom: 16px;">Am Griff ziehen, um die Reihenfolge zu ändern. Mit dem Schalter Widgets aus- oder einblenden.</p>
            <ul id="dashboard-widget-order-list" class="dashboard-widget-order-list">
                ${rows}
            </ul>
            <button class="btn-primary" onclick="App.closeModal()" style="margin-top: 16px; width: 100%;">Fertig</button>
        `);

        const list = document.getElementById('dashboard-widget-order-list');
        if (list) {
            if (window.Sortable) {
                Sortable.create(list, {
                    handle: '.dashboard-widget-drag-handle',
                    animation: 150,
                    ghostClass: 'dashboard-widget-row-ghost',
                    onEnd: () => this.saveDashboardOrderFromDOM()
                });
            }
            list.querySelectorAll('.dashboard-widget-visible-toggle').forEach(cb => {
                cb.addEventListener('change', () => this.toggleDashboardWidget(cb.dataset.widgetId, cb.checked));
            });
        }
    },

    // Liest die aktuelle Reihenfolge aus dem DOM (nach Drag&Drop) und speichert sie.
    saveDashboardOrderFromDOM() {
        const list = document.getElementById('dashboard-widget-order-list');
        if (!list) return;
        if (!this.settings) this.settings = {};

        const visMap = {};
        (this.settings.dashboardWidgets || []).forEach(w => { visMap[w.id] = w.visible; });

        const ids = Array.from(list.querySelectorAll('.dashboard-widget-row')).map(li => li.dataset.widgetId);
        this.settings.dashboardWidgets = ids.map(id => ({ id, visible: visMap[id] !== false }));

        this.saveData('settings', this.settings);
        this.renderDashboardGrid();
    },

    // Blendet ein einzelnes Widget ein/aus, ohne die Reihenfolge zu verändern.
    toggleDashboardWidget(id, visible) {
        if (!this.settings) this.settings = {};
        if (!this.settings.dashboardWidgets) this.settings.dashboardWidgets = this.getDashboardWidgetOrder();

        const widget = this.settings.dashboardWidgets.find(w => w.id === id);
        if (widget) widget.visible = visible;

        this.saveData('settings', this.settings);
        this.renderDashboardGrid();
    },

    // ===== Flashcards =====
    setupFlashcards() {
        document.getElementById('add-flashcard').addEventListener('click', () => this.addFlashcard());
        document.getElementById('fc-back-to-decks').addEventListener('click', () => this.exitLearnMode());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('flashcard-learn-mode').style.display === 'flex') {
                this.exitLearnMode();
            }
        });
        this.renderFlashcardDecks();
    },

    addFlashcard() {
        const subject = document.getElementById('fc-subject').value.trim();
        const front = document.getElementById('fc-front').value.trim();
        const back = document.getElementById('fc-back').value.trim();

        if (!subject || !front || !back) {
            this.showNotification('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        const card = { id: Date.now(), subject, front, back, box: 1, due: this.todayStr() };
        this.flashcards.push(card);
        this.saveData('flashcards', this.flashcards);

        document.getElementById('fc-subject').value = '';
        document.getElementById('fc-front').value = '';
        document.getElementById('fc-back').value = '';

        this.renderFlashcardDecks();
        this.showNotification('Karteikarte hinzugefügt', 'success');
    },

    renderFlashcardDecks() {
        document.getElementById('flashcard-learn-mode').style.display = 'none';
        document.getElementById('flashcard-decks').style.display = 'grid';

        const container = document.getElementById('flashcard-decks');
        const subjects = {};
        this.flashcards.forEach(c => {
            if (!subjects[c.subject]) subjects[c.subject] = [];
            subjects[c.subject].push(c);
        });

        if (Object.keys(subjects).length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-layer-group"></i>
                    <p>Noch keine Karteikarten erstellt</p>
                </div>
            `;
            return;
        }

        const today = this.todayStr();
        container.innerHTML = Object.entries(subjects).map(([subject, cards]) => {
            const dueCount = cards.filter(c => c.due <= today).length;
            const mastered = cards.filter(c => c.box >= 5).length;
            const masteryPct = Math.round((mastered / cards.length) * 100);
            const boxCounts = [1, 2, 3, 4, 5].map(b => cards.filter(c => (c.box || 1) === b).length);
            const maxBox = Math.max(1, ...boxCounts);
            return `
                <div class="fc-deck-card">
                    <h4><i class="fas fa-layer-group" style="color:var(--primary-color);margin-right:8px;"></i>${subject}</h4>
                    <div class="fc-count">${cards.length} Karte${cards.length !== 1 ? 'n' : ''}</div>
                    <div class="fc-deck-stats">
                        <span class="${dueCount > 0 ? 'fc-stat-due' : 'fc-stat-known'}"><i class="fas fa-clock"></i> ${dueCount} fällig</span>
                        <span class="fc-stat-known"><i class="fas fa-star"></i> ${mastered} gemeistert</span>
                    </div>
                    <div class="fc-mastery-row" title="${masteryPct}% dieses Stapels gemeistert">
                        <div class="fc-mastery-bar"><div class="fc-mastery-fill" style="width:${masteryPct}%;"></div></div>
                        <span class="fc-mastery-pct">${masteryPct}%</span>
                    </div>
                    <div class="fc-box-bar" title="Verteilung über die Leitner-Boxen 1–5">
                        ${boxCounts.map((count, i) => `<div class="fc-box-seg fc-box-seg-${i + 1}" style="flex:${Math.max(count, count ? 0 : 0.001) || 0.05}${count === 0 ? ';opacity:0.15' : ''}"></div>`).join('')}
                    </div>
                    <div class="fc-box-labels">
                        ${boxCounts.map((count, i) => `<span>B${i + 1}: ${count}</span>`).join('')}
                    </div>
                    <div class="fc-deck-actions">
                        <button class="btn-primary btn-small" onclick="App.startLearn('${subject}', true)">
                            <i class="fas fa-graduation-cap"></i> Lernen${dueCount > 0 ? ` (${dueCount})` : ''}
                        </button>
                        <button class="btn-secondary btn-small" onclick="App.startLearn('${subject}', false)">
                            <i class="fas fa-redo"></i> Alle üben
                        </button>
                        <button class="btn-secondary btn-small" onclick="App.shareDeck('${subject}')" title="Diesen Stapel teilen">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button class="btn-small btn-danger" onclick="App.deleteDeck('${subject}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // onlyDue: true = nur fällige Karten (normales Lernen), false = ganzer Stapel ("Alle üben")
    startLearn(subject, onlyDue) {
        let cards = this.flashcards.filter(c => c.subject === subject);
        if (onlyDue) {
            const today = this.todayStr();
            cards = cards.filter(c => c.due <= today);
        }
        if (cards.length === 0) {
            this.showNotification(onlyDue ? 'Heute keine Karten fällig – versuch „Alle üben“' : 'Keine Karten zum Lernen', 'warning');
            return;
        }

        // Shuffle
        this.learnState = {
            subject,
            onlyDue,
            queue: cards.sort(() => Math.random() - 0.5),
            index: 0,
            correct: 0,
            wrong: 0,
            wrongIds: []
        };

        document.getElementById('flashcard-decks').style.display = 'none';
        document.getElementById('flashcard-learn-mode').style.display = 'flex';
        document.getElementById('fc-done-screen').style.display = 'none';
        document.getElementById('fc-card-area').style.display = 'block';
        document.getElementById('fc-answer-btns').style.display = 'none';
        document.getElementById('fc-learn-title').textContent = subject;

        this.showLearnCard();
    },

    showLearnCard() {
        const { queue, index } = this.learnState;
        const total = queue.length;

        document.getElementById('fc-progress-text').textContent = `${index + 1} / ${total}`;
        document.getElementById('fc-progress-fill').style.width = `${(index / total) * 100}%`;

        const card = queue[index];

        // Reset flip WITHOUT animating: temporarily disable the transition,
        // remove 'flipped', force a reflow, then only fill in the new
        // text and re-enable the transition. This prevents the next
        // card's answer from briefly flashing during the un-flip animation.
        const inner = document.getElementById('fc-card-inner');
        inner.style.transition = 'none';
        inner.classList.remove('flipped');
        void inner.offsetHeight; // force reflow so the removal takes effect instantly

        document.getElementById('fc-front-text').textContent = card.front;
        document.getElementById('fc-back-text').textContent = card.back;

        inner.style.transition = '';
        document.getElementById('fc-flip-hint').style.display = 'block';
        document.getElementById('fc-answer-btns').style.display = 'none';
    },

    flipCard() {
        const inner = document.getElementById('fc-card-inner');
        if (inner.classList.contains('flipped')) return;
        inner.classList.add('flipped');
        document.getElementById('fc-flip-hint').style.display = 'none';
        document.getElementById('fc-answer-btns').style.display = 'flex';
    },

    answerCard(known) {
        const { queue, index } = this.learnState;
        const card = queue[index];

        // Leitner-Logik: richtig -> eine Box weiter (max. 5), Fälligkeit nach Intervall.
        // Falsch -> zurück auf Box 1, morgen wieder fällig.
        const fc = this.flashcards.find(c => c.id === card.id);
        if (fc) {
            fc.box = known ? Math.min((fc.box || 1) + 1, 5) : 1;
            fc.due = this.addDays(this.todayStr(), this.leitnerIntervals[fc.box]);
            if (!known) this.learnState.wrongIds.push(fc.id);
        }
        this.saveData('flashcards', this.flashcards);

        if (known) this.learnState.correct++;
        else this.learnState.wrong++;

        this.awardXP(known ? 3 : 1, 'Karteikarte gelernt', 'cards');

        const next = index + 1;
        if (next >= queue.length) {
            this.showLearnDone();
        } else {
            this.learnState.index = next;
            this.showLearnCard();
        }
    },

    showLearnDone() {
        const { correct, wrong, queue } = this.learnState;
        const total = queue.length;
        document.getElementById('fc-progress-fill').style.width = '100%';
        document.getElementById('fc-progress-text').textContent = `${total} / ${total}`;
        document.getElementById('fc-card-area').style.display = 'none';
        document.getElementById('fc-answer-btns').style.display = 'none';
        document.getElementById('fc-done-screen').style.display = 'block';
        document.getElementById('fc-done-stats').textContent =
            `${correct} von ${total} gewusst · ${wrong} Fehler`;
        document.getElementById('fc-wrong-btn').style.display = wrong > 0 ? 'inline-flex' : 'none';
    },

    restartLearn() {
        this.startLearn(this.learnState.subject, this.learnState.onlyDue);
    },

    learnWrongOnly() {
        // Nur die in dieser Runde falsch beantworteten Karten sofort erneut abfragen,
        // ohne auf die neue Fälligkeit (morgen) zu warten.
        const { subject, wrongIds } = this.learnState;
        const cards = this.flashcards.filter(c => wrongIds.includes(c.id));
        if (cards.length === 0) {
            this.showNotification('Keine falschen Karten in dieser Runde', 'warning');
            return;
        }
        this.learnState = {
            subject,
            onlyDue: false,
            queue: cards.sort(() => Math.random() - 0.5),
            index: 0,
            correct: 0,
            wrong: 0,
            wrongIds: []
        };
        document.getElementById('fc-done-screen').style.display = 'none';
        document.getElementById('fc-card-area').style.display = 'block';
        document.getElementById('fc-answer-btns').style.display = 'none';
        this.showLearnCard();
    },

    exitLearnMode() {
        this.renderFlashcardDecks();
    },

    deleteDeck(subject) {
        if (!confirm(`Alle Karteikarten für "${subject}" löschen?`)) return;
        this.flashcards = this.flashcards.filter(c => c.subject !== subject);
        this.saveData('flashcards', this.flashcards);
        this.renderFlashcardDecks();
        this.showNotification('Stapel gelöscht', 'success');
    },

    // ===== Modal =====
    setupModal() {
        const modal = document.getElementById('modal');
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.stopQrScan();
            modal.classList.remove('active');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.stopQrScan();
                modal.classList.remove('active');
            }
        });
    },

    showModal(content) {
        this.stopQrScan();
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    },

    closeModal() {
        this.stopQrScan();
        document.getElementById('modal').classList.remove('active');
    },

    // ===== Sharing (Code/Link, Empfänger bekommt eigene Kopie) =====
    async createShare(type, title, payload) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = this.generateShareCode();
            const { error } = await supabase.from('shared_content').insert({
                id: code,
                owner_id: this.userId,
                type,
                title,
                payload
            });
            if (!error) {
                this.showShareResult(code, title);
                return;
            }
            // 23505 = Unique-Violation (Code existiert schon) -> nochmal versuchen
            if (error.code !== '23505') {
                this.showNotification('Teilen fehlgeschlagen: ' + error.message, 'error');
                return;
            }
        }
        this.showNotification('Teilen fehlgeschlagen, bitte erneut versuchen', 'error');
    },

    showShareResult(code, title) {
        const link = `${location.origin}${location.pathname}?import=${code}`;
        this.showModal(`
            <h3><i class="fas fa-share-alt"></i> „${title}“ geteilt</h3>
            <p class="field-hint">Gib diesen Code weiter, teile den Link oder lass den QR-Code scannen. Die andere Person erhält beim Einlösen eine eigene Kopie – Änderungen wirken sich nicht gegenseitig aus.</p>
            <div class="share-code-box">${code}</div>
            <div style="display:flex;gap:10px;margin-top:12px;">
                <button class="btn-secondary" style="flex:1;" onclick="App.copyToClipboard('${code}', 'Code kopiert')"><i class="fas fa-copy"></i> Code kopieren</button>
                <button class="btn-primary" style="flex:1;" onclick="App.copyToClipboard('${link}', 'Link kopiert')"><i class="fas fa-link"></i> Link kopieren</button>
            </div>
            <div class="share-qr-wrap">
                <div class="share-qr-box" id="share-qr-box"></div>
                <small class="field-hint">QR-Code scannen zum direkten Öffnen</small>
            </div>
        `);
        this.renderShareQr(link);
    },

    // Rendert den QR-Code separat, da er nach dem Einfügen des HTML
    // (innerHTML in showModal) erst im DOM existiert.
    renderShareQr(link) {
        const box = document.getElementById('share-qr-box');
        if (!box || typeof QRCode === 'undefined') return;
        box.innerHTML = '';
        new QRCode(box, {
            text: link,
            width: 160,
            height: 160,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    },

    copyToClipboard(text, message) {
        navigator.clipboard.writeText(text)
            .then(() => this.showNotification(message, 'success'))
            .catch(() => this.showNotification('Kopieren fehlgeschlagen', 'error'));
    },

    shareDeck(subject) {
        const cards = this.flashcards.filter(c => c.subject === subject).map(c => ({ front: c.front, back: c.back }));
        if (cards.length === 0) {
            this.showNotification('Dieser Stapel ist leer', 'warning');
            return;
        }
        this.createShare('flashcards', subject, cards);
    },

    shareTimetable() {
        const name = Auth.currentUser?.name || Auth.currentUser?.username || 'Mein';
        this.createShare('timetable', `${name} Stundenplan`, this.timetable);
    },

    openHomeworkShareModal() {
        const open = this.homework.filter(h => !h.done);
        if (open.length === 0) {
            this.showNotification('Keine offenen Hausaufgaben zum Teilen', 'warning');
            return;
        }
        this.showModal(`
            <h3><i class="fas fa-share-alt"></i> Hausaufgaben teilen</h3>
            <p class="field-hint">Wähle aus, welche Hausaufgaben du teilen möchtest.</p>
            <div class="hw-share-list">
                ${open.map(hw => `
                    <label class="hw-share-item">
                        <input type="checkbox" class="hw-share-check" value="${hw.id}" checked>
                        <span><strong>${hw.subject}</strong> – ${hw.task} <span class="due-date">(${this.formatDate(hw.due)})</span></span>
                    </label>
                `).join('')}
            </div>
            <button class="btn-primary btn-full" style="margin-top:14px;" onclick="App.confirmHomeworkShare()"><i class="fas fa-share-alt"></i> Ausgewählte teilen</button>
        `);
    },

    confirmHomeworkShare() {
        const ids = Array.from(document.querySelectorAll('.hw-share-check:checked')).map(el => Number(el.value));
        const items = this.homework
            .filter(h => ids.includes(h.id))
            .map(h => ({ subject: h.subject, task: h.task, due: h.due, priority: h.priority }));
        if (items.length === 0) {
            this.showNotification('Bitte mindestens eine Hausaufgabe auswählen', 'warning');
            return;
        }
        const name = Auth.currentUser?.name || Auth.currentUser?.username || 'Geteilte';
        this.createShare('homework', `${name} Hausaufgaben`, items);
    },

    openEventShareModal() {
        const upcoming = this.events
            .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
            .sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
        if (upcoming.length === 0) {
            this.showNotification('Keine anstehenden Termine zum Teilen', 'warning');
            return;
        }
        this.showModal(`
            <h3><i class="fas fa-share-alt"></i> Termine teilen</h3>
            <p class="field-hint">Wähle aus, welche Termine du teilen möchtest.</p>
            <div class="hw-share-list">
                ${upcoming.map(event => `
                    <label class="hw-share-item">
                        <input type="checkbox" class="event-share-check" value="${event.id}" checked>
                        <span><strong>${event.title}</strong> – ${this.formatDate(event.date)}${event.time ? ' um ' + event.time : ''}</span>
                    </label>
                `).join('')}
            </div>
            <button class="btn-primary btn-full" style="margin-top:14px;" onclick="App.confirmEventShare()"><i class="fas fa-share-alt"></i> Ausgewählte teilen</button>
        `);
    },

    confirmEventShare() {
        const ids = Array.from(document.querySelectorAll('.event-share-check:checked')).map(el => Number(el.value));
        const items = this.events
            .filter(e => ids.includes(e.id))
            .map(e => ({ title: e.title, date: e.date, time: e.time, reminder: e.reminder, description: e.description }));
        if (items.length === 0) {
            this.showNotification('Bitte mindestens einen Termin auswählen', 'warning');
            return;
        }
        const name = Auth.currentUser?.name || Auth.currentUser?.username || 'Geteilte';
        this.createShare('events', `${name} Termine`, items);
    },

    openImportModal(prefillCode = '') {
        this.showModal(`
            <h3><i class="fas fa-download"></i> Code einlösen</h3>
            <p class="field-hint">Gib den Code ein, den du von jemandem bekommen hast, oder scanne seinen QR-Code. Du erhältst eine eigene Kopie der Inhalte.</p>
            <input type="text" id="import-code-input" placeholder="z.B. AB3XQ9" value="${prefillCode}" style="text-transform:uppercase;" maxlength="8">
            <div style="display:flex;gap:10px;margin-top:10px;">
                <button class="btn-primary" style="flex:1;" onclick="App.fetchSharedContent()"><i class="fas fa-search"></i> Abrufen</button>
                <button class="btn-secondary" style="flex:1;" id="btn-scan-qr" onclick="App.startQrScan()"><i class="fas fa-qrcode"></i> QR-Code scannen</button>
            </div>
            <div id="qr-scanner-wrap" class="qr-scanner-wrap" style="display:none;">
                <div id="qr-scanner-box"></div>
                <button class="btn-secondary btn-full" style="margin-top:8px;" onclick="App.stopQrScan()"><i class="fas fa-xmark"></i> Scan abbrechen</button>
            </div>
            <div id="import-preview"></div>
        `);
        if (prefillCode) this.fetchSharedContent();
    },

    // ===== QR-Code-Scanner (Kamera) zum Einlösen von Codes =====
    async startQrScan() {
        if (typeof Html5Qrcode === 'undefined') {
            this.showNotification('QR-Scanner konnte nicht geladen werden', 'error');
            return;
        }
        const wrap = document.getElementById('qr-scanner-wrap');
        if (!wrap) return;
        wrap.style.display = 'block';
        this.stopQrScan();

        const scanner = new Html5Qrcode('qr-scanner-box');
        this._qrScanner = scanner;
        try {
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 220 },
                (decodedText) => this.handleQrScanResult(decodedText),
                () => {} // wird bei jedem Frame ohne erkannten Code aufgerufen -> ignorieren
            );
        } catch (err) {
            console.error('[QR] Kamera-Start fehlgeschlagen:', err);
            this.showNotification('Kamera konnte nicht gestartet werden. Bitte Berechtigung erteilen.', 'error');
            wrap.style.display = 'none';
        }
    },

    handleQrScanResult(decodedText) {
        this.stopQrScan();
        const wrap = document.getElementById('qr-scanner-wrap');
        if (wrap) wrap.style.display = 'none';

        // QR kann entweder ein Teilen-Link (?import=CODE) oder direkt der Code sein
        let code = decodedText.trim();
        try {
            const url = new URL(decodedText);
            const param = url.searchParams.get('import');
            if (param) code = param;
        } catch (e) {
            // kein gültiger Link -> decodedText direkt als Code verwenden
        }
        code = code.toUpperCase();

        const input = document.getElementById('import-code-input');
        if (input) input.value = code;
        this.showNotification('QR-Code erkannt', 'success');
        this.fetchSharedContent();
    },

    // Stoppt die laufende Kamera (Aufruf beim Abbrechen, Modal-Wechsel oder -Schließen)
    stopQrScan() {
        if (!this._qrScanner) return;
        const scanner = this._qrScanner;
        this._qrScanner = null;
        scanner.stop().then(() => scanner.clear()).catch(() => {});
    },

    async fetchSharedContent() {
        const input = document.getElementById('import-code-input');
        const code = input.value.trim().toUpperCase();
        if (!code) {
            this.showNotification('Bitte einen Code eingeben', 'error');
            return;
        }
        const preview = document.getElementById('import-preview');
        preview.innerHTML = '<p class="field-hint"><i class="fas fa-spinner fa-spin"></i> Wird gesucht…</p>';

        const { data, error } = await supabase.rpc('get_shared_content', { p_code: code });
        const row = Array.isArray(data) ? data[0] : data;

        if (error || !row) {
            preview.innerHTML = '<p class="field-hint" style="color:var(--danger-color);">Kein Inhalt mit diesem Code gefunden.</p>';
            return;
        }

        const typeLabel = { timetable: 'Stundenplan', flashcards: 'Karteikarten-Stapel', homework: 'Hausaufgaben', events: 'Termine' }[row.type] || row.type;
        const count = Array.isArray(row.payload) ? row.payload.length : null;
        const warning = row.type === 'timetable'
            ? '<p class="field-hint" style="color:var(--danger-color);"><i class="fas fa-triangle-exclamation"></i> Achtung: Dein aktueller Stundenplan wird dabei komplett ersetzt.</p>'
            : '';

        this._pendingImport = { type: row.type, title: row.title || '', payload: row.payload };

        preview.innerHTML = `
            <div class="import-preview-box">
                <p><i class="fas fa-layer-group"></i> <strong>${typeLabel}</strong>: „${row.title || ''}“${count !== null ? ` · ${count} Einträge` : ''}</p>
                ${warning}
                <button class="btn-primary btn-full" onclick="App.applyImport()">
                    <i class="fas fa-check"></i> Übernehmen
                </button>
            </div>
        `;
    },

    applyImport() {
        if (!this._pendingImport) return;
        const { type, title, payload } = this._pendingImport;
        if (type === 'timetable') {
            if (!confirm('Deinen aktuellen Stundenplan wirklich komplett ersetzen?')) return;
            this.timetable = payload;
            this.saveData('timetable', this.timetable);
            this.renderTimetable();
            this.showNotification('Stundenplan übernommen', 'success');
        } else if (type === 'flashcards') {
            const cards = payload.map((c, i) => ({
                id: Date.now() + i,
                subject: title,
                front: c.front,
                back: c.back,
                box: 1,
                due: this.todayStr()
            }));
            this.flashcards.push(...cards);
            this.saveData('flashcards', this.flashcards);
            this.renderFlashcardDecks();
            this.showNotification(`${cards.length} Karteikarten übernommen`, 'success');
        } else if (type === 'homework') {
            const items = payload.map((h, i) => ({
                id: Date.now() + i,
                subject: h.subject,
                task: h.task,
                due: h.due,
                priority: h.priority,
                done: false,
                createdAt: new Date().toISOString()
            }));
            this.homework.push(...items);
            this.saveData('homework', this.homework);
            this.renderHomework();
            this.showNotification(`${items.length} Hausaufgaben übernommen`, 'success');
        } else if (type === 'events') {
            const items = payload.map((e, i) => ({
                id: Date.now() + i,
                title: e.title,
                date: e.date,
                time: e.time || '',
                reminder: e.reminder || 0,
                description: e.description || '',
                reminded: false
            }));
            this.events.push(...items);
            this.saveData('events', this.events);
            this.renderCalendar();
            this.renderEventList();
            this.showNotification(`${items.length} Termine übernommen`, 'success');
        }
        this._pendingImport = null;
        document.getElementById('modal').classList.remove('active');
    },

    // ===== Utilities =====
    formatDate(dateStr) {
        const options = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('de-DE', options);
    },

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// ===== KI-Assistent =====

function getKiSystemPrompt() {
    const name = Auth.currentUser?.name || Auth.currentUser?.username || '';

    return `Du bist ${name ? name + 's' : 'mein'} persönlicher Lernbuddy – warm, aufmerksam und direkt, ohne Blabla.${name ? ` Mein Name ist ${name}, sprich mich ruhig ab und zu mit meinem Namen an, wenn es natürlich passt.` : ''} Sprich mich immer mit "du" an.

Regeln:
- **Persönlich statt generisch**: Geh wirklich auf das ein, was ich dir erzähle – meine Fächer, meine Probleme, meine Situation. Wirk wie jemand, der mich kennt, nicht wie eine austauschbare KI, die Standardantworten gibt.
- **Kurz und knackig, aber nicht kalt**: Keine langen Einleitungen, kein Wiederholen der Frage, kein "Natürlich!" oder "Gerne!". Direkt zur Antwort – aber mit echtem Interesse an mir, nicht nur trockene Fakten.
- Wenn ich etwas nicht verstehe, erkläre es einfach – so wie ein Freund, der das Thema drauf hat.
- Lob mich ruhig mal wenn's passt, aber übertreib's nicht.
- **Fett** für Schlüsselbegriffe, Aufzählungen nur wenn's wirklich hilft.
- Mathe mit LaTeX: \(...\) oder $...$ für inline, \[...\] oder $$...$$ für eigene Zeile.
- Maximal 3–5 Sätze bei einfachen Fragen. Nur bei komplexen Themen mehr.

Antworte immer auf Deutsch.`;
}

// Extend App with KI features
Object.assign(App, {

    // ===== API Key Management (persistent via Supabase) =====
    _cachedGroqKey: '',

    getApiKey() {
        return this._cachedGroqKey || '';
    },

    async loadApiKey() {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'groq_api_key')
                .maybeSingle();
            console.log('loadApiKey result:', data, 'error:', error);
            if (!error && data?.value) this._cachedGroqKey = data.value;
        } catch (e) { console.log('loadApiKey exception:', e); }
    },

    async saveApiKey(key) {
        this._cachedGroqKey = key.trim();
        const { data, error } = await supabase.from('app_settings').upsert({
            key: 'groq_api_key',
            value: key.trim(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
        console.log('saveApiKey result:', data, 'error:', error);
    },

    // Groq API – kostenlos bis 14.400 Anfragen/Tag
    async kiApiFetch(body) {
        const key = this.getApiKey();
        if (!key) {
            this.showKiKeyBanner();
            throw new Error('Kein API-Key');
        }

        // Konvertiere Anthropic-Format → OpenAI-kompatibles Groq-Format
        const messages = [];
        if (body.system) messages.push({ role: 'system', content: body.system });
        messages.push(...(body.messages || []));

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: body.max_tokens || 1000,
                messages
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            if (response.status === 401) {
                this.showKiKeyBanner('API-Key ungültig. Bitte prüfe deinen Groq-Key.');
                throw new Error('Ungültiger API-Key');
            }
            throw new Error(err.error?.message || 'API-Fehler');
        }

        const data = await response.json();
        // Übersetze Groq-Antwort zurück ins Anthropic-Format
        const text = data.choices?.[0]?.message?.content || '';
        return { content: [{ type: 'text', text }] };
    },

    showKiKeyBanner(errorMsg) {
        let banner = document.getElementById('ki-key-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'ki-key-banner';
            banner.className = 'ki-key-banner';
            banner.innerHTML = `
                <div class="ki-key-banner-inner">
                    <div style="font-size:1.6rem;">⚡</div>
                    <div style="flex:1;">
                        <strong>Gratis Groq API-Key einrichten</strong>
                        <p>Groq ist <strong>kostenlos</strong> nutzbar! Erstelle deinen Key in 1 Minute auf 
                        <a href="https://console.groq.com/keys" target="_blank">console.groq.com</a> 
                        (kostenloser Account, kein Kreditkarte nötig). Der Key wird nur für diese Sitzung gespeichert.</p>
                        <div style="background:rgba(21,128,61,0.07);border-radius:8px;padding:8px 12px;margin:8px 0;font-size:0.82rem;color:var(--text-secondary);">
                            ✅ Kostenlos &nbsp;·&nbsp; ✅ Kein Kreditkarte &nbsp;·&nbsp; ✅ 14.400 Anfragen/Tag &nbsp;·&nbsp; ✅ Sehr schnell
                        </div>
                        <div id="ki-key-error" class="ki-key-error" style="display:none;"></div>
                        <div style="display:flex;gap:10px;margin-top:10px;align-items:center;">
                            <input type="password" id="ki-key-input" placeholder="gsk_..." style="flex:1;margin:0;font-size:0.88rem;padding:9px 12px;">
                            <button class="btn-primary btn-small" onclick="App.submitApiKey()">
                                <i class="fas fa-check"></i> Aktivieren
                            </button>
                        </div>
                    </div>
                    <button onclick="document.getElementById('ki-key-banner').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);font-size:1.1rem;padding:4px;align-self:flex-start;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            const section = document.getElementById('ki-assistent');
            section.insertBefore(banner, section.querySelector('.ki-tabs'));
        }
        banner.style.display = 'block';
        if (errorMsg) {
            const errEl = document.getElementById('ki-key-error');
            if (errEl) { errEl.textContent = errorMsg; errEl.style.display = 'block'; }
        }
        const input = document.getElementById('ki-key-input');
        if (input && this.getApiKey()) input.value = this.getApiKey();
        setTimeout(() => { if (input) input.focus(); }, 100);
    },

    async submitApiKey() {
        const input = document.getElementById('ki-key-input');
        const key = input?.value.trim();
        if (!key || !key.startsWith('gsk_')) {
            const errEl = document.getElementById('ki-key-error');
            if (errEl) { errEl.textContent = 'Bitte einen gültigen Groq-Key eingeben (beginnt mit gsk_).'; errEl.style.display = 'block'; }
            return;
        }
        await this.saveApiKey(key);
        document.getElementById('ki-key-banner').style.display = 'none';
        this.showNotification('Groq-Key gespeichert – KI-Features sind jetzt aktiv! ⚡', 'success');
    },

    // ===== KI Tab Navigation =====
    setupKI() {
        document.querySelectorAll('.ki-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ki-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ki-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const id = 'ki-tab-' + tab.dataset.tab;
                document.getElementById(id).classList.add('active');
            });
        });

        // Enter to send chat
        const input = document.getElementById('ki-chat-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }

        // Show key banner if no key saved yet when entering KI section
        document.querySelectorAll('.nav-links li[data-section="ki-assistent"], .mobile-more-menu li[data-section="ki-assistent"]').forEach(el => {
            el.addEventListener('click', () => {
                if (!this.getApiKey()) setTimeout(() => this.showKiKeyBanner(), 200);
            });
        });

        this.kiChatHistory = [];
    },

    // ===== Chat =====
    async sendChatMessage() {
        const input = document.getElementById('ki-chat-input');
        const msg = input.value.trim();
        if (!msg) return;

        input.value = '';
        this.appendChatMessage(msg, 'user');

        const loadingId = this.appendChatLoading();
        const btn = document.getElementById('ki-send-btn');
        btn.disabled = true;

        this.kiChatHistory.push({ role: 'user', content: msg });

        try {
            const data = await this.kiApiFetch({
                model: 'claude-sonnet-4-6',
                max_tokens: 1000,
                system: getKiSystemPrompt(),
                messages: this.kiChatHistory
            });

            const reply = data.content?.map(c => c.text || '').join('') || 'Keine Antwort erhalten.';
            this.kiChatHistory.push({ role: 'assistant', content: reply });
            this.removeChatLoading(loadingId);
            this.appendChatMessage(reply, 'ai');
            this.awardXP(2, 'KI-Assistent genutzt', 'ki');

            const qp = document.getElementById('ki-quick-prompts');
            if (qp && this.kiChatHistory.length > 2) qp.style.display = 'none';
        } catch (err) {
            this.removeChatLoading(loadingId);
            if (err.message !== 'Kein API-Key' && err.message !== 'Ungültiger API-Key') {
                this.appendChatMessage('Fehler: ' + err.message, 'ai');
            }
        }

        btn.disabled = false;
    },

    sendQuickPrompt(text) {
        document.getElementById('ki-chat-input').value = text;
        this.sendChatMessage();
    },

    appendChatMessage(text, role) {
        const container = document.getElementById('ki-chat-messages');
        const el = document.createElement('div');
        el.className = `ki-message ki-message-${role}`;
        const icon = role === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        el.innerHTML = `
            <div class="ki-message-avatar">${icon}</div>
            <div class="ki-message-bubble">${role === "user" ? this.escapeHTML(text) : this.renderMarkdown(text)}</div>
        `;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        // Re-render MathJax for new content
        if (role === 'ai' && window.MathJax) MathJax.typesetPromise([el]).catch(() => {});
        return el;
    },

    appendChatLoading() {
        const container = document.getElementById('ki-chat-messages');
        const id = 'ki-loading-' + Date.now();
        const el = document.createElement('div');
        el.className = 'ki-message ki-message-ai';
        el.id = id;
        el.innerHTML = `
            <div class="ki-message-avatar"><i class="fas fa-robot"></i></div>
            <div class="ki-message-bubble ki-loading">
                <div class="ki-dot"></div><div class="ki-dot"></div><div class="ki-dot"></div>
            </div>
        `;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    removeChatLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    renderMarkdown(text) {
        // 1. Protect LaTeX blocks from escaping
        const latexBlocks = [];
        text = text.replace(/\\\[[\s\S]*?\\\]/g, (m) => { latexBlocks.push(m); return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`; });
        text = text.replace(/\\\([\s\S]*?\\\)/g, (m) => { latexBlocks.push(m); return `%%LATEX_INLINE_${latexBlocks.length - 1}%%`; });
        // Also protect $$...$$ (display) and $...$ (inline), falls die KI Dollar-Syntax statt \( \) verwendet.
        // Nur als Mathe werten, wenn typische Mathe-Zeichen enthalten sind (verhindert Verwechslung mit Geldbeträgen wie "$5").
        text = text.replace(/\$\$[\s\S]+?\$\$/g, (m) => { latexBlocks.push(m); return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`; });
        text = text.replace(/\$(?!\s)([^\$\n]*?[A-Za-z\\^_{}=][^\$\n]*?)(?<!\s)\$/g, (m) => { latexBlocks.push(m); return `%%LATEX_INLINE_${latexBlocks.length - 1}%%`; });

        // 2. Escape HTML
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 3. Markdown
        text = text.replace(/^### (.+)$/gm, '<h4 style="margin:12px 0 4px;font-size:0.97rem;">$1</h4>');
        text = text.replace(/^## (.+)$/gm, '<h3 style="margin:14px 0 6px;">$1</h3>');
        text = text.replace(/^# (.+)$/gm, '<h3 style="margin:14px 0 6px;">$1</h3>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.08);padding:1px 5px;border-radius:4px;font-size:0.88em;">$1</code>');
        // Lists
        text = text.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>(\n|$))+/g, (m) => '<ul style="padding-left:20px;margin:6px 0;">' + m + '</ul>');
        text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        // Newlines
        text = text.replace(/\n\n/g, '</p><p style="margin:8px 0;">');
        text = text.replace(/\n/g, '<br>');
        text = '<p style="margin:0;">' + text + '</p>';

        // 4. Restore LaTeX
        text = text.replace(/%%LATEX_BLOCK_(\d+)%%/g, (_, i) => latexBlocks[i]);
        text = text.replace(/%%LATEX_INLINE_(\d+)%%/g, (_, i) => latexBlocks[i]);

        return text;
    },

    // ===== Buchseite scannen (OCR) =====
    async handleScanImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        this.scanImageFile = null;
        this.scanPdfPages = null;

        document.getElementById('ki-scan-filename').textContent = file.name;
        const pdfInfo = document.getElementById('ki-scan-pdf-info');
        const btn = document.getElementById('ki-scan-ocr-btn');

        if (isPdf) {
            if (typeof pdfjsLib === 'undefined') {
                this.showNotification('PDF-Unterstützung ist offline nicht verfügbar. Bitte einmal mit Internet öffnen.', 'error');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PDF wird geladen...';
            document.getElementById('ki-scan-preview-wrap').style.display = 'block';

            try {
                const { images, totalPages, processedPages } = await this.renderPdfToImages(file);
                this.scanPdfPages = images;

                document.getElementById('ki-scan-preview').src = images[0];
                pdfInfo.style.display = 'block';
                pdfInfo.textContent = totalPages > processedPages
                    ? `PDF mit ${totalPages} Seiten erkannt – aus Performancegründen werden die ersten ${processedPages} Seiten gescannt.`
                    : `PDF mit ${totalPages} Seite${totalPages > 1 ? 'n' : ''} erkannt – der gesamte Inhalt wird gescannt.`;

                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-text-height"></i> Text erkennen';
            } catch (err) {
                this.showNotification('PDF konnte nicht gelesen werden: ' + err.message, 'error');
                document.getElementById('ki-scan-preview-wrap').style.display = 'none';
            }
            return;
        }

        // Normaler Bild-Upload
        pdfInfo.style.display = 'none';
        this.scanImageFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('ki-scan-preview').src = e.target.result;
            document.getElementById('ki-scan-preview-wrap').style.display = 'block';
        };
        reader.readAsDataURL(file);

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-text-height"></i> Text erkennen';
    },

    // Rendert die Seiten einer PDF-Datei als Bilder (dataURLs) für die Texterkennung.
    // Das Limit ist bewusst hoch angesetzt, damit bei normalen eingescannten
    // Kapiteln nichts vom Inhalt fehlt; nur bei sehr langen PDFs greift es als Schutz
    // gegen ein versehentlich hochgeladenes riesiges Dokument.
    async renderPdfToImages(file, maxPages = 100) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        const processedPages = Math.min(totalPages, maxPages);
        const images = [];

        for (let i = 1; i <= processedPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            images.push(canvas.toDataURL('image/png'));
        }

        return { images, totalPages, processedPages };
    },

    // Schätzt anhand des erkannten Textumfangs, wie viele Karteikarten sinnvoll sind.
    // Faustregel: ca. 1 Karte pro ~55 Wörtern eigentlichem Lerninhalt (grobe Bereinigung
    // um Seitenzahlen/Kopf-Fußzeilen-Artefakte), geklammert auf den erlaubten Bereich 3–20.
    estimateFlashcardCount(text) {
        const cleaned = text
            .replace(/---\s*Seite\s*\d+\s*---/gi, ' ')
            .replace(/\b\d{1,4}\b/g, ' '); // einzelne Zahlen (oft Seitenzahlen) grob rausfiltern

        const words = (cleaned.match(/[\p{L}][\p{L}'-]*/gu) || []).length;
        const raw = Math.round(words / 55);
        return Math.min(Math.max(raw, 3), 20);
    },

    async runBookScanOCR() {
        const hasPdf = this.scanPdfPages && this.scanPdfPages.length > 0;
        if (!this.scanImageFile && !hasPdf) return;
        if (typeof Tesseract === 'undefined') {
            this.showNotification('Texterkennung ist offline nicht verfügbar. Bitte einmal mit Internet öffnen.', 'error');
            return;
        }

        const btn = document.getElementById('ki-scan-ocr-btn');
        const progressWrap = document.getElementById('ki-scan-progress');
        const progressFill = document.getElementById('ki-scan-progress-fill');
        const progressLabel = document.getElementById('ki-scan-progress-label');

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Erkenne Text...';
        progressWrap.style.display = 'block';
        progressFill.style.width = '0%';
        progressLabel.textContent = 'Texterkennung wird vorbereitet...';

        try {
            const sources = hasPdf ? this.scanPdfPages : [this.scanImageFile];
            const pageTexts = [];

            for (let i = 0; i < sources.length; i++) {
                const pagePrefix = sources.length > 1 ? `Seite ${i + 1}/${sources.length}: ` : '';

                const { data } = await Tesseract.recognize(sources[i], 'deu', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            const pct = Math.round((m.progress || 0) * 100);
                            // Fortschritt über alle Seiten hinweg anteilig berechnen
                            const overallPct = Math.round(((i + (m.progress || 0)) / sources.length) * 100);
                            progressFill.style.width = overallPct + '%';
                            progressLabel.textContent = `${pagePrefix}Erkenne Text... ${pct}%`;
                        } else if (m.status) {
                            progressLabel.textContent = pagePrefix + m.status;
                        }
                    }
                });

                const pageText = (data.text || '').replace(/[ \t]+\n/g, '\n').trim();
                if (pageText) pageTexts.push(sources.length > 1 ? `--- Seite ${i + 1} ---\n${pageText}` : pageText);
            }

            const text = pageTexts.join('\n\n').trim();
            if (!text) {
                this.showNotification('Kein Text erkannt. Versuch ein schärferes, gerade ausgerichtetes Foto oder ein besser lesbares PDF.', 'error');
            } else {
                const topicField = document.getElementById('ki-fc-topic');
                topicField.value = text;
                topicField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                topicField.focus();

                const suggestedCount = this.estimateFlashcardCount(text);
                const countField = document.getElementById('ki-fc-count');
                if (countField) countField.value = suggestedCount;

                this.showNotification(`Text erkannt! Anzahl automatisch auf ${suggestedCount} Karten eingestellt – passe sie bei Bedarf an und generiere dann die Karten.`, 'success');
            }
        } catch (err) {
            this.showNotification('Fehler bei der Texterkennung: ' + err.message, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-redo"></i> Text erneut erkennen';
        progressWrap.style.display = 'none';
    },

    // ===== Karteikarten generieren =====
    async generateFlashcards() {
        const subject = document.getElementById('ki-fc-subject').value.trim();
        const topic = document.getElementById('ki-fc-topic').value.trim();
        let count = parseInt(document.getElementById('ki-fc-count').value, 10);
        if (!Number.isFinite(count) || count < 1) count = 8;
        count = Math.min(Math.max(count, 3), 20);
        document.getElementById('ki-fc-count').value = count;

        if (!subject || !topic) {
            this.showNotification('Bitte Fach und Thema eingeben', 'error');
            return;
        }

        const btn = document.getElementById('ki-fc-generate-btn');
        btn.classList.add('ki-btn-loading');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generiere...';

        try {
            const prompt = `Erstelle genau ${count} Karteikarten für das Fach "${subject}" zum folgenden Thema/Text:

"${topic}"

Hinweis: Der Text kann aus einem eingescannten Foto oder PDF einer Schulbuchseite stammen und daher Erkennungsfehler, Seitenzahlen, Kopf-/Fußzeilen oder abgeschnittene Wörter enthalten. Ignoriere solche Artefakte, korrigiere offensichtliche Tippfehler im Kopf und konzentriere dich nur auf den eigentlichen Lerninhalt.

Wichtig: Wenn der Text mehrere Abschnitte, Unterthemen oder mehrere gescannte Seiten enthält, decke den Inhalt vollständig ab und verteile die ${count} Karten über den GESAMTEN Text – lass keinen Abschnitt aus, auch nicht bei längeren Texten.

Antworte NUR mit einem vollständigen JSON-Array mit genau ${count} Einträgen in diesem Format (kein Text davor oder danach, keine Markdown-Backticks, nicht abschneiden):
[{"front":"Frage hier","back":"Antwort hier"},...]

Die Fragen sollen lernwirksam und präzise sein. Die Antworten sollen kurz und klar sein.`;

            // Token-Budget mit der gewünschten Kartenzahl skalieren, damit die
            // Antwort bei vielen Karten nicht mitten im JSON abgeschnitten wird.
            const maxTokens = Math.min(8000, 400 + count * 140);

            const data = await this.kiApiFetch({
                model: 'claude-sonnet-4-6',
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }]
            });

            const raw = data.content?.map(c => c.text || '').join('') || '[]';
            const clean = raw.replace(/```json|```/g, '').trim();
            const cards = JSON.parse(clean);

            if (cards.length < count) {
                this.showNotification(`Hinweis: Es konnten nur ${cards.length} von ${count} Karten erzeugt werden. Du kannst erneut generieren oder die Anzahl reduzieren.`, 'error');
            }

            this.kiGeneratedCards = { subject, cards };
            this.renderGeneratedFlashcards(subject, cards);
        } catch (err) {
            if (err.message !== 'Kein API-Key' && err.message !== 'Ungültiger API-Key') {
                if (err instanceof SyntaxError) {
                    this.showNotification('Die Antwort war unvollständig oder ungültig. Versuch es mit weniger Karten oder kürzerem Text erneut.', 'error');
                } else {
                    this.showNotification('Fehler: ' + err.message, 'error');
                }
            }
        }

        btn.classList.remove('ki-btn-loading');
        btn.innerHTML = '<i class="fas fa-magic"></i> Karteikarten generieren';
    },

    renderGeneratedFlashcards(subject, cards) {
        const result = document.getElementById('ki-fc-result');
        const preview = document.getElementById('ki-fc-preview');
        document.getElementById('ki-fc-result-title').textContent = `${cards.length} Karten für "${subject}" erstellt`;

        preview.innerHTML = cards.map((c) => `
            <div class="ki-fc-preview-card">
                <div class="fc-q"><i class="fas fa-question-circle" style="color:var(--primary-color);margin-right:6px;"></i>${this.escapeHTML(c.front)}</div>
                <div class="fc-a"><i class="fas fa-lightbulb" style="color:var(--warning-color);margin-right:6px;"></i>${this.escapeHTML(c.back)}</div>
            </div>
        `).join('');

        result.style.display = 'block';
    },

    saveGeneratedFlashcards() {
        if (!this.kiGeneratedCards) return;
        const { subject, cards } = this.kiGeneratedCards;

        cards.forEach(c => {
            this.flashcards.push({
                id: Date.now() + Math.random(),
                subject,
                front: c.front,
                back: c.back,
                box: 1,
                due: this.todayStr()
            });
        });

        this.saveData('flashcards', this.flashcards);
        this.showNotification(`${cards.length} Karteikarten gespeichert!`, 'success');

        document.getElementById('ki-fc-subject').value = '';
        document.getElementById('ki-fc-topic').value = '';
        document.getElementById('ki-fc-result').style.display = 'none';
        this.kiGeneratedCards = null;

        this.scanImageFile = null;
        this.scanPdfPages = null;
        document.getElementById('ki-scan-filename').textContent = '';
        document.getElementById('ki-scan-preview-wrap').style.display = 'none';
        document.getElementById('ki-scan-pdf-info').style.display = 'none';
        document.getElementById('ki-scan-input').value = '';
    },

    formatKIResult(text) {
        return this.renderMarkdown(text);
    }
});

// Patch App.init to also call setupKI and load saved Groq key
const _origInit = App.init.bind(App);
App.init = async function() {
    await _origInit();
    await this.loadApiKey();
    this.setupKI();
};

// Patch navigateTo for KI section
const _origNav = App.navigateTo.bind(App);
App.navigateTo = function(section) {
    _origNav(section);
};

// ===== Pomodoro Timer =====
Object.assign(App, {

    pomodoroState: {
        timer: null,
        remaining: 25 * 60,
        endTime: null, // Wall-Clock-Zeitpunkt, an dem die Phase endet (ms seit Epoch)
        mode: 'work', // 'work' | 'short' | 'long'
        round: 0,
        running: false
    },

    setupPomodoro() {
        document.getElementById('pomodoro-start-btn').addEventListener('click', () => this.togglePomodoro());
        document.getElementById('pomodoro-reset-btn').addEventListener('click', () => this.resetPomodoro());
        document.getElementById('pomodoro-skip-btn').addEventListener('click', () => this.skipPomodoroPhase());

        ['pomodoro-work-min', 'pomodoro-short-min', 'pomodoro-long-min', 'pomodoro-rounds'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.clampPomodoroInput(id);
                this.savePomodoroSettings();
                if (!this.pomodoroState.running) this.resetPomodoro();
            });
        });

        const savedSubject = localStorage.getItem('oneplan-pomodoro-subject');
        if (savedSubject) document.getElementById('pomodoro-subject').value = savedSubject;
        document.getElementById('pomodoro-subject').addEventListener('input', (e) => {
            localStorage.setItem('oneplan-pomodoro-subject', e.target.value);
        });

        this.loadPomodoroSettings();
        this.updatePomodoroTodayCount();
        this.renderPomodoroTime();
        this.renderPomodoroMode();
        this.renderPomodoroDots();
    },

    // Liest min/max direkt aus dem Input-Element und erzwingt sie – reine
    // HTML-min/max-Attribute verhindern per Tastatur eingegebene Werte
    // außerhalb des Bereichs (z.B. negative Zahlen) nämlich NICHT von selbst.
    clampPomodoroValue(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const min = parseInt(el.min, 10);
        const max = parseInt(el.max, 10);
        let val = parseInt(el.value, 10);
        if (isNaN(val)) val = fallback;
        if (!isNaN(min)) val = Math.max(min, val);
        if (!isNaN(max)) val = Math.min(max, val);
        return val;
    },

    // Schreibt den geclampten Wert sichtbar ins Feld zurück, damit der
    // Nutzer merkt, dass z.B. "-5" auf das erlaubte Minimum korrigiert wurde.
    clampPomodoroInput(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const fallback = { 'pomodoro-work-min': 25, 'pomodoro-short-min': 5, 'pomodoro-long-min': 15, 'pomodoro-rounds': 4 }[id];
        el.value = this.clampPomodoroValue(id, fallback);
    },

    getPomodoroDurations() {
        return {
            work: this.clampPomodoroValue('pomodoro-work-min', 25) * 60,
            short: this.clampPomodoroValue('pomodoro-short-min', 5) * 60,
            long: this.clampPomodoroValue('pomodoro-long-min', 15) * 60,
            rounds: this.clampPomodoroValue('pomodoro-rounds', 4)
        };
    },

    savePomodoroSettings() {
        const d = this.getPomodoroDurations();
        localStorage.setItem('oneplan-pomodoro-settings', JSON.stringify(d));
    },

    loadPomodoroSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('oneplan-pomodoro-settings'));
            if (saved) {
                document.getElementById('pomodoro-work-min').value = saved.work / 60;
                document.getElementById('pomodoro-short-min').value = saved.short / 60;
                document.getElementById('pomodoro-long-min').value = saved.long / 60;
                document.getElementById('pomodoro-rounds').value = saved.rounds;
            }
        } catch (e) { /* ignore */ }
        if (!this.pomodoroState.running) {
            this.pomodoroState.remaining = this.getPomodoroDurations().work;
        }
    },

    togglePomodoro() {
        if (this.pomodoroState.running) {
            this.pausePomodoro();
        } else {
            this.startPomodoro();
        }
    },

    startPomodoro() {
        if (this.pomodoroState.timer) return;
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        // Ziel-Zeitpunkt statt reinem Zähler: so korrigiert sich der Timer
        // beim nächsten Tick von selbst, egal ob setInterval durch einen
        // Hintergrund-Tab gedrosselt wurde oder ein Tick mal ausgefallen ist.
        this.pomodoroState.endTime = Date.now() + this.pomodoroState.remaining * 1000;
        this.pomodoroState.running = true;
        document.getElementById('pomodoro-start-btn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.pomodoroState.timer = setInterval(() => this.tickPomodoro(), 1000);
    },

    pausePomodoro() {
        clearInterval(this.pomodoroState.timer);
        this.pomodoroState.timer = null;
        this.pomodoroState.running = false;
        this.pomodoroState.endTime = null;
        document.getElementById('pomodoro-start-btn').innerHTML = '<i class="fas fa-play"></i> Start';
        document.title = 'OnePlan';
    },

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroState.mode = 'work';
        this.pomodoroState.round = 0;
        this.pomodoroState.remaining = this.getPomodoroDurations().work;
        this.renderPomodoroTime();
        this.renderPomodoroMode();
        this.renderPomodoroDots();
    },

    skipPomodoroPhase() {
        this.pausePomodoro();
        this.advancePomodoroPhase();
    },

    tickPomodoro() {
        // Restzeit aus der tatsächlich vergangenen Wall-Clock-Zeit neu berechnen,
        // statt einfach "-1" zu rechnen. Dadurch bleibt der Timer korrekt, auch
        // wenn Ticks durch Tab-Drosselung/Hintergrund verzögert oder übersprungen wurden.
        this.pomodoroState.remaining = Math.max(0, Math.round((this.pomodoroState.endTime - Date.now()) / 1000));
        if (this.pomodoroState.remaining <= 0) {
            this.completePomodoroPhase();
        } else {
            this.renderPomodoroTime();
        }
    },

    completePomodoroPhase() {
        const wasWork = this.pomodoroState.mode === 'work';
        if (wasWork) {
            this.incrementPomodoroTodayCount();
            this.awardXP(15, 'Pomodoro-Fokusphase abgeschlossen', 'pomodoro');
        }

        this.playPomodoroSound();
        this.notifyPomodoro(wasWork);
        this.pausePomodoro();
        this.advancePomodoroPhase();
        this.startPomodoro(); // auto-continue into the next phase
    },

    advancePomodoroPhase() {
        const d = this.getPomodoroDurations();
        if (this.pomodoroState.mode === 'work') {
            this.pomodoroState.round++;
            if (this.pomodoroState.round % d.rounds === 0) {
                this.pomodoroState.mode = 'long';
                this.pomodoroState.remaining = d.long;
            } else {
                this.pomodoroState.mode = 'short';
                this.pomodoroState.remaining = d.short;
            }
        } else {
            this.pomodoroState.mode = 'work';
            this.pomodoroState.remaining = d.work;
        }
        this.renderPomodoroTime();
        this.renderPomodoroMode();
        this.renderPomodoroDots();
    },

    renderPomodoroTime() {
        const m = Math.floor(this.pomodoroState.remaining / 60).toString().padStart(2, '0');
        const s = (this.pomodoroState.remaining % 60).toString().padStart(2, '0');
        const el = document.getElementById('pomodoro-time');
        if (el) el.textContent = `${m}:${s}`;
        if (this.pomodoroState.running) document.title = `${m}:${s} · OnePlan`;
        this.renderPomodoroRing();
    },

    renderPomodoroRing() {
        const ring = document.getElementById('pomodoro-ring-progress');
        if (!ring) return;
        const d = this.getPomodoroDurations();
        const total = d[this.pomodoroState.mode] || d.work;
        const fraction = total > 0 ? this.pomodoroState.remaining / total : 0;
        const circumference = 2 * Math.PI * 100; // r=100
        ring.style.strokeDasharray = `${circumference}`;
        ring.style.strokeDashoffset = `${circumference * (1 - fraction)}`;
    },

    renderPomodoroMode() {
        const labels = { work: 'Fokus', short: 'Kurze Pause', long: 'Lange Pause' };
        const el = document.getElementById('pomodoro-mode');
        if (!el) return;
        el.textContent = labels[this.pomodoroState.mode];
        el.className = 'pomodoro-mode mode-' + this.pomodoroState.mode;
        this.renderPomodoroRing();
    },

    renderPomodoroDots() {
        const d = this.getPomodoroDurations();
        const container = document.getElementById('pomodoro-dots');
        if (!container) return;
        // Während der langen Pause sind gerade alle Runden geschafft -> alle
        // Punkte voll anzeigen. Vorher sprang die Anzeige an genau diesem
        // Punkt fälschlich auf 0 zurück, weil round % rounds dann 0 ergibt.
        const current = this.pomodoroState.mode === 'long' ? d.rounds : (this.pomodoroState.round % d.rounds);
        let html = '';
        for (let i = 0; i < d.rounds; i++) {
            html += `<span class="pomodoro-dot ${i < current ? 'filled' : ''}"></span>`;
        }
        container.innerHTML = html;
    },

    playPomodoroSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g);
            g.connect(ctx.destination);
            o.frequency.value = 880;
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            o.start();
            o.stop(ctx.currentTime + 0.6);
        } catch (e) { /* ignore */ }
    },

    notifyPomodoro(wasWork) {
        const subject = document.getElementById('pomodoro-subject')?.value.trim();
        const body = wasWork
            ? `Fokuszeit vorbei${subject ? ' (' + subject + ')' : ''} – Zeit für eine Pause!`
            : 'Pause vorbei – weiter geht\'s!';

        if (!('Notification' in window)) {
            this.showNotification(body, 'success');
            return;
        }
        if (Notification.permission === 'granted') {
            new Notification('OnePlan Pomodoro', { body });
        } else {
            this.showNotification(body, 'success');
        }
    },

    getPomodoroTodayKey() {
        return 'oneplan-pomodoro-count-' + new Date().toISOString().split('T')[0];
    },

    incrementPomodoroTodayCount() {
        const key = this.getPomodoroTodayKey();
        const count = parseInt(localStorage.getItem(key) || '0') + 1;
        localStorage.setItem(key, count);
        this.updatePomodoroTodayCount();
    },

    updatePomodoroTodayCount() {
        const count = localStorage.getItem(this.getPomodoroTodayKey()) || '0';
        const el = document.getElementById('pomodoro-today-count');
        if (el) el.textContent = count;
    }
});

// ===== Gamification / Fortschritt =====
// Jedes Abzeichen kennt zusätzlich zu "check" (freigeschaltet ja/nein) auch
// "target" (Zielwert) und "progress" (aktueller Wert), damit in der UI ein
// Fortschritt wie "45/50" angezeigt werden kann.
const PROGRESS_BADGES = [
    { id: 'first_step', category: 'Meilensteine', icon: 'fa-seedling', name: 'Erste Schritte', desc: 'Erste Aktion in OnePlan', target: 1, progress: p => p.totalActions || 0, check: p => p.totalActions >= 1 },
    { id: 'actions_50', category: 'Meilensteine', icon: 'fa-bolt', name: 'Dabeibleiber', desc: '50 Aktionen gesammelt', target: 50, progress: p => p.totalActions || 0, check: p => p.totalActions >= 50 },
    { id: 'actions_200', category: 'Meilensteine', icon: 'fa-crown', name: 'Profi', desc: '200 Aktionen gesammelt', target: 200, progress: p => p.totalActions || 0, check: p => p.totalActions >= 200 },
    { id: 'actions_500', category: 'Meilensteine', icon: 'fa-crown', name: 'Legende', desc: '500 Aktionen gesammelt', target: 500, progress: p => p.totalActions || 0, check: p => p.totalActions >= 500 },

    { id: 'streak_3', category: 'Streak', icon: 'fa-fire', name: '3-Tage-Streak', desc: '3 Tage in Folge aktiv', target: 3, progress: p => p.streak || 0, check: p => p.streak >= 3 },
    { id: 'streak_7', category: 'Streak', icon: 'fa-fire', name: '7-Tage-Streak', desc: '7 Tage in Folge aktiv', target: 7, progress: p => p.streak || 0, check: p => p.streak >= 7 },
    { id: 'streak_14', category: 'Streak', icon: 'fa-fire', name: '14-Tage-Streak', desc: '14 Tage in Folge aktiv', target: 14, progress: p => p.streak || 0, check: p => p.streak >= 14 },
    { id: 'streak_30', category: 'Streak', icon: 'fa-fire', name: '30-Tage-Streak', desc: '30 Tage in Folge aktiv', target: 30, progress: p => p.streak || 0, check: p => p.streak >= 30 },
    { id: 'streak_50', category: 'Streak', icon: 'fa-fire', name: '50-Tage-Streak', desc: '50 Tage in Folge aktiv', target: 50, progress: p => p.streak || 0, check: p => p.streak >= 50 },
    { id: 'streak_100', category: 'Streak', icon: 'fa-fire', name: '100-Tage-Streak', desc: '100 Tage in Folge aktiv', target: 100, progress: p => p.streak || 0, check: p => p.streak >= 100 },

    { id: 'level_5', category: 'Level', icon: 'fa-star', name: 'Level 5', desc: 'Level 5 erreicht', target: 5, progress: p => App.getLevelInfo(p.xp).level, check: p => App.getLevelInfo(p.xp).level >= 5 },
    { id: 'level_10', category: 'Level', icon: 'fa-star', name: 'Level 10', desc: 'Level 10 erreicht', target: 10, progress: p => App.getLevelInfo(p.xp).level, check: p => App.getLevelInfo(p.xp).level >= 10 },
    { id: 'level_20', category: 'Level', icon: 'fa-star', name: 'Level 20', desc: 'Level 20 erreicht', target: 20, progress: p => App.getLevelInfo(p.xp).level, check: p => App.getLevelInfo(p.xp).level >= 20 },

    { id: 'homework_10', category: 'Hausaufgaben', icon: 'fa-list-check', name: 'Fleißig', desc: '10 Hausaufgaben erledigt', target: 10, progress: p => p.stats?.homework || 0, check: p => (p.stats?.homework || 0) >= 10 },
    { id: 'homework_50', category: 'Hausaufgaben', icon: 'fa-list-check', name: 'Hausaufgaben-Held', desc: '50 Hausaufgaben erledigt', target: 50, progress: p => p.stats?.homework || 0, check: p => (p.stats?.homework || 0) >= 50 },

    { id: 'cards_50', category: 'Karteikarten', icon: 'fa-layer-group', name: 'Karteikarten-Fan', desc: '50 Karteikarten gelernt', target: 50, progress: p => p.stats?.cards || 0, check: p => (p.stats?.cards || 0) >= 50 },
    { id: 'cards_200', category: 'Karteikarten', icon: 'fa-layer-group', name: 'Karteikarten-Meister', desc: '200 Karteikarten gelernt', target: 200, progress: p => p.stats?.cards || 0, check: p => (p.stats?.cards || 0) >= 200 },

    { id: 'pomodoro_10', category: 'Pomodoro', icon: 'fa-stopwatch', name: 'Fokussiert', desc: '10 Pomodoro-Fokusphasen', target: 10, progress: p => p.stats?.pomodoro || 0, check: p => (p.stats?.pomodoro || 0) >= 10 },
    { id: 'pomodoro_50', category: 'Pomodoro', icon: 'fa-stopwatch', name: 'Pomodoro-Profi', desc: '50 Pomodoro-Fokusphasen', target: 50, progress: p => p.stats?.pomodoro || 0, check: p => (p.stats?.pomodoro || 0) >= 50 },

    { id: 'grades_10', category: 'Noten', icon: 'fa-calculator', name: 'Überblick', desc: '10 Noten eingetragen', target: 10, progress: p => p.stats?.grades || 0, check: p => (p.stats?.grades || 0) >= 10 },
    { id: 'grades_50', category: 'Noten', icon: 'fa-calculator', name: 'Noten-Profi', desc: '50 Noten eingetragen', target: 50, progress: p => p.stats?.grades || 0, check: p => (p.stats?.grades || 0) >= 50 },

    { id: 'events_10', category: 'Kalender', icon: 'fa-calendar-check', name: 'Terminplaner', desc: '10 Termine erstellt', target: 10, progress: p => p.stats?.events || 0, check: p => (p.stats?.events || 0) >= 10 },
    { id: 'events_30', category: 'Kalender', icon: 'fa-calendar-check', name: 'Organisationstalent', desc: '30 Termine erstellt', target: 30, progress: p => p.stats?.events || 0, check: p => (p.stats?.events || 0) >= 30 },

    { id: 'ki_10', category: 'KI-Assistent', icon: 'fa-robot', name: 'KI-Neugierig', desc: '10 Nachrichten an den KI-Assistenten gesendet', target: 10, progress: p => p.stats?.ki || 0, check: p => (p.stats?.ki || 0) >= 10 },
    { id: 'ki_50', category: 'KI-Assistent', icon: 'fa-robot', name: 'KI-Vielnutzer', desc: '50 Nachrichten an den KI-Assistenten gesendet', target: 50, progress: p => p.stats?.ki || 0, check: p => (p.stats?.ki || 0) >= 50 },

    { id: 'timetable_5', category: 'Stundenplan', icon: 'fa-table-cells', name: 'Stundenplan-Baumeister', desc: '5 Stundenplan-Einträge angelegt', target: 5, progress: p => p.stats?.timetable || 0, check: p => (p.stats?.timetable || 0) >= 5 }
];

// Reihenfolge, in der die Badge-Kategorien im Fortschritt angezeigt werden
const BADGE_CATEGORY_ORDER = ['Meilensteine', 'Streak', 'Level', 'Hausaufgaben', 'Karteikarten', 'Pomodoro', 'Noten', 'Kalender', 'KI-Assistent', 'Stundenplan'];

Object.assign(App, {

    setupProgress() {
        document.getElementById('streak-flame-badge').addEventListener('click', () => {
            document.querySelector('.nav-links li[data-section="fortschritt"]')?.click();
        });
        this.renderStreakBadge();
    },

    getLevelInfo(xp) {
        // Level threshold grows: 100, 200, 300 ... XP needed per level
        let level = 1;
        let remaining = xp;
        let needed = 100;
        while (remaining >= needed) {
            remaining -= needed;
            level++;
            needed = level * 100;
        }
        return { level, xpIntoLevel: remaining, xpForNextLevel: needed };
    },

    todayStr() {
        return new Date().toISOString().split('T')[0];
    },

    yesterdayStr() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    },

    daysBetween(dateStrA, dateStrB) {
        const a = new Date(dateStrA + 'T00:00:00');
        const b = new Date(dateStrB + 'T00:00:00');
        return Math.round((b - a) / 86400000);
    },

    // Prüft, ob der Streak gerissen ist: Duolingo-typisch bleibt er erhalten,
    // solange spätestens am Tag NACH der letzten Aktivität wieder etwas gemacht
    // wird (unabhängig von der Uhrzeit). Wurde ein ganzer Kalendertag komplett
    // ausgelassen, wird der Streak auf 0 zurückgesetzt — das prüfen wir hier aktiv
    // (beim Laden der Daten sowie vor jedem Streak-Render), damit die Flamme auch
    // ohne neue Aktion sofort korrekt "erloschen" ist.
    //
    // Streak-Freezes: Wurde genau EIN ganzer Tag ausgelassen und ist mindestens
    // ein Freeze vorhanden, wird der Streak automatisch gerettet (kein Zutun
    // nötig, ganz wie bei Duolingo). Mehrere ausgelassene Tage am Stück reißen
    // den Streak trotzdem, ein Freeze schützt immer nur einen einzelnen Tag.
    checkStreakExpiry() {
        const p = this.progress;
        if (!p || !p.lastActiveDate || !p.streak) return;
        const today = this.todayStr();
        const yesterday = this.yesterdayStr();
        if (p.lastActiveDate === today || p.lastActiveDate === yesterday) return;

        const gap = this.daysBetween(p.lastActiveDate, today);
        if (gap === 2 && (p.streakFreezes || 0) > 0) {
            p.streakFreezes -= 1;
            p.lastActiveDate = yesterday;
            this.saveData('progress', p);
            this.showNotification(`🧊 Streak-Freeze eingesetzt – dein ${p.streak}-Tage-Streak bleibt erhalten!`, 'info');
            return;
        }

        p.streak = 0;
        this.saveData('progress', p);
    },

    // Farbig ist die Flamme nur an Tagen, an denen bereits etwas gemacht wurde.
    isActiveToday() {
        return this.progress?.lastActiveDate === this.todayStr();
    },

    awardXP(amount, reason, statKey) {
        const p = this.progress;
        const today = this.todayStr();

        if (p.lastActiveDate !== today) {
            if (p.lastActiveDate === this.yesterdayStr()) {
                // Gestern aktiv, heute die erste Aktion -> Streak geht weiter
                p.streak += 1;
            } else {
                // Erste Aktion überhaupt, oder mindestens ein ganzer Tag ausgelassen -> Streak startet neu
                p.streak = 1;
            }
            p.lastActiveDate = today;
        }

        const levelBefore = this.getLevelInfo(p.xp).level;

        p.xp += amount;
        p.coins = (p.coins || 0) + amount;
        p.totalActions = (p.totalActions || 0) + 1;
        if (statKey) {
            if (!p.stats) p.stats = { homework: 0, cards: 0, pomodoro: 0, grades: 0 };
            p.stats[statKey] = (p.stats[statKey] || 0) + 1;
        }

        const levelAfter = this.getLevelInfo(p.xp).level;
        const { newlyEarned, freezesAwarded } = this.checkNewBadges();

        this.saveData('progress', p);
        this.renderStreakBadge();
        if (this.state.currentSection === 'fortschritt') this.renderProgress();
        if (this.state.currentSection === 'shop') this.renderShopBalance();
        if (this.state.currentSection === 'dashboard') this.updateDashboard();

        newlyEarned.forEach(b => {
            this.showNotification(`Abzeichen freigeschaltet: ${b.name} 🎉`, 'success');
        });
        if (freezesAwarded > 0) {
            this.showNotification(`🧊 ${freezesAwarded === 1 ? 'Streak-Freeze' : freezesAwarded + ' Streak-Freezes'} erhalten! (jetzt: ${p.streakFreezes})`, 'info');
        }
        if (levelAfter > levelBefore) {
            this.playLevelUpSound();
            this.showLevelUpCelebration(levelAfter);
        }
    },

    checkNewBadges() {
        const p = this.progress;
        if (!p.badges) p.badges = [];
        if (p.streakFreezes === undefined) p.streakFreezes = 0;
        const newlyEarned = [];
        let freezesAwarded = 0;
        PROGRESS_BADGES.forEach(b => {
            if (!p.badges.includes(b.id) && b.check(p)) {
                p.badges.push(b.id);
                newlyEarned.push(b);
                // Streak-Meilensteine belohnen zusätzlich mit einem Streak-Freeze (bis zum Cap)
                if (b.category === 'Streak' && p.streakFreezes < this.MAX_STREAK_FREEZES) {
                    p.streakFreezes += 1;
                    freezesAwarded += 1;
                }
            }
        });
        return { newlyEarned, freezesAwarded };
    },

    renderStreakBadge() {
        const el = document.getElementById('streak-flame-count');
        const badge = document.getElementById('streak-flame-badge');
        if (!el || !badge) return;
        this.checkStreakExpiry();
        const streak = this.progress?.streak || 0;
        el.textContent = streak;
        // Farbig nur, wenn heute bereits eine Aktion stattgefunden hat — sonst grau,
        // auch wenn der Streak-Zähler selbst noch nicht auf 0 zurückgesetzt wurde.
        badge.classList.toggle('streak-active', streak > 0 && this.isActiveToday());
    },

    renderProgress() {
        this.checkStreakExpiry();
        const p = this.progress;
        const { level, xpIntoLevel, xpForNextLevel } = this.getLevelInfo(p.xp);
        const activeToday = this.isActiveToday();

        document.getElementById('streak-hero-count').textContent = p.streak || 0;
        document.getElementById('streak-hero-label').textContent =
            (p.streak || 0) === 1 ? 'Tag in Folge aktiv' : 'Tage in Folge aktiv';
        document.getElementById('streak-hero-flame').classList.toggle('streak-active', (p.streak || 0) > 0 && activeToday);

        const freezeCountEl = document.getElementById('streak-freeze-count');
        const freezeIndicator = document.getElementById('streak-freeze-indicator');
        if (freezeCountEl) freezeCountEl.textContent = p.streakFreezes || 0;
        if (freezeIndicator) freezeIndicator.classList.toggle('has-freezes', (p.streakFreezes || 0) > 0);

        document.getElementById('level-badge').textContent = `Lvl ${level}`;
        document.getElementById('level-xp-current').textContent = xpIntoLevel;
        document.getElementById('level-xp-next').textContent = xpForNextLevel;
        document.getElementById('level-progress-fill').style.width = `${(xpIntoLevel / xpForNextLevel) * 100}%`;

        const byCategory = {};
        PROGRESS_BADGES.forEach(b => {
            if (!byCategory[b.category]) byCategory[b.category] = [];
            byCategory[b.category].push(b);
        });

        const grid = document.getElementById('badges-grid');
        grid.innerHTML = BADGE_CATEGORY_ORDER.filter(cat => byCategory[cat]).map(cat => {
            const badgesInCat = byCategory[cat];
            const earnedCount = badgesInCat.filter(b => (p.badges || []).includes(b.id)).length;

            const tiles = badgesInCat.map(b => {
                const earned = (p.badges || []).includes(b.id);
                let progressHtml = '';
                if (!earned && b.target && b.progress) {
                    const current = Math.min(b.progress(p) || 0, b.target);
                    const pct = Math.max(0, Math.min(100, (current / b.target) * 100));
                    progressHtml = `
                        <div class="badge-progress">
                            <div class="badge-progress-bar"><div class="badge-progress-fill" style="width:${pct}%;"></div></div>
                            <div class="badge-progress-text">${current}/${b.target}</div>
                        </div>
                    `;
                }
                return `
                    <div class="badge-tile ${earned ? 'earned' : 'locked'}">
                        <div class="badge-icon"><i class="fas ${b.icon}"></i></div>
                        <div class="badge-name">${b.name}</div>
                        <div class="badge-desc">${b.desc}</div>
                        ${progressHtml}
                    </div>
                `;
            }).join('');

            const catKey = `badge:${cat}`;
            const collapsed = this.isCategoryCollapsed(catKey);
            return `
                <div class="badge-category-group ${collapsed ? 'collapsed' : ''}" data-category-key="${catKey}">
                    <h4 class="badge-category-heading" onclick="App.toggleCategory('${catKey}')">
                        <i class="fas fa-chevron-right category-collapse-caret"></i>
                        <span class="category-heading-label">${cat}</span>
                        <span class="badge-category-count">${earnedCount}/${badgesInCat.length}</span>
                    </h4>
                    <div class="badge-category-grid">${tiles}</div>
                </div>
            `;
        }).join('');
    },

    // ===== Level-Up-Feedback =====
    playLevelUpSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
            notes.forEach((freq, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.type = 'triangle';
                o.frequency.value = freq;
                const start = ctx.currentTime + i * 0.11;
                g.gain.setValueAtTime(0.0001, start);
                g.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
                o.start(start);
                o.stop(start + 0.4);
            });
        } catch (e) { /* ignore */ }
    },

    showLevelUpCelebration(level) {
        const overlay = document.createElement('div');
        overlay.className = 'levelup-overlay';

        const colors = ['#15803d', '#f97316', '#3b82f6', '#eab308', '#ec4899'];
        let confetti = '';
        for (let i = 0; i < 26; i++) {
            const left = Math.random() * 100;
            const delay = (Math.random() * 0.4).toFixed(2);
            const duration = (1.5 + Math.random() * 1).toFixed(2);
            const color = colors[i % colors.length];
            confetti += `<span class="levelup-confetti" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;"></span>`;
        }

        const activeIconId = this.shop?.activeLevelUpIcon || 'star';
        const activeIcon = this.levelUpCatalog.find(i => i.id === activeIconId)?.icon || 'fa-star';

        overlay.innerHTML = `
            <div class="levelup-confetti-layer">${confetti}</div>
            <div class="levelup-card">
                <div class="levelup-star"><i class="fas ${activeIcon}"></i></div>
                <div class="levelup-title">Level ${level} erreicht!</div>
                <div class="levelup-sub">Weiter so – dein Fleiß zahlt sich aus 🎉</div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => overlay.remove());
        setTimeout(() => {
            overlay.classList.add('levelup-fade-out');
            setTimeout(() => overlay.remove(), 400);
        }, 2800);
    },

    // ===== Punkte-Shop =====
    // Fester Katalog statt frei erstellbarer Belohnungen: kosmetische
    // App-Anpassungen (Akzentfarben, Level-Up-Icon) und Streak-Freezes.
    // Beides wird mit den zusammen mit XP gesammelten Punkten (progress.coins)
    // gekauft. Freigeschaltete Items, aktive Auswahl und der Kaufverlauf
    // werden unter dem Datenschlüssel 'shop' gespeichert.
    MAX_STREAK_FREEZES: 5,
    FREEZE_BASE_COST: 120,
    FREEZE_COST_STEP: 60,

    accentCatalog: [
        { id: 'default', name: 'Waldgrün', desc: 'Der klassische OnePlan-Look', cost: 0, colors: { color: '#15803d' } },
        { id: 'mint', name: 'Minze', desc: 'Frisches, helles Grün', cost: 160, colors: { color: '#0d9488' } },
        { id: 'ocean', name: 'Ozeanblau', desc: 'Frisches, kühles Blau', cost: 160, colors: { color: '#0284c7' } },
        { id: 'indigo', name: 'Indigo', desc: 'Tiefes Blau-Violett', cost: 160, colors: { color: '#4f46e5' } },
        { id: 'berry', name: 'Beerenlila', desc: 'Kräftiges Violett', cost: 160, colors: { color: '#7c3aed' } },
        { id: 'sunset', name: 'Sonnenuntergang', desc: 'Warmes Orange', cost: 160, colors: { color: '#ea580c' } },
        { id: 'cherry', name: 'Kirschrot', desc: 'Ausdrucksstarkes Rot', cost: 160, colors: { color: '#dc2626' } },
        { id: 'slate', name: 'Anthrazit', desc: 'Edles, gedecktes Grau-Blau', cost: 160, colors: { color: '#475569' } },
        { id: 'gold', name: 'Gold', desc: 'Edles, warmes Gelb', cost: 160, colors: { color: '#ca8a04' } },
        { id: 'rose', name: 'Rosé', desc: 'Sanftes Pink', cost: 160, colors: { color: '#db2777' } }
    ],

    levelUpCatalog: [
        { id: 'star', name: 'Stern', desc: 'Der klassische Level-Up-Stern', cost: 0, icon: 'fa-star' },
        { id: 'bolt', name: 'Blitz', desc: 'Schnell und energiegeladen', cost: 100, icon: 'fa-bolt' },
        { id: 'fire', name: 'Flamme', desc: 'Für heiße Serien', cost: 100, icon: 'fa-fire' },
        { id: 'trophy', name: 'Pokal', desc: 'Für echte Gewinner', cost: 100, icon: 'fa-trophy' },
        { id: 'rocket', name: 'Rakete', desc: 'Durch die Decke', cost: 100, icon: 'fa-rocket' },
        { id: 'crown', name: 'Krone', desc: 'Das Premium-Level-Up', cost: 100, icon: 'fa-crown' }
    ],

    flameCatalog: [
        { id: 'classic', name: 'Klassisch', desc: 'Die original OnePlan-Flamme', cost: 0, color: '#f97316', glow: 'rgba(249, 115, 22, 0.55)' },
        { id: 'blue', name: 'Blaue Flamme', desc: 'Kühl und intensiv', cost: 120, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.55)' },
        { id: 'teal', name: 'Türkisflamme', desc: 'Frisch und klar', cost: 120, color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.55)' },
        { id: 'purple', name: 'Violette Flamme', desc: 'Mystisch und edel', cost: 120, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.55)' },
        { id: 'red', name: 'Rote Flamme', desc: 'Pure Intensität', cost: 120, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.55)' },
        { id: 'pink', name: 'Pinke Flamme', desc: 'Auffällig und mutig', cost: 120, color: '#ec4899', glow: 'rgba(236, 72, 153, 0.55)' },
        { id: 'ice', name: 'Eisflamme', desc: 'Kalt brennt sie am längsten', cost: 120, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
        { id: 'gold', name: 'Goldflamme', desc: 'Die seltenste Farbe im Shop', cost: 120, color: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' }
    ],

    cardDesignCatalog: [
        { id: 'classic', name: 'Klassisch', desc: 'Das original OnePlan-Kartendesign', cost: 0, front: ['var(--primary-color)', 'var(--primary-dark)'], back: ['#1e293b', '#334155'] },
        { id: 'ocean', name: 'Ozean', desc: 'Kühle Blautöne für Vorder- und Rückseite', cost: 100, front: ['#0284c7', '#075985'], back: ['#0c4a6e', '#164e63'] },
        { id: 'sunset', name: 'Sonnenuntergang', desc: 'Warme Orange-Rot-Verläufe', cost: 100, front: ['#f97316', '#dc2626'], back: ['#7c2d12', '#9d174d'] },
        { id: 'rose', name: 'Rosé', desc: 'Sanftes Pink für Vorder- und Rückseite', cost: 100, front: ['#ec4899', '#be185d'], back: ['#831843', '#500724'] },
        { id: 'lavender', name: 'Lavendel', desc: 'Sanftes, edles Violett', cost: 100, front: ['#8b5cf6', '#6d28d9'], back: ['#4c1d95', '#312e81'] },
        { id: 'mono', name: 'Mono', desc: 'Schlichtes Schwarz-Grau, sehr aufgeräumt', cost: 100, front: ['#111827', '#1f2937'], back: ['#374151', '#4b5563'] },
        { id: 'gold', name: 'Gold', desc: 'Edles Design für Vielkarteikartenlerner', cost: 100, front: ['#ca8a04', '#92400e'], back: ['#78350f', '#451a03'] }
    ],

    titleFontCatalog: [
        { id: 'default', name: 'Standard', desc: 'Die normale OnePlan-Schrift', cost: 0, fontFamily: 'inherit', previewFont: 'inherit' },
        { id: 'poppins', name: 'Poppins', desc: 'Rund, modern und freundlich', cost: 100, fontFamily: "'Poppins', sans-serif", previewFont: "'Poppins', sans-serif" },
        { id: 'grotesk', name: 'Space Grotesk', desc: 'Klar, technisch, aufgeräumt', cost: 100, fontFamily: "'Space Grotesk', sans-serif", previewFont: "'Space Grotesk', sans-serif" },
        { id: 'fraunces', name: 'Fraunces', desc: 'Elegante Serifenschrift', cost: 100, fontFamily: "'Fraunces', serif", previewFont: "'Fraunces', serif" },
        { id: 'caveat', name: 'Caveat', desc: 'Verspielt und handschriftlich', cost: 100, fontFamily: "'Caveat', cursive", previewFont: "'Caveat', cursive" },
        { id: 'bebas', name: 'Bebas Neue', desc: 'Kräftige Headline-Schrift', cost: 100, fontFamily: "'Bebas Neue', sans-serif", previewFont: "'Bebas Neue', sans-serif" }
    ],


    // Streak-Freezes werden mit jedem bereits vorhandenen Freeze teurer –
    // sie sollen ein wertvolles, bewusst eingesetztes Gut bleiben, kein
    // Spontankauf.
    freezeCost(owned) {
        return this.FREEZE_BASE_COST + owned * this.FREEZE_COST_STEP;
    },

    setupShop() {
        this.renderShopBalance();
    },

    renderShopBalance() {
        const el = document.getElementById('shop-coin-balance');
        if (el) el.textContent = this.progress?.coins || 0;
    },

    applyAccent(accentId) {
        document.documentElement.setAttribute('data-accent', accentId || 'default');
    },

    // Wendet eine Akzentfarbe testweise an, ohne sie zu kaufen oder zu
    // speichern. Ein Banner zeigt an, dass es sich um eine Vorschau handelt;
    // beim Verlassen des Shops oder per Klick wird sie automatisch zurückgesetzt.
    previewAccent(accentId) {
        this.state.previewAccent = accentId;
        this.applyAccent(accentId);
        this.renderShop();
    },

    stopAccentPreview(skipRender) {
        this.state.previewAccent = null;
        this.applyAccent(this.shop?.activeAccent || 'default');
        if (!skipRender) this.renderShop();
    },

    applyFlame(flameId) {
        const item = this.flameCatalog.find(f => f.id === flameId) || this.flameCatalog[0];
        document.documentElement.style.setProperty('--flame-color', item.color);
        document.documentElement.style.setProperty('--flame-glow', item.glow);
    },

    // Wendet eine Flammenfarbe testweise an, ohne sie zu kaufen oder zu
    // speichern. Wirkt sich auf Dashboard, Sidebar-Badge und Fortschritts-
    // Seite aus, da diese alle dieselbe CSS-Variable nutzen.
    previewFlame(flameId) {
        this.state.previewFlame = flameId;
        this.applyFlame(flameId);
        this.renderShop();
    },

    stopFlamePreview(skipRender) {
        this.state.previewFlame = null;
        this.applyFlame(this.shop?.activeFlame || 'classic');
        if (!skipRender) this.renderShop();
    },

    applyCardDesign(designId) {
        const item = this.cardDesignCatalog.find(d => d.id === designId) || this.cardDesignCatalog[0];
        document.documentElement.style.setProperty('--fc-front-start', item.front[0]);
        document.documentElement.style.setProperty('--fc-front-end', item.front[1]);
        document.documentElement.style.setProperty('--fc-back-start', item.back[0]);
        document.documentElement.style.setProperty('--fc-back-end', item.back[1]);
    },

    // Vorschau eines Karteikarten-Designs: wendet die Farben live an (auch
    // auf eine echte spätere Lernkarte) und zeigt zusätzlich ein Pop-up mit
    // einer Mini-Karteikarte zum Antippen/Umdrehen – ohne zu kaufen oder zu
    // speichern.
    previewCardDesign(designId) {
        this.state.previewCardDesign = designId;
        this.applyCardDesign(designId);
        this.renderShop();
        this.showCardDesignPreviewPopup(designId);
    },

    showCardDesignPreviewPopup(designId) {
        const item = this.cardDesignCatalog.find(d => d.id === designId);
        if (!item) return;
        this.showModal(`
            <h3><i class="fas fa-clone" style="color:var(--primary-color);"></i> Vorschau: ${item.name}</h3>
            <div class="shop-fc-preview-wrap">
                <div class="shop-fc-preview-card" onclick="this.querySelector('.shop-fc-preview-inner').classList.toggle('flipped')">
                    <div class="shop-fc-preview-inner">
                        <div class="shop-fc-preview-front"><span class="shop-fc-preview-label">Frage</span>Wie sieht deine Karte aus?</div>
                        <div class="shop-fc-preview-back"><span class="shop-fc-preview-label">Antwort</span>So wie hier! 🎉</div>
                    </div>
                </div>
                <p class="shop-fc-preview-hint"><i class="fas fa-hand-pointer"></i> Tippen zum Umdrehen</p>
            </div>
            <button class="btn-primary btn-full" onclick="App.closeModal()" style="margin-top:12px;">Schließen</button>
        `);
    },

    stopCardDesignPreview(skipRender) {
        this.state.previewCardDesign = null;
        this.applyCardDesign(this.shop?.activeCardDesign || 'classic');
        if (!skipRender) this.renderShop();
    },

    applyTitleFont(fontId) {
        const item = this.titleFontCatalog.find(f => f.id === fontId) || this.titleFontCatalog[0];
        document.documentElement.style.setProperty('--title-font', item.fontFamily);
    },

    // Vorschau einer Titel-Schriftart: wirkt sofort auf Sidebar-Logo und
    // Seitentitel, ohne zu kaufen oder zu speichern.
    previewTitleFont(fontId) {
        this.state.previewTitleFont = fontId;
        this.applyTitleFont(fontId);
        this.renderShop();
    },

    stopTitleFontPreview(skipRender) {
        this.state.previewTitleFont = null;
        this.applyTitleFont(this.shop?.activeTitleFont || 'default');
        if (!skipRender) this.renderShop();
    },

    // Zeigt kurz das echte Level-Up-Overlay mit dem gewählten Icon, ohne
    // dass wirklich ein Level-Up stattfindet – reine Vorschau.
    previewLevelUpIcon(iconId) {
        const item = this.levelUpCatalog.find(i => i.id === iconId);
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'levelup-overlay';

        const colors = ['#15803d', '#f97316', '#3b82f6', '#eab308', '#ec4899'];
        let confetti = '';
        for (let i = 0; i < 26; i++) {
            const left = Math.random() * 100;
            const delay = (Math.random() * 0.4).toFixed(2);
            const duration = (1.5 + Math.random() * 1).toFixed(2);
            const color = colors[i % colors.length];
            confetti += `<span class="levelup-confetti" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;"></span>`;
        }

        overlay.innerHTML = `
            <div class="levelup-confetti-layer">${confetti}</div>
            <div class="levelup-card">
                <div class="levelup-preview-tag">Vorschau</div>
                <div class="levelup-star"><i class="fas ${item.icon}"></i></div>
                <div class="levelup-title">Level 12 erreicht!</div>
                <div class="levelup-sub">So sieht dein Level-Up mit „${item.name}“ aus 🎉</div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => overlay.remove());
        setTimeout(() => {
            overlay.classList.add('levelup-fade-out');
            setTimeout(() => overlay.remove(), 400);
        }, 2200);
    },

    renderShop() {
        this.renderShopBalance();
        const grid = document.getElementById('shop-items-grid');
        if (!grid) return;

        const coins = this.progress?.coins || 0;
        const previewingAccent = this.state.previewAccent;

        // Kosmetik: Akzentfarben
        const unlockedAccents = this.shop?.unlockedAccents || ['default'];
        const activeAccent = this.shop?.activeAccent || 'default';
        const accentCards = this.accentCatalog.map(item => {
            const isUnlocked = unlockedAccents.includes(item.id);
            const isActive = activeAccent === item.id;
            const isPreviewing = previewingAccent === item.id;
            const affordable = coins >= item.cost;
            let btn;
            if (isActive) {
                btn = `<button class="btn-secondary btn-small shop-item-redeem-btn" disabled><i class="fas fa-check"></i> Aktiv</button>`;
            } else if (isUnlocked) {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" onclick="App.equipAccent('${item.id}')"><i class="fas fa-paintbrush"></i> Anwenden</button>`;
            } else {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" ${affordable ? '' : 'disabled'} onclick="App.buyAccent('${item.id}')"><i class="fas fa-coins"></i> ${item.cost === 0 ? 'Freischalten' : 'Kaufen'}</button>`;
            }
            const previewBtn = isActive ? '' : (isPreviewing
                ? `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.stopAccentPreview()"><i class="fas fa-eye-slash"></i> Vorschau beenden</button>`
                : `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.previewAccent('${item.id}')"><i class="fas fa-eye"></i> Vorschau</button>`);
            return `
                <div class="shop-item-card ${!isUnlocked && !affordable ? 'unaffordable' : ''} ${isActive ? 'equipped' : ''} ${isPreviewing ? 'previewing' : ''}">
                    ${isActive ? '<div class="shop-item-badge">Aktiv</div>' : (isPreviewing ? '<div class="shop-item-badge shop-item-badge-preview">Vorschau</div>' : (isUnlocked ? '<div class="shop-item-badge shop-item-badge-owned">Freigeschaltet</div>' : ''))}
                    <div class="shop-item-icon accent-swatch" style="background:${item.colors.color};"><i class="fas fa-palette"></i></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${!isUnlocked ? `<div class="shop-item-cost"><i class="fas fa-coins"></i> ${item.cost}</div>` : ''}
                    <div class="shop-item-btn-row">${previewBtn}${btn}</div>
                </div>
            `;
        }).join('');

        // Kosmetik: Level-Up-Icon
        const unlockedIcons = this.shop?.unlockedLevelUpIcons || ['star'];
        const activeIcon = this.shop?.activeLevelUpIcon || 'star';
        const levelUpCards = this.levelUpCatalog.map(item => {
            const isUnlocked = unlockedIcons.includes(item.id);
            const isActive = activeIcon === item.id;
            const affordable = coins >= item.cost;
            let btn;
            if (isActive) {
                btn = `<button class="btn-secondary btn-small shop-item-redeem-btn" disabled><i class="fas fa-check"></i> Aktiv</button>`;
            } else if (isUnlocked) {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" onclick="App.equipLevelUpIcon('${item.id}')"><i class="fas fa-paintbrush"></i> Anwenden</button>`;
            } else {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" ${affordable ? '' : 'disabled'} onclick="App.buyLevelUpIcon('${item.id}')"><i class="fas fa-coins"></i> ${item.cost === 0 ? 'Freischalten' : 'Kaufen'}</button>`;
            }
            const previewBtn = isActive ? '' : `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.previewLevelUpIcon('${item.id}')"><i class="fas fa-eye"></i> Vorschau</button>`;
            return `
                <div class="shop-item-card ${!isUnlocked && !affordable ? 'unaffordable' : ''} ${isActive ? 'equipped' : ''}">
                    ${isActive ? '<div class="shop-item-badge">Aktiv</div>' : (isUnlocked ? '<div class="shop-item-badge shop-item-badge-owned">Freigeschaltet</div>' : '')}
                    <div class="shop-item-icon"><i class="fas ${item.icon}"></i></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${!isUnlocked ? `<div class="shop-item-cost"><i class="fas fa-coins"></i> ${item.cost}</div>` : ''}
                    <div class="shop-item-btn-row">${previewBtn}${btn}</div>
                </div>
            `;
        }).join('');

        // Kosmetik: Streak-Flamme
        const unlockedFlames = this.shop?.unlockedFlames || ['classic'];
        const activeFlame = this.shop?.activeFlame || 'classic';
        const previewingFlame = this.state.previewFlame;
        const flameCards = this.flameCatalog.map(item => {
            const isUnlocked = unlockedFlames.includes(item.id);
            const isActive = activeFlame === item.id;
            const isPreviewing = previewingFlame === item.id;
            const affordable = coins >= item.cost;
            let btn;
            if (isActive) {
                btn = `<button class="btn-secondary btn-small shop-item-redeem-btn" disabled><i class="fas fa-check"></i> Aktiv</button>`;
            } else if (isUnlocked) {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" onclick="App.equipFlame('${item.id}')"><i class="fas fa-paintbrush"></i> Anwenden</button>`;
            } else {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" ${affordable ? '' : 'disabled'} onclick="App.buyFlame('${item.id}')"><i class="fas fa-coins"></i> ${item.cost === 0 ? 'Freischalten' : 'Kaufen'}</button>`;
            }
            const previewBtn = isActive ? '' : (isPreviewing
                ? `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.stopFlamePreview()"><i class="fas fa-eye-slash"></i> Vorschau beenden</button>`
                : `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.previewFlame('${item.id}')"><i class="fas fa-eye"></i> Vorschau</button>`);
            return `
                <div class="shop-item-card ${!isUnlocked && !affordable ? 'unaffordable' : ''} ${isActive ? 'equipped' : ''} ${isPreviewing ? 'previewing' : ''}">
                    ${isActive ? '<div class="shop-item-badge">Aktiv</div>' : (isPreviewing ? '<div class="shop-item-badge shop-item-badge-preview">Vorschau</div>' : (isUnlocked ? '<div class="shop-item-badge shop-item-badge-owned">Freigeschaltet</div>' : ''))}
                    <div class="shop-item-icon" style="background:${item.color}22;color:${item.color};"><i class="fas fa-fire"></i></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${!isUnlocked ? `<div class="shop-item-cost"><i class="fas fa-coins"></i> ${item.cost}</div>` : ''}
                    <div class="shop-item-btn-row">${previewBtn}${btn}</div>
                </div>
            `;
        }).join('');

        // Kosmetik: Karteikarten-Design
        const unlockedCardDesigns = this.shop?.unlockedCardDesigns || ['classic'];
        const activeCardDesign = this.shop?.activeCardDesign || 'classic';
        const previewingCardDesign = this.state.previewCardDesign;
        const cardDesignCards = this.cardDesignCatalog.map(item => {
            const isUnlocked = unlockedCardDesigns.includes(item.id);
            const isActive = activeCardDesign === item.id;
            const isPreviewing = previewingCardDesign === item.id;
            const affordable = coins >= item.cost;
            let btn;
            if (isActive) {
                btn = `<button class="btn-secondary btn-small shop-item-redeem-btn" disabled><i class="fas fa-check"></i> Aktiv</button>`;
            } else if (isUnlocked) {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" onclick="App.equipCardDesign('${item.id}')"><i class="fas fa-paintbrush"></i> Anwenden</button>`;
            } else {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" ${affordable ? '' : 'disabled'} onclick="App.buyCardDesign('${item.id}')"><i class="fas fa-coins"></i> ${item.cost === 0 ? 'Freischalten' : 'Kaufen'}</button>`;
            }
            const previewBtn = isActive ? '' : (isPreviewing
                ? `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.stopCardDesignPreview()"><i class="fas fa-eye-slash"></i> Vorschau beenden</button>`
                : `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.previewCardDesign('${item.id}')"><i class="fas fa-eye"></i> Vorschau</button>`);
            return `
                <div class="shop-item-card ${!isUnlocked && !affordable ? 'unaffordable' : ''} ${isActive ? 'equipped' : ''} ${isPreviewing ? 'previewing' : ''}">
                    ${isActive ? '<div class="shop-item-badge">Aktiv</div>' : (isPreviewing ? '<div class="shop-item-badge shop-item-badge-preview">Vorschau</div>' : (isUnlocked ? '<div class="shop-item-badge shop-item-badge-owned">Freigeschaltet</div>' : ''))}
                    <div class="shop-item-icon fc-swatch" style="background:linear-gradient(135deg, ${item.front[0]}, ${item.front[1]});"><i class="fas fa-clone"></i></div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${!isUnlocked ? `<div class="shop-item-cost"><i class="fas fa-coins"></i> ${item.cost}</div>` : ''}
                    <div class="shop-item-btn-row">${previewBtn}${btn}</div>
                </div>
            `;
        }).join('');

        // Kosmetik: App-Titel-Schriftart
        const unlockedTitleFonts = this.shop?.unlockedTitleFonts || ['default'];
        const activeTitleFont = this.shop?.activeTitleFont || 'default';
        const previewingTitleFont = this.state.previewTitleFont;
        const titleFontCards = this.titleFontCatalog.map(item => {
            const isUnlocked = unlockedTitleFonts.includes(item.id);
            const isActive = activeTitleFont === item.id;
            const isPreviewing = previewingTitleFont === item.id;
            const affordable = coins >= item.cost;
            let btn;
            if (isActive) {
                btn = `<button class="btn-secondary btn-small shop-item-redeem-btn" disabled><i class="fas fa-check"></i> Aktiv</button>`;
            } else if (isUnlocked) {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" onclick="App.equipTitleFont('${item.id}')"><i class="fas fa-paintbrush"></i> Anwenden</button>`;
            } else {
                btn = `<button class="btn-primary btn-small shop-item-redeem-btn" ${affordable ? '' : 'disabled'} onclick="App.buyTitleFont('${item.id}')"><i class="fas fa-coins"></i> ${item.cost === 0 ? 'Freischalten' : 'Kaufen'}</button>`;
            }
            const previewBtn = isActive ? '' : (isPreviewing
                ? `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.stopTitleFontPreview()"><i class="fas fa-eye-slash"></i> Vorschau beenden</button>`
                : `<button class="btn-secondary btn-small shop-item-preview-btn" onclick="App.previewTitleFont('${item.id}')"><i class="fas fa-eye"></i> Vorschau</button>`);
            return `
                <div class="shop-item-card ${!isUnlocked && !affordable ? 'unaffordable' : ''} ${isActive ? 'equipped' : ''} ${isPreviewing ? 'previewing' : ''}">
                    ${isActive ? '<div class="shop-item-badge">Aktiv</div>' : (isPreviewing ? '<div class="shop-item-badge shop-item-badge-preview">Vorschau</div>' : (isUnlocked ? '<div class="shop-item-badge shop-item-badge-owned">Freigeschaltet</div>' : ''))}
                    <div class="shop-item-icon shop-font-swatch" style="font-family:${item.previewFont};">Aa</div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                    ${!isUnlocked ? `<div class="shop-item-cost"><i class="fas fa-coins"></i> ${item.cost}</div>` : ''}
                    <div class="shop-item-btn-row">${previewBtn}${btn}</div>
                </div>
            `;
        }).join('');

        // Streak-Freeze (wird mit jedem Kauf teurer)
        const freezes = this.progress?.streakFreezes || 0;
        const capped = freezes >= this.MAX_STREAK_FREEZES;
        const nextCost = this.freezeCost(freezes);
        const freezeAffordable = coins >= nextCost && !capped;
        const freezeCard = `
            <div class="shop-item-card premium ${freezeAffordable ? '' : 'unaffordable'}">
                <div class="shop-item-badge shop-item-badge-owned">Vorrat: ${freezes}/${this.MAX_STREAK_FREEZES}</div>
                <div class="shop-item-icon"><i class="fas fa-snowflake"></i></div>
                <div class="shop-item-name">Streak-Freeze</div>
                <div class="shop-item-desc">Rettet deinen Streak automatisch, wenn du einen Tag verpasst – wird mit jedem Kauf teurer.</div>
                ${!capped ? `<div class="shop-item-cost"><i class="fas fa-coins"></i> ${nextCost}</div>` : ''}
                <button class="btn-primary btn-small shop-item-redeem-btn" ${freezeAffordable ? '' : 'disabled'} onclick="App.buyStreakFreeze()">
                    <i class="fas fa-cart-shopping"></i> ${capped ? 'Maximum erreicht' : 'Kaufen'}
                </button>
            </div>
        `;

        const previewBanners = [
            previewingAccent ? `
                <div class="shop-preview-banner">
                    <i class="fas fa-eye"></i>
                    <span>Vorschau aktiv: <strong>${this.accentCatalog.find(a => a.id === previewingAccent)?.name || ''}</strong> – so sieht die App gerade überall aus.</span>
                    <button class="btn-secondary btn-small" onclick="App.stopAccentPreview()">Zurücksetzen</button>
                </div>
            ` : '',
            previewingFlame ? `
                <div class="shop-preview-banner">
                    <i class="fas fa-fire"></i>
                    <span>Vorschau aktiv: <strong>${this.flameCatalog.find(f => f.id === previewingFlame)?.name || ''}</strong> – so sieht deine Streak-Flamme gerade aus.</span>
                    <button class="btn-secondary btn-small" onclick="App.stopFlamePreview()">Zurücksetzen</button>
                </div>
            ` : '',
            previewingCardDesign ? `
                <div class="shop-preview-banner">
                    <i class="fas fa-clone"></i>
                    <span>Vorschau aktiv: <strong>${this.cardDesignCatalog.find(d => d.id === previewingCardDesign)?.name || ''}</strong> – so sehen deine Karteikarten gerade aus.</span>
                    <button class="btn-secondary btn-small" onclick="App.stopCardDesignPreview()">Zurücksetzen</button>
                </div>
            ` : '',
            previewingTitleFont ? `
                <div class="shop-preview-banner">
                    <i class="fas fa-font"></i>
                    <span>Vorschau aktiv: <strong>${this.titleFontCatalog.find(f => f.id === previewingTitleFont)?.name || ''}</strong> – so sieht der App-Titel gerade aus.</span>
                    <button class="btn-secondary btn-small" onclick="App.stopTitleFontPreview()">Zurücksetzen</button>
                </div>
            ` : ''
        ].join('');

        const shopCategory = (key, icon, title, hint, contentHtml, extraHtml) => {
            const collapsed = this.isCategoryCollapsed(key);
            return `
                <div class="shop-category-group ${collapsed ? 'collapsed' : ''}" data-category-key="${key}">
                    <h3 class="badges-heading shop-category-heading" onclick="App.toggleCategory('${key}')">
                        <i class="fas fa-chevron-right category-collapse-caret"></i>
                        <i class="fas ${icon}" style="color:var(--primary-color);"></i>
                        <span class="category-heading-label">${title}</span>
                    </h3>
                    <div class="shop-category-body">
                        ${hint ? `<p class="shop-category-hint">${hint}</p>` : ''}
                        ${extraHtml || ''}
                        <div class="shop-items-grid">${contentHtml}</div>
                    </div>
                </div>
            `;
        };

        grid.innerHTML = `
            ${previewBanners}
            ${shopCategory('shop:freeze', 'fa-snowflake', 'Streak-Schutz', '', freezeCard)}
            ${shopCategory('shop:accent', 'fa-palette', 'Akzentfarbe', 'Mit „Vorschau“ siehst du die Farbe live in der ganzen App, ohne sie zu kaufen.', accentCards)}
            ${shopCategory('shop:levelup', 'fa-wand-magic-sparkles', 'Level-Up-Icon', 'Mit „Vorschau“ siehst du kurz, wie dein nächstes Level-Up aussehen würde.', levelUpCards)}
            ${shopCategory('shop:flame', 'fa-fire', 'Streak-Flamme', 'Mit „Vorschau“ siehst du die Flammenfarbe live im Dashboard, in der Kopfleiste und im Fortschritt.', flameCards)}
            ${shopCategory('shop:carddesign', 'fa-clone', 'Karteikarten-Design', 'Mit „Vorschau“ öffnet sich ein Pop-up mit einer Mini-Karteikarte in diesem Design.', cardDesignCards)}
            ${shopCategory('shop:titlefont', 'fa-font', 'App-Titel-Schriftart', 'Mit „Vorschau“ siehst du die Schriftart live im Sidebar-Logo und in den Seitentiteln.', titleFontCards)}
        `;
    },

    buyAccent(accentId) {
        const item = this.accentCatalog.find(a => a.id === accentId);
        if (!item) return;
        const unlocked = this.shop.unlockedAccents || (this.shop.unlockedAccents = ['default']);
        if (unlocked.includes(accentId)) return;

        const coins = this.progress?.coins || 0;
        if (coins < item.cost) {
            this.showNotification('Nicht genug Punkte für diese Farbe', 'error');
            return;
        }

        this.progress.coins = coins - item.cost;
        unlocked.push(accentId);
        this.recordShopPurchase(item.name, 'fa-palette', item.cost);
        this.equipAccent(accentId, true);
    },

    equipAccent(accentId, skipSave) {
        const unlocked = this.shop?.unlockedAccents || ['default'];
        if (!unlocked.includes(accentId)) return;
        this.shop.activeAccent = accentId;
        this.state.previewAccent = null;
        this.applyAccent(accentId);
        if (!skipSave) this.saveData('shop', this.shop);
        else {
            this.saveData('progress', this.progress);
            this.saveData('shop', this.shop);
        }
        this.renderShop();
        this.showNotification('🎨 Neue Farbe angewendet', 'success');
    },

    buyLevelUpIcon(iconId) {
        const item = this.levelUpCatalog.find(i => i.id === iconId);
        if (!item) return;
        const unlocked = this.shop.unlockedLevelUpIcons || (this.shop.unlockedLevelUpIcons = ['star']);
        if (unlocked.includes(iconId)) return;

        const coins = this.progress?.coins || 0;
        if (coins < item.cost) {
            this.showNotification('Nicht genug Punkte für dieses Icon', 'error');
            return;
        }

        this.progress.coins = coins - item.cost;
        unlocked.push(iconId);
        this.recordShopPurchase(item.name, item.icon, item.cost);
        this.equipLevelUpIcon(iconId, true);
    },

    equipLevelUpIcon(iconId, skipSave) {
        const unlocked = this.shop?.unlockedLevelUpIcons || ['star'];
        if (!unlocked.includes(iconId)) return;
        this.shop.activeLevelUpIcon = iconId;
        if (!skipSave) this.saveData('shop', this.shop);
        else {
            this.saveData('progress', this.progress);
            this.saveData('shop', this.shop);
        }
        this.renderShop();
        this.showNotification('✨ Neues Level-Up-Icon aktiv', 'success');
    },

    buyFlame(flameId) {
        const item = this.flameCatalog.find(f => f.id === flameId);
        if (!item) return;
        const unlocked = this.shop.unlockedFlames || (this.shop.unlockedFlames = ['classic']);
        if (unlocked.includes(flameId)) return;

        const coins = this.progress?.coins || 0;
        if (coins < item.cost) {
            this.showNotification('Nicht genug Punkte für diese Flammenfarbe', 'error');
            return;
        }

        this.progress.coins = coins - item.cost;
        unlocked.push(flameId);
        this.recordShopPurchase(item.name, 'fa-fire', item.cost);
        this.equipFlame(flameId, true);
    },

    equipFlame(flameId, skipSave) {
        const unlocked = this.shop?.unlockedFlames || ['classic'];
        if (!unlocked.includes(flameId)) return;
        this.shop.activeFlame = flameId;
        this.state.previewFlame = null;
        this.applyFlame(flameId);
        if (!skipSave) this.saveData('shop', this.shop);
        else {
            this.saveData('progress', this.progress);
            this.saveData('shop', this.shop);
        }
        this.renderShop();
        this.showNotification('🔥 Neue Flammenfarbe angewendet', 'success');
    },

    buyCardDesign(designId) {
        const item = this.cardDesignCatalog.find(d => d.id === designId);
        if (!item) return;
        const unlocked = this.shop.unlockedCardDesigns || (this.shop.unlockedCardDesigns = ['classic']);
        if (unlocked.includes(designId)) return;

        const coins = this.progress?.coins || 0;
        if (coins < item.cost) {
            this.showNotification('Nicht genug Punkte für dieses Kartendesign', 'error');
            return;
        }

        this.progress.coins = coins - item.cost;
        unlocked.push(designId);
        this.recordShopPurchase(item.name, 'fa-clone', item.cost);
        this.equipCardDesign(designId, true);
    },

    equipCardDesign(designId, skipSave) {
        const unlocked = this.shop?.unlockedCardDesigns || ['classic'];
        if (!unlocked.includes(designId)) return;
        this.shop.activeCardDesign = designId;
        this.state.previewCardDesign = null;
        this.applyCardDesign(designId);
        if (!skipSave) this.saveData('shop', this.shop);
        else {
            this.saveData('progress', this.progress);
            this.saveData('shop', this.shop);
        }
        this.renderShop();
        this.showNotification('🗂️ Neues Kartendesign angewendet', 'success');
    },

    buyTitleFont(fontId) {
        const item = this.titleFontCatalog.find(f => f.id === fontId);
        if (!item) return;
        const unlocked = this.shop.unlockedTitleFonts || (this.shop.unlockedTitleFonts = ['default']);
        if (unlocked.includes(fontId)) return;

        const coins = this.progress?.coins || 0;
        if (coins < item.cost) {
            this.showNotification('Nicht genug Punkte für diese Schriftart', 'error');
            return;
        }

        this.progress.coins = coins - item.cost;
        unlocked.push(fontId);
        this.recordShopPurchase(item.name, 'fa-font', item.cost);
        this.equipTitleFont(fontId, true);
    },

    equipTitleFont(fontId, skipSave) {
        const unlocked = this.shop?.unlockedTitleFonts || ['default'];
        if (!unlocked.includes(fontId)) return;
        this.shop.activeTitleFont = fontId;
        this.state.previewTitleFont = null;
        this.applyTitleFont(fontId);
        if (!skipSave) this.saveData('shop', this.shop);
        else {
            this.saveData('progress', this.progress);
            this.saveData('shop', this.shop);
        }
        this.renderShop();
        this.showNotification('🔤 Neue Titel-Schriftart angewendet', 'success');
    },

    buyStreakFreeze() {
        const coins = this.progress?.coins || 0;
        const freezes = this.progress?.streakFreezes || 0;

        if (freezes >= this.MAX_STREAK_FREEZES) {
            this.showNotification('Maximale Anzahl an Streak-Freezes erreicht', 'error');
            return;
        }
        const cost = this.freezeCost(freezes);
        if (coins < cost) {
            this.showNotification('Nicht genug Punkte für einen Streak-Freeze', 'error');
            return;
        }

        this.progress.coins = coins - cost;
        this.progress.streakFreezes = freezes + 1;
        this.recordShopPurchase('Streak-Freeze', 'fa-snowflake', cost);

        this.saveData('progress', this.progress);
        this.saveData('shop', this.shop);
        this.renderShop();
        this.renderStreakBadge();
        this.showNotification(`🧊 Streak-Freeze gekauft (jetzt: ${this.progress.streakFreezes})`, 'success');
    },

    recordShopPurchase(name, icon, cost) {
        if (!this.shop.history) this.shop.history = [];
        this.shop.history.unshift({
            id: 'redeem_' + Date.now(),
            name, icon, cost,
            date: new Date().toISOString()
        });
        // Verlauf auf die letzten 100 Einträge begrenzen
        if (this.shop.history.length > 100) this.shop.history = this.shop.history.slice(0, 100);
    },

    openShopHistoryModal() {
        const history = this.shop?.history || [];
        const rows = history.length
            ? history.map(h => `
                <div class="shop-history-row">
                    <div class="shop-history-icon"><i class="fas ${h.icon || 'fa-gift'}"></i></div>
                    <div class="shop-history-info">
                        <strong>${h.name}</strong>
                        <small>${new Date(h.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <div class="shop-history-cost"><i class="fas fa-coins"></i> ${h.cost}</div>
                </div>
            `).join('')
            : '<p style="color:var(--text-secondary);">Noch nichts im Shop gekauft.</p>';

        this.showModal(`
            <h3><i class="fas fa-clock-rotate-left"></i> Einlöse-Verlauf</h3>
            <div class="shop-history-list">${rows}</div>
        `);
    }
});
