// ===== Supabase Setup =====
const SUPABASE_URL = 'https://nothxzhzhjgpheqwquhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdGh4emh6aGpncGhlcXdxdWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTIwNDcsImV4cCI6MjA5NjYyODA0N30.yDXDBzHXJxy_Re-dNejiXAZiZyzoyrTPlS7X7fP_YeI';
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Account System =====
const Auth = {
    currentUser: null,

    async init() {
        this.setupListeners();
        this._sessionHandled = false;

        // Listen for auth changes. This also fires immediately with the
        // current session state when subscribed, so it covers the initial
        // page load too — no separate getSession()+loadProfile call needed.
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                this._sessionHandled = false;
                this.showAuthScreen();
                return;
            }
            if (session && !this._sessionHandled) {
                this._sessionHandled = true;
                await this.loadProfile(session.user);
            }
        });

        // If there's no session at all, show the login screen right away
        // (the listener above only fires for actual sessions).
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            document.getElementById('auth-overlay').classList.add('active');
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

    setupListeners() {
        document.getElementById('btn-login').addEventListener('click', () => this.login());
        document.getElementById('btn-register').addEventListener('click', () => this.register());

        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.remove('active');
            document.getElementById('register-form').classList.add('active');
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        });

        document.getElementById('btn-logout').addEventListener('click', () => this.logout());
        document.getElementById('btn-delete-account').addEventListener('click', () => this.deleteAccount());
        document.getElementById('btn-theme-toggle').addEventListener('click', () => this.toggleTheme());
        this.syncThemeUI();

        document.getElementById('user-avatar-btn').addEventListener('click', () => {
            document.getElementById('user-dropdown').classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!document.getElementById('user-menu-btn').contains(e.target)) {
                document.getElementById('user-dropdown').classList.add('hidden');
            }
        });

        ['login-username', 'login-password'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.login();
            });
        });
        ['reg-name', 'reg-username', 'reg-email', 'reg-password', 'reg-password2'].forEach(id => {
            document.getElementById(id).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.register();
            });
        });
    },

    async login() {
        const email = document.getElementById('login-username').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showAuthError('login-form', 'Bitte alle Felder ausfüllen');
            return;
        }

        this.setLoading('btn-login', true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            this.showAuthError('login-form', 'E-Mail oder Passwort falsch');
        }

        this.setLoading('btn-login', false);
    },

    async register() {
        const name = document.getElementById('reg-name').value.trim();
        const username = document.getElementById('reg-username').value.trim().toLowerCase();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const password2 = document.getElementById('reg-password2').value;

        if (!name || !username || !email || !password) {
            this.showAuthError('register-form', 'Bitte alle Felder ausfüllen');
            return;
        }
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            this.showAuthError('register-form', 'Benutzername: 3–20 Zeichen, nur Buchstaben/Zahlen/_');
            return;
        }
        if (password.length < 6) {
            this.showAuthError('register-form', 'Passwort muss mindestens 6 Zeichen haben');
            return;
        }
        if (password !== password2) {
            this.showAuthError('register-form', 'Passwörter stimmen nicht überein');
            return;
        }

        // Check if username already taken
        const { data: existing } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (existing) {
            this.showAuthError('register-form', 'Benutzername bereits vergeben');
            return;
        }

        this.setLoading('btn-register', true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, username } }
        });

        if (error) {
            this.showAuthError('register-form', error.message);
            this.setLoading('btn-register', false);
            return;
        }

        // Create profile row
        if (data.user) {
            await supabase.from('profiles').insert({
                id: data.user.id,
                name,
                username,
                email
            });
        }

        this.setLoading('btn-register', false);
    },

    showApp(user) {
        document.getElementById('auth-overlay').classList.remove('active');
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('user-menu-btn').style.display = 'flex';
        document.getElementById('mobile-nav').style.display = 'flex';

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
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        App.userId = null;
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
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<i class="fas fa-spinner fa-spin"></i> Bitte warten...'
            : btnId === 'btn-login'
                ? '<i class="fas fa-sign-in-alt"></i> Anmelden'
                : '<i class="fas fa-user-plus"></i> Registrieren';
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
        homeworkFilter: 'all'
    },

    // Initialize the application
    async init() {
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
        this.setupModal();
        this.updateDashboard();
        this.checkReminders();
        // Check reminders every minute
        setInterval(() => this.checkReminders(), 60000);
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
        this.flashcards = map['flashcards'] || [];
        this.progress = map['progress'] || { xp: 0, streak: 0, lastActiveDate: null, totalActions: 0, badges: [] };
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
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });
        this.state.currentSection = section;
        
        // Refresh section data
        switch(section) {
            case 'dashboard': this.updateDashboard(); break;
            case 'kalender': this.renderCalendar(); break;
            case 'stundenplan': this.renderTimetable(); break;
            case 'hausaufgaben': this.renderHomework(); break;
            case 'noten': this.renderGrades(); break;
            case 'feedback': if (this.isAdmin()) this.loadAdminFeedback(); break;
            case 'karteikarten': this.renderFlashcardDecks(); break;
            case 'fortschritt': this.renderProgress(); break;
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

        container.innerHTML = '<h3>Anstehende Termine</h3>' + upcoming.map(event => `
            <div class="event-item">
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <span>${this.formatDate(event.date)}${event.time ? ' um ' + event.time : ''}</span>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                </div>
                <button class="btn-small btn-danger" onclick="App.deleteEvent(${event.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
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

        const periods = ['1. (07:40-08:25)', '2. (08:30-09:15)', '3. (09:30-10:15)', '4. (10:20-11:05)', '5. (11:25-12:10)',
                        '6. (12:15-13:00)', '7. (13:45-14:30)', '8. (14:30-15:15)'];

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
                            ` : '<span style="color: var(--text-light)">-</span>'}
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

        container.innerHTML = filtered.map(hw => `
            <div class="homework-item ${hw.done ? 'done' : ''} priority-${hw.priority}">
                <div class="homework-info">
                    <h4>${hw.subject}</h4>
                    <p>${hw.task}</p>
                    <span class="due-date">
                        <i class="fas fa-clock"></i> Fällig: ${this.formatDate(hw.due)}
                    </span>
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
            if (hw.done) this.awardXP(10, 'Hausaufgabe erledigt');
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

        document.querySelectorAll('.grade-system-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.grade-system-btn').forEach(b => b.classList.remove('active'));
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
        this.renderGrades();
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
        this.showNotification('Note hinzugefügt', 'success');
        this.awardXP(5, 'Note eingetragen');
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
                <div class="feedback-stat"><div class="fs-num">${total}</div><div class="fs-label">Gesamt</div></div>
                <div class="feedback-stat"><div class="fs-num">${avgRating.toFixed(1)} ★</div><div class="fs-label">Ø Bewertung</div></div>
                <div class="feedback-stat"><div class="fs-num">${byType.bug}</div><div class="fs-label">Fehler</div></div>
                <div class="feedback-stat"><div class="fs-num">${byType.suggestion}</div><div class="fs-label">Vorschläge</div></div>
                <div class="feedback-stat"><div class="fs-num">${byType.praise}</div><div class="fs-label">Lob</div></div>
            </div>`;

        const filtered = filter === 'all' ? all : all.filter(f => f.type === filter);

        if (filtered.length === 0) {
            list.innerHTML = '<p style="color:var(--text-secondary);padding:20px 0;">Keine Feedbacks in dieser Kategorie.</p>';
            return;
        }

        const typeLabels = { bug: '🐛 Fehler', suggestion: '💡 Vorschlag', praise: '⭐ Lob', other: '💬 Sonstiges' };
        const typeColors = { bug: '#ef4444', suggestion: '#3b82f6', praise: '#f59e0b', other: '#8b5cf6' };

        list.innerHTML = filtered.map(fb => `
            <div class="feedback-admin-item">
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

    // ===== Dashboard =====
    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];

        // Upcoming events
        const upcomingEvents = this.events
            .filter(e => e.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        document.getElementById('upcoming-events').innerHTML = upcomingEvents.length
            ? upcomingEvents.map(e => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong>${e.title}</strong><br>
                    <small>${this.formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</small>
                </div>
            `).join('')
            : '<p style="color: var(--text-secondary);">Keine Termine</p>';

        // Pending homework
        const pendingHomework = this.homework
            .filter(h => !h.done && h.due >= today)
            .sort((a, b) => new Date(a.due) - new Date(b.due))
            .slice(0, 5);

        document.getElementById('pending-homework').innerHTML = pendingHomework.length
            ? pendingHomework.map(h => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong>${h.subject}</strong><br>
                    <small>${h.task.substring(0, 50)}${h.task.length > 50 ? '...' : ''}</small><br>
                    <small style="color: var(--warning-color);">Fällig: ${this.formatDate(h.due)}</small>
                </div>
            `).join('')
            : '<p style="color: var(--text-secondary);">Alle Hausaufgaben erledigt! 🎉</p>';

        // Grade overview
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

            document.getElementById('grade-overview').innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">
                        ${(totalAvg / count).toFixed(2)}
                    </div>
                    <p>Gesamtdurchschnitt</p>
                    <small>${this.grades.length} Noten in ${count} Fächern</small>
                </div>
            `;
        } else {
            document.getElementById('grade-overview').innerHTML = 
                '<p style="color: var(--text-secondary);">Noch keine Noten</p>';
        }

    },

    // ===== Flashcards =====
    setupFlashcards() {
        document.getElementById('add-flashcard').addEventListener('click', () => this.addFlashcard());
        document.getElementById('fc-back-to-decks').addEventListener('click', () => this.exitLearnMode());
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

        const card = { id: Date.now(), subject, front, back, known: false };
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

        container.innerHTML = Object.entries(subjects).map(([subject, cards]) => {
            const known = cards.filter(c => c.known).length;
            return `
                <div class="fc-deck-card">
                    <h4><i class="fas fa-layer-group" style="color:var(--primary-color);margin-right:8px;"></i>${subject}</h4>
                    <div class="fc-count">${cards.length} Karte${cards.length !== 1 ? 'n' : ''}</div>
                    <div class="fc-deck-stats">
                        <span class="fc-stat-known"><i class="fas fa-check"></i> ${known} gewusst</span>
                        <span class="fc-stat-unknown"><i class="fas fa-times"></i> ${cards.length - known} offen</span>
                    </div>
                    <div class="fc-deck-actions">
                        <button class="btn-primary btn-small" onclick="App.startLearn('${subject}', false)">
                            <i class="fas fa-graduation-cap"></i> Lernen
                        </button>
                        <button class="btn-small btn-danger" onclick="App.deleteDeck('${subject}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    startLearn(subject, wrongOnly) {
        let cards = this.flashcards.filter(c => c.subject === subject);
        if (wrongOnly) cards = cards.filter(c => !c.known);
        if (cards.length === 0) {
            this.showNotification('Keine Karten zum Lernen', 'warning');
            return;
        }

        // Shuffle
        this.learnState = {
            subject,
            queue: cards.sort(() => Math.random() - 0.5),
            index: 0,
            correct: 0,
            wrong: 0
        };

        document.getElementById('flashcard-decks').style.display = 'none';
        document.getElementById('flashcard-learn-mode').style.display = 'block';
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

        // Update card known state
        const fc = this.flashcards.find(c => c.id === card.id);
        if (fc) fc.known = known;
        this.saveData('flashcards', this.flashcards);

        if (known) this.learnState.correct++;
        else this.learnState.wrong++;

        this.awardXP(known ? 3 : 1, 'Karteikarte gelernt');

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
        this.startLearn(this.learnState.subject, false);
    },

    learnWrongOnly() {
        this.startLearn(this.learnState.subject, true);
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
            modal.classList.remove('active');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    },

    showModal(content) {
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').classList.add('active');
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

    // ===== Karteikarten generieren =====
    async generateFlashcards() {
        const subject = document.getElementById('ki-fc-subject').value.trim();
        const topic = document.getElementById('ki-fc-topic').value.trim();
        const count = document.getElementById('ki-fc-count').value;

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

Antworte NUR mit einem JSON-Array in diesem Format (kein Text davor oder danach, keine Markdown-Backticks):
[{"front":"Frage hier","back":"Antwort hier"},...]

Die Fragen sollen lernwirksam und präzise sein. Die Antworten sollen kurz und klar sein.`;

            const data = await this.kiApiFetch({
                model: 'claude-sonnet-4-6',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            });

            const raw = data.content?.map(c => c.text || '').join('') || '[]';
            const clean = raw.replace(/```json|```/g, '').trim();
            const cards = JSON.parse(clean);

            this.kiGeneratedCards = { subject, cards };
            this.renderGeneratedFlashcards(subject, cards);
        } catch (err) {
            if (err.message !== 'Kein API-Key' && err.message !== 'Ungültiger API-Key') {
                this.showNotification('Fehler: ' + err.message, 'error');
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
                known: false
            });
        });

        this.saveData('flashcards', this.flashcards);
        this.showNotification(`${cards.length} Karteikarten gespeichert!`, 'success');

        document.getElementById('ki-fc-subject').value = '';
        document.getElementById('ki-fc-topic').value = '';
        document.getElementById('ki-fc-result').style.display = 'none';
        this.kiGeneratedCards = null;
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

    getPomodoroDurations() {
        return {
            work: (parseInt(document.getElementById('pomodoro-work-min').value) || 25) * 60,
            short: (parseInt(document.getElementById('pomodoro-short-min').value) || 5) * 60,
            long: (parseInt(document.getElementById('pomodoro-long-min').value) || 15) * 60,
            rounds: parseInt(document.getElementById('pomodoro-rounds').value) || 4
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
        this.pomodoroState.running = true;
        document.getElementById('pomodoro-start-btn').innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.pomodoroState.timer = setInterval(() => this.tickPomodoro(), 1000);
    },

    pausePomodoro() {
        clearInterval(this.pomodoroState.timer);
        this.pomodoroState.timer = null;
        this.pomodoroState.running = false;
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
        this.pomodoroState.remaining--;
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
            this.awardXP(15, 'Pomodoro-Fokusphase abgeschlossen');
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
        const current = this.pomodoroState.round % d.rounds;
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
const PROGRESS_BADGES = [
    { id: 'first_step', icon: 'fa-seedling', name: 'Erste Schritte', desc: 'Erste Aktion in OnePlan', check: p => p.totalActions >= 1 },
    { id: 'streak_3', icon: 'fa-fire', name: '3-Tage-Streak', desc: '3 Tage in Folge aktiv', check: p => p.streak >= 3 },
    { id: 'streak_7', icon: 'fa-fire', name: '7-Tage-Streak', desc: '7 Tage in Folge aktiv', check: p => p.streak >= 7 },
    { id: 'streak_30', icon: 'fa-fire', name: '30-Tage-Streak', desc: '30 Tage in Folge aktiv', check: p => p.streak >= 30 },
    { id: 'level_5', icon: 'fa-star', name: 'Level 5', desc: 'Level 5 erreicht', check: p => App.getLevelInfo(p.xp).level >= 5 },
    { id: 'level_10', icon: 'fa-star', name: 'Level 10', desc: 'Level 10 erreicht', check: p => App.getLevelInfo(p.xp).level >= 10 },
    { id: 'actions_50', icon: 'fa-bolt', name: 'Dabeibleiber', desc: '50 Aktionen gesammelt', check: p => p.totalActions >= 50 },
    { id: 'actions_200', icon: 'fa-crown', name: 'Profi', desc: '200 Aktionen gesammelt', check: p => p.totalActions >= 200 }
];

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

    awardXP(amount, reason) {
        const p = this.progress;
        const today = this.todayStr();

        if (p.lastActiveDate !== today) {
            if (p.lastActiveDate === this.yesterdayStr()) {
                p.streak += 1;
            } else {
                p.streak = 1;
            }
            p.lastActiveDate = today;
        }

        p.xp += amount;
        p.totalActions = (p.totalActions || 0) + 1;

        const newlyEarned = this.checkNewBadges();

        this.saveData('progress', p);
        this.renderStreakBadge();
        if (this.state.currentSection === 'fortschritt') this.renderProgress();

        newlyEarned.forEach(b => {
            this.showNotification(`Abzeichen freigeschaltet: ${b.name} 🎉`, 'success');
        });
    },

    checkNewBadges() {
        const p = this.progress;
        if (!p.badges) p.badges = [];
        const newly = [];
        PROGRESS_BADGES.forEach(b => {
            if (!p.badges.includes(b.id) && b.check(p)) {
                p.badges.push(b.id);
                newly.push(b);
            }
        });
        return newly;
    },

    renderStreakBadge() {
        const el = document.getElementById('streak-flame-count');
        const badge = document.getElementById('streak-flame-badge');
        if (!el || !badge) return;
        const streak = this.progress?.streak || 0;
        el.textContent = streak;
        badge.classList.toggle('streak-active', streak > 0);
    },

    renderProgress() {
        const p = this.progress;
        const { level, xpIntoLevel, xpForNextLevel } = this.getLevelInfo(p.xp);

        document.getElementById('streak-hero-count').textContent = p.streak || 0;
        document.getElementById('streak-hero-label').textContent =
            (p.streak || 0) === 1 ? 'Tag in Folge aktiv' : 'Tage in Folge aktiv';
        document.getElementById('streak-hero-flame').classList.toggle('streak-active', (p.streak || 0) > 0);

        document.getElementById('level-badge').textContent = `Lvl ${level}`;
        document.getElementById('level-xp-current').textContent = xpIntoLevel;
        document.getElementById('level-xp-next').textContent = xpForNextLevel;
        document.getElementById('level-progress-fill').style.width = `${(xpIntoLevel / xpForNextLevel) * 100}%`;

        const grid = document.getElementById('badges-grid');
        grid.innerHTML = PROGRESS_BADGES.map(b => {
            const earned = (p.badges || []).includes(b.id);
            return `
                <div class="badge-tile ${earned ? 'earned' : 'locked'}">
                    <div class="badge-icon"><i class="fas ${b.icon}"></i></div>
                    <div class="badge-name">${b.name}</div>
                    <div class="badge-desc">${b.desc}</div>
                </div>
            `;
        }).join('');
    }
});
