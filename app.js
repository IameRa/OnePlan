// ===== Supabase Setup =====
const SUPABASE_URL = 'https://nothxzhzhjgpheqwquhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdGh4emh6aGpncGhlcXdxdWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTIwNDcsImV4cCI6MjA5NjYyODA0N30.yDXDBzHXJxy_Re-dNejiXAZiZyzoyrTPlS7X7fP_YeI';
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== Account System =====
const Auth = {
    currentUser: null,

    async init() {
        this.setupListeners();

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await this.loadProfile(session.user);
        } else {
            document.getElementById('auth-overlay').classList.add('active');
        }

        // Listen for auth changes (e.g. token refresh)
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await this.loadProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.showAuthScreen();
            }
        });
    },

    async loadProfile(user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        this.currentUser = { ...user, ...profile };
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
            .single();

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
        this.setupSubstitution();
        this.setupFlashcards();
        this.setupModal();
        this.updateDashboard();
        this.checkReminders();
        // Check reminders every minute
        setInterval(() => this.checkReminders(), 60000);
    },

    // ===== Data Management =====
    async loadAllData() {
        const keys = ['events', 'timetable', 'homework', 'grades', 'feedback', 'substitutions'];
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
        this.feedback = map['feedback'] || [];
        this.substitutions = map['substitutions'] || [];
        this.flashcards = map['flashcards'] || [];
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
                { subject: '', teacher: '', room: '' },
                { subject: '', teacher: '', room: '' },
                { subject: '', teacher: '', room: '' },
                { subject: '', teacher: '', room: '' },
                { subject: '', teacher: '', room: '' }
            ]);
        }
        return timetable;
    },

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
            case 'feedback': this.renderFeedback(); break;
            case 'vertretungsplan': this.renderSubstitutions(); break;
            case 'karteikarten': this.renderFlashcardDecks(); break;
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
        for (let i = 1; i <= 10; i++) {
            periodSelect.innerHTML += `<option value="${i-1}">${i}. Stunde</option>`;
        }

        document.getElementById('save-timetable').addEventListener('click', () => this.saveTimetableEntry());
        
        this.renderTimetable();
    },

    renderTimetable() {
        const tbody = document.getElementById('timetable-body');
        tbody.innerHTML = '';

        const periods = ['1. (07:40-08:25)', '2. (08:30-09:15)', '3. (09:30-10:15)', '4. (10:20-11:05)', '5. (11:25-12:10)',
                        '6. (12:15-13:00)', '7. (13:45-14:30)', '8. (14:30-15:15)'];

        for (let p = 0; p < 8; p++) {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${periods[p]}</strong></td>`;
            
            for (let d = 0; d < 5; d++) {
                const cell = this.timetable[p][d];
                row.innerHTML += `
                    <td onclick="App.editTimetableCell(${d}, ${p})">
                        <div class="timetable-cell">
                            ${cell.subject ? `
                                <div class="subject">${cell.subject}</div>
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
        document.getElementById('edit-day').value = day;
        document.getElementById('edit-period').value = period;
        
        const cell = this.timetable[period][day];
        document.getElementById('edit-subject').value = cell.subject;
        document.getElementById('edit-teacher').value = cell.teacher;
        document.getElementById('edit-room').value = cell.room;
    },

    saveTimetableEntry() {
        const day = parseInt(document.getElementById('edit-day').value);
        const period = parseInt(document.getElementById('edit-period').value);
        
        this.timetable[period][day] = {
            subject: document.getElementById('edit-subject').value.trim(),
            teacher: document.getElementById('edit-teacher').value.trim(),
            room: document.getElementById('edit-room').value.trim()
        };

        this.saveData('timetable', this.timetable);
        this.renderTimetable();
        
        // Clear form
        document.getElementById('edit-subject').value = '';
        document.getElementById('edit-teacher').value = '';
        document.getElementById('edit-room').value = '';
        
        this.showNotification('Stundenplan aktualisiert', 'success');
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

        this.renderFeedback();
    },

    highlightStars(rating) {
        document.querySelectorAll('#star-rating i').forEach(star => {
            star.classList.toggle('active', parseInt(star.dataset.rating) <= rating);
        });
    },

    updateStarRating() {
        this.highlightStars(this.state.selectedRating);
    },

    sendFeedback() {
        const teacher = document.getElementById('feedback-teacher').value.trim();
        const subject = document.getElementById('feedback-subject').value.trim();
        const type = document.getElementById('feedback-type').value;
        const message = document.getElementById('feedback-message').value.trim();
        const anonymous = document.getElementById('feedback-anonymous').checked;

        if (!teacher || !message) {
            this.showNotification('Bitte Lehrer und Nachricht eingeben', 'error');
            return;
        }

        const feedback = {
            id: Date.now(),
            teacher,
            subject,
            type,
            rating: this.state.selectedRating,
            message,
            anonymous,
            createdAt: new Date().toISOString()
        };

        this.feedback.push(feedback);
        this.saveData('feedback', this.feedback);

        // Clear form
        document.getElementById('feedback-teacher').value = '';
        document.getElementById('feedback-subject').value = '';
        document.getElementById('feedback-message').value = '';
        document.getElementById('feedback-anonymous').checked = false;
        this.state.selectedRating = 0;
        this.updateStarRating();

        this.renderFeedback();
        this.showNotification('Feedback gesendet', 'success');
    },

    renderFeedback() {
        const container = document.getElementById('feedback-list');

        if (this.feedback.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>Noch kein Feedback gesendet</p>
                </div>
            `;
            return;
        }

        const typeLabels = {
            positive: 'Positiv',
            constructive: 'Konstruktiv',
            question: 'Frage',
            suggestion: 'Vorschlag'
        };

        container.innerHTML = this.feedback
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(fb => `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <div>
                            <strong>${fb.teacher}</strong>
                            ${fb.subject ? `<span> · ${fb.subject}</span>` : ''}
                        </div>
                        <span class="feedback-type ${fb.type}">${typeLabels[fb.type]}</span>
                    </div>
                    ${fb.rating ? `
                        <div class="star-rating">
                            ${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}
                        </div>
                    ` : ''}
                    <p>${fb.message}</p>
                    <small>${this.formatDate(fb.createdAt.split('T')[0])} ${fb.anonymous ? '· Anonym' : ''}</small>
                    <button class="btn-small btn-danger" style="float: right;" onclick="App.deleteFeedback(${fb.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
    },

    deleteFeedback(id) {
        this.feedback = this.feedback.filter(f => f.id !== id);
        this.saveData('feedback', this.feedback);
        this.renderFeedback();
        this.showNotification('Feedback gelöscht', 'success');
    },

    // ===== Substitution =====
    setupSubstitution() {
        const periodSelect = document.getElementById('sub-period');
        for (let i = 1; i <= 10; i++) {
            periodSelect.innerHTML += `<option value="${i}">${i}. Stunde</option>`;
        }

        document.getElementById('add-substitution').addEventListener('click', () => this.addSubstitution());
        
        this.renderSubstitutions();
    },

    addSubstitution() {
        const date = document.getElementById('sub-date').value;
        const period = document.getElementById('sub-period').value;
        const original = document.getElementById('sub-original').value.trim();
        const replacement = document.getElementById('sub-replacement').value.trim();
        const room = document.getElementById('sub-room').value.trim();
        const note = document.getElementById('sub-note').value.trim();

        if (!date || !original) {
            this.showNotification('Bitte Datum und Fach eingeben', 'error');
            return;
        }

        const substitution = {
            id: Date.now(),
            date,
            period,
            original,
            replacement,
            room,
            note
        };

        this.substitutions.push(substitution);
        this.saveData('substitutions', this.substitutions);

        // Clear form
        document.getElementById('sub-date').value = '';
        document.getElementById('sub-original').value = '';
        document.getElementById('sub-replacement').value = '';
        document.getElementById('sub-room').value = '';
        document.getElementById('sub-note').value = '';

        this.renderSubstitutions();
        this.showNotification('Vertretung hinzugefügt', 'success');
    },

    renderSubstitutions() {
        const container = document.getElementById('substitution-list');
        const today = new Date().toISOString().split('T')[0];
        
        const upcoming = this.substitutions
            .filter(s => s.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>Keine Vertretungen eingetragen</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcoming.map(sub => `
            <div class="substitution-item ${sub.replacement.toLowerCase().includes('entfall') ? 'cancelled' : ''}">
                <div class="substitution-info">
                    <h4>${sub.original} → ${sub.replacement || 'Vertretung'}</h4>
                    <span>
                        <i class="fas fa-calendar"></i> ${this.formatDate(sub.date)} · ${sub.period}. Stunde
                        ${sub.room ? ` · Raum ${sub.room}` : ''}
                    </span>
                    ${sub.note ? `<p><i class="fas fa-info-circle"></i> ${sub.note}</p>` : ''}
                </div>
                <button class="btn-small btn-danger" onclick="App.deleteSubstitution(${sub.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    deleteSubstitution(id) {
        this.substitutions = this.substitutions.filter(s => s.id !== id);
        this.saveData('substitutions', this.substitutions);
        this.renderSubstitutions();
        this.showNotification('Vertretung gelöscht', 'success');
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
                const avg = grades.reduce((sum, g) => sum + g.value * g.weight, 0) / 
                           grades.reduce((sum, g) => sum + g.weight, 0);
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

        // Today's substitutions
        const todaySubs = this.substitutions.filter(s => s.date === today);
        document.getElementById('today-substitutions').innerHTML = todaySubs.length
            ? todaySubs.map(s => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong>${s.original}</strong> → ${s.replacement || 'Vertretung'}<br>
                    <small>${s.period}. Stunde${s.room ? ' · Raum ' + s.room : ''}</small>
                </div>
            `).join('')
            : '<p style="color: var(--text-secondary);">Keine Vertretungen heute</p>';
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
        document.getElementById('fc-front-text').textContent = card.front;
        document.getElementById('fc-back-text').textContent = card.back;

        // Reset flip
        const inner = document.getElementById('fc-card-inner');
        inner.classList.remove('flipped');
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
