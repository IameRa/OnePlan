// ===== Schul-Organizer App =====

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    // App state
    state: {
        currentSection: 'dashboard',
        currentMonth: new Date(),
        selectedRating: 0,
        homeworkFilter: 'all'
    },

    // Initialize the application
    init() {
        this.loadAllData();
        this.setupNavigation();
        this.setupCalendar();
        this.setupTimetable();
        this.setupHomework();
        this.setupGrades();
        this.setupFeedback();
        this.setupSubstitution();
        this.setupModal();
        this.setupWebUntis();
        this.updateDashboard();
        this.checkReminders();
        // Check reminders every minute
        setInterval(() => this.checkReminders(), 60000);
    },

    // ===== Data Management =====
    loadAllData() {
        this.events = JSON.parse(localStorage.getItem('schulOrganizer_events')) || [];
        this.timetable = JSON.parse(localStorage.getItem('schulOrganizer_timetable')) || this.getEmptyTimetable();
        this.homework = JSON.parse(localStorage.getItem('schulOrganizer_homework')) || [];
        this.grades = JSON.parse(localStorage.getItem('schulOrganizer_grades')) || [];
        this.feedback = JSON.parse(localStorage.getItem('schulOrganizer_feedback')) || [];
        this.substitutions = JSON.parse(localStorage.getItem('schulOrganizer_substitutions')) || [];
    },

    saveData(key, data) {
        localStorage.setItem(`schulOrganizer_${key}`, JSON.stringify(data));
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
            case 'webuntis': this.renderWebUntisStatus(); break;
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
        document.getElementById('add-grade').addEventListener('click', () => this.addGrade());
        this.renderGrades();
    },

    addGrade() {
        const subject = document.getElementById('grade-subject').value.trim();
        const type = document.getElementById('grade-type').value;
        const value = parseFloat(document.getElementById('grade-value').value);
        const weight = parseInt(document.getElementById('grade-weight').value) || 100;
        const description = document.getElementById('grade-description').value.trim();

        if (!subject || isNaN(value) || value < 1 || value > 6) {
            this.showNotification('Bitte gültiges Fach und Note (1-6) eingeben', 'error');
            return;
        }

        const grade = {
            id: Date.now(),
            subject,
            type,
            value,
            weight,
            description,
            createdAt: new Date().toISOString()
        };

        this.grades.push(grade);
        this.saveData('grades', this.grades);

        // Clear form
        document.getElementById('grade-subject').value = '';
        document.getElementById('grade-value').value = '';
        document.getElementById('grade-weight').value = '100';
        document.getElementById('grade-description').value = '';

        this.renderGrades();
        this.showNotification('Note hinzugefügt', 'success');
    },

    renderGrades() {
        const overviewContainer = document.getElementById('grades-overview');
        const listContainer = document.getElementById('grades-list');

        // Group by subject
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

        // Calculate averages
        let overviewHTML = '<h3>Durchschnitt pro Fach</h3>';
        let totalAvg = 0;
        let subjectCount = 0;

        Object.entries(subjects).forEach(([subject, grades]) => {
            let weightedSum = 0;
            let totalWeight = 0;
            
            grades.forEach(g => {
                weightedSum += g.value * g.weight;
                totalWeight += g.weight;
            });
            
            const avg = weightedSum / totalWeight;
            totalAvg += avg;
            subjectCount++;
            
            const barWidth = ((6 - avg) / 5) * 100;
            
            overviewHTML += `
                <div class="grade-subject-card">
                    <h4>
                        <span>${subject}</span>
                        <span class="average">${avg.toFixed(2)}</span>
                    </h4>
                    <div class="grade-bar">
                        <div class="grade-bar-fill" style="width: ${barWidth}%"></div>
                    </div>
                    <small>${grades.length} Note${grades.length !== 1 ? 'n' : ''}</small>
                </div>
            `;
        });

        const overallAvg = totalAvg / subjectCount;
        overviewHTML = `
            <div class="grade-subject-card" style="background: var(--primary-color); color: white;">
                <h4>
                    <span>Gesamtdurchschnitt</span>
                    <span class="average" style="color: white;">${overallAvg.toFixed(2)}</span>
                </h4>
            </div>
        ` + overviewHTML;

        overviewContainer.innerHTML = overviewHTML;

        // Render grade list
        listContainer.innerHTML = '<h3>Alle Noten</h3>' + this.grades
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(g => {
                const gradeClass = `grade-${Math.round(g.value)}`;
                const typeLabels = { written: 'Schriftlich', oral: 'Mündlich', other: 'Sonstige' };
                
                return `
                    <div class="grade-item">
                        <div class="grade-value ${gradeClass}">${g.value}</div>
                        <div class="grade-info">
                            <h4>${g.subject}</h4>
                            <span>${typeLabels[g.type]} · ${g.weight}% Gewichtung</span>
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
    },

    // ===== WebUntis =====
    setupWebUntis() {
        document.getElementById('wu-save-btn').addEventListener('click', () => this.webUntisConnect());
        document.getElementById('wu-disconnect-btn').addEventListener('click', () => this.webUntisDisconnect());
        document.getElementById('wu-test-btn').addEventListener('click', () => this.webUntisTest());
        document.getElementById('wu-sync-timetable').addEventListener('click', () => this.webUntisSyncTimetable());
        document.getElementById('wu-sync-substitutions').addEventListener('click', () => this.webUntisSyncSubstitutions());
        this.renderWebUntisStatus();
    },

    renderWebUntisStatus() {
        const configured = WebUntisAPI.isConfigured();
        document.getElementById('webuntis-form').style.display = configured ? 'none' : 'flex';
        document.getElementById('webuntis-connected-info').style.display = configured ? 'block' : 'none';
        document.getElementById('wu-test-btn').style.display = configured ? 'none' : 'none';
        document.getElementById('wu-sync-timetable').disabled = !configured;
        document.getElementById('wu-sync-substitutions').disabled = !configured;

        if (configured) {
            document.getElementById('wu-connected-school').textContent =
                `${WebUntisAPI.config.username} @ ${WebUntisAPI.config.server}`;
        }
    },

    webUntisConnect() {
        const server = document.getElementById('wu-server').value.trim();
        const username = document.getElementById('wu-username').value.trim();
        const password = document.getElementById('wu-password').value.trim();

        if (!server || !username || !password) {
            this.showNotification('Bitte alle Felder ausfüllen', 'error');
            return;
        }

        WebUntisAPI.saveConfig('', username, password, server);
        this.renderWebUntisStatus();
        this.showNotification('Zugangsdaten gespeichert', 'success');
        document.getElementById('wu-password').value = '';
    },

    async webUntisTest() {
        const btn = document.getElementById('wu-test-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Teste...';
        this.webUntisLog('Verbindungstest läuft...', 'info');

        try {
            const session = await WebUntisAPI.login();
            await WebUntisAPI.logout(session.sessionId);
            this.webUntisLog('✅ Verbindung erfolgreich! Login hat funktioniert.', 'success');
            this.showNotification('Verbindung erfolgreich!', 'success');
            document.getElementById('wu-sync-timetable').disabled = false;
            document.getElementById('wu-sync-substitutions').disabled = false;
        } catch (err) {
            this.webUntisLog(`❌ Verbindung fehlgeschlagen: ${err.message}`, 'error');
            this.showNotification('Verbindung fehlgeschlagen: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plug"></i> Verbindung testen';
        }
    },

    webUntisDisconnect() {
        WebUntisAPI.clearConfig();
        this.renderWebUntisStatus();
        this.showNotification('WebUntis-Verbindung getrennt', 'success');
    },

    webUntisLog(message, type = 'info') {
        const log = document.getElementById('wu-sync-log');
        const entry = document.createElement('div');
        entry.className = `wu-log-entry ${type}`;
        const time = new Date().toLocaleTimeString('de-DE');
        entry.innerHTML = `<span class="wu-log-time">${time}</span> ${message}`;
        log.prepend(entry);
    },

    async webUntisSyncTimetable() {
        const btn = document.getElementById('wu-sync-timetable');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lädt...';
        this.webUntisLog('Verbinde mit WebUntis...', 'info');

        try {
            const timetable = await WebUntisAPI.fetchTimetable();
            this.timetable = timetable;
            this.saveData('timetable', this.timetable);
            this.webUntisLog('✅ Stundenplan erfolgreich geladen!', 'success');
            this.showNotification('Stundenplan aus WebUntis geladen', 'success');
        } catch (err) {
            this.webUntisLog(`❌ Fehler: ${err.message}`, 'error');
            this.showNotification('Fehler beim Laden: ' + err.message, 'error');
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Stundenplan laden';
        }
    },

    async webUntisSyncSubstitutions() {
        const btn = document.getElementById('wu-sync-substitutions');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lädt...';
        this.webUntisLog('Lade Vertretungsplan...', 'info');

        try {
            const subs = await WebUntisAPI.fetchSubstitutions();

            // Alte WebUntis-Einträge entfernen, neue hinzufügen
            this.substitutions = this.substitutions.filter(s => !s.fromWebUntis);
            this.substitutions.push(...subs);
            this.saveData('substitutions', this.substitutions);

            this.webUntisLog(`✅ ${subs.length} Vertretung(en) geladen`, 'success');
            this.showNotification(`${subs.length} Vertretung(en) synchronisiert`, 'success');
        } catch (err) {
            this.webUntisLog(`❌ Fehler: ${err.message}`, 'error');
            this.showNotification('Fehler beim Laden: ' + err.message, 'error');
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Vertretungen laden';
        }
    }
};
