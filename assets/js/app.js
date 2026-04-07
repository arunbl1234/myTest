// Router
const routes = ['login', 'dashboard', 'employees', 'chat', 'payroll', 'hours', 'holidays'];
function showRoute(name) {
	if(name === 'hours' && (!AUTH || AUTH.role !== 'client')){
		name = AUTH ? 'dashboard' : 'login';
	}
	routes.forEach(r => {
		document.getElementById(r).classList.toggle('visible', r === name);
	});
	document.querySelectorAll('.nav-btn').forEach(btn => {
		btn.classList.toggle('active', btn.dataset.route === name);
	});
	if(name === 'hours'){
		renderHoursView();
	}
}

// Helpers
function byId(id){ return document.getElementById(id); }
function formatINR(num){ return new Intl.NumberFormat('en-IN').format(num); }
function formatCurrencyINR(amount) {
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
function pendingLeaves(emp){ return Math.max(0, (emp.totalLeaves ?? 0) - (emp.leavesTaken ?? 0)); }
function formatDateInput(date){
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
function formatDateHuman(isoDate){
	const safeDate = new Date(`${isoDate}T00:00:00`);
	return safeDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatHoursValue(hours){
	const num = Number(hours) || 0;
	return num.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

// Payroll month eligibility
function lastDayOfMonth(year, monthIndexZeroBased){
	// monthIndexZeroBased: 0..11
	return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}
function monthCompare(aYm, bYm){
	// compare "YYYY-MM" lexicographically is safe, but keep numeric just in case
	const [ay, am] = aYm.split('-').map(Number);
	const [by, bm] = bYm.split('-').map(Number);
	if(ay !== by) return ay - by;
	return am - bm;
}
function isCurrentMonthEligible(now, selectedYm){
	const [y, m] = selectedYm.split('-').map(Number);
	const lastDay = lastDayOfMonth(y, m - 1);
	const cutoff = new Date(y, m - 1, lastDay, 22, 0, 0, 0); // 10 PM local time
	return now >= cutoff;
}

function resetProtectedViews(){
	const profileCard = byId('employee-profile');
	if(profileCard){
		profileCard.hidden = true;
	}
	selectedEmployee = null;
	const payrollSummary = byId('payroll-summary');
	if(payrollSummary){
		payrollSummary.innerHTML = '';
	}
	const hoursFeedback = byId('hours-error');
	if(hoursFeedback){
		hoursFeedback.textContent = '';
		hoursFeedback.style.color = 'var(--muted)';
	}
	const tableBody = byId('hours-table-body');
	if(tableBody){
		tableBody.innerHTML = '';
	}
	['hours-total','hours-expected','hours-balance'].forEach(id => {
		const el = byId(id);
		if(el){ el.textContent = '0 h'; }
	});
	const daysEl = byId('hours-days');
	if(daysEl){ daysEl.textContent = '0'; }
	const balanceEl = byId('hours-balance');
	if(balanceEl){ balanceEl.style.color = 'var(--muted)'; }
	const clientCard = byId('client-login-card');
	const employeeCard = byId('employee-login-card');
	if(clientCard){ clientCard.hidden = true; }
	if(employeeCard){ employeeCard.hidden = true; }
	const clientErr = byId('client-login-error');
	const employeeErr = byId('employee-login-error');
	if(clientErr){ clientErr.textContent = ''; }
	if(employeeErr){ employeeErr.textContent = ''; }
	const chooseClient = byId('choose-client');
	const chooseEmployee = byId('choose-employee');
	if(chooseClient){
		chooseClient.classList.remove('active');
		chooseClient.setAttribute('aria-selected', 'false');
		chooseClient.setAttribute('tabindex', '0');
	}
	if(chooseEmployee){
		chooseEmployee.classList.remove('active');
		chooseEmployee.setAttribute('aria-selected', 'false');
		chooseEmployee.setAttribute('tabindex', '0');
	}
	['client-code','employee-login-id','employee-login-username','employee-login-password'].forEach(id => {
		const el = byId(id);
		if(el){ el.value = ''; }
	});
}

// Auth
let AUTH = null; // { role: 'client' | 'employee', empId?: string }
function applyAuthGuards(){
	const isClient = AUTH && AUTH.role === 'client';
	const isEmployee = AUTH && AUTH.role === 'employee';

	// Show/hide logout button
	const logoutBtn = byId('btn-logout');
	logoutBtn.hidden = !AUTH;

	// Employees route: employees can only see limited info
	// Payroll: employees only their own; client can select anyone
	// Profile: employees only their own profile
	// Navigation: toggle buttons by role
	document.querySelectorAll('.top-nav .nav-btn[data-route]').forEach(btn => {
		const route = btn.dataset.route;
		if(route === 'login'){
			btn.hidden = !!AUTH;
			return;
		}
		if(!AUTH){
			btn.hidden = true;
			return;
		}
		if(route === 'hours' && AUTH.role !== 'client'){
			btn.hidden = true;
			return;
		}
		btn.hidden = false;
	});
}

function requireAuth(defaultRoute='dashboard'){
	AUTH = readAuth();
	applyAuthGuards();
	resetProtectedViews();
	if(!AUTH){
		showRoute('login');
	} else {
		if(byId('employee-search')){
			renderEmployees(byId('employee-search').value);
		} else {
			renderEmployees();
		}
		renderPayrollEmployees();
		renderChatUsers();
		renderDashboard();
		hourEntries = loadHourEntries();
		renderHoursEmployeeSelect();
		renderHoursView();
		showRoute(defaultRoute);
	}
}

// Dashboard
function renderDashboard() {
	const total = EMPLOYEES.length;
	const avgTotalLeaves = Math.round(EMPLOYEES.reduce((a, e) => a + e.totalLeaves, 0) / total);
	const leavesTaken = EMPLOYEES.reduce((a, e) => a + e.leavesTaken, 0);
	const pending = EMPLOYEES.reduce((a, e) => a + pendingLeaves(e), 0);

	byId('kpi-total-employees').textContent = total;
	byId('kpi-avg-total-leaves').textContent = avgTotalLeaves;
	byId('kpi-leaves-taken').textContent = leavesTaken;
	byId('kpi-pending-leaves').textContent = pending;

	const holContainer = byId('dashboard-holidays');
	holContainer.innerHTML = '';
	HOLIDAYS.slice(0, 4).forEach(h => {
		const li = document.createElement('li');
		li.innerHTML = `<span>${h.name}</span><span class="muted">${h.date}</span>`;
		holContainer.appendChild(li);
	});

	const festContainer = byId('dashboard-fests');
	festContainer.innerHTML = '';
	FESTS.slice(0, 4).forEach(f => {
		const li = document.createElement('li');
		li.innerHTML = `<span>${f.name}</span><span class="muted">${f.date}</span>`;
		festContainer.appendChild(li);
	});
}

// Employees list
let selectedEmployee = null;
function renderEmployees(filter = '') {
	const box = byId('employee-list');
	box.innerHTML = '';
	const query = filter.trim().toLowerCase();
	const isEmployeeRole = AUTH && AUTH.role === 'employee';
	const currentEmpId = isEmployeeRole ? AUTH.empId : null;
	EMPLOYEES
		.filter(e => !query || [e.name, e.role, e.team].some(v => v.toLowerCase().includes(query)))
		.forEach(e => {
			const card = document.createElement('div');
			card.className = 'employee-card';
			if(isEmployeeRole && e.id !== currentEmpId){
				// Limited view: only ID, email, phone
				card.innerHTML = `
					<img class="avatar" src="${e.avatar}" alt="${e.name}">
					<div style="flex:1">
						<div style="font-weight:600">${e.name}</div>
						<div class="muted">ID: ${e.id}</div>
						<div class="muted">${e.email} • ${e.phone}</div>
					</div>
				`;
				// No profile open
			} else {
				card.innerHTML = `
					<img class="avatar" src="${e.avatar}" alt="${e.name}">
					<div style="flex:1">
						<div style="font-weight:600">${e.name}</div>
						<div class="muted">${e.role} • ${e.team}</div>
					</div>
					<div>
						<div class="muted" style="font-size:12px">Leaves</div>
						<div style="text-align:right">${e.leavesTaken}/${e.totalLeaves}</div>
					</div>
				`;
				card.addEventListener('click', () => openProfile(e.id));
			}
			box.appendChild(card);
		});
}

function openProfile(empId){
	// Employees can only open their own profile
	if(AUTH && AUTH.role === 'employee' && AUTH.empId !== empId){ return; }
	selectedEmployee = EMPLOYEES.find(e => e.id === empId);
	if(!selectedEmployee) return;
	byId('employee-profile').hidden = false;
	byId('profile-avatar').src = selectedEmployee.avatar;
	byId('profile-name').textContent = selectedEmployee.name;
	byId('profile-role').textContent = selectedEmployee.role;
	byId('profile-team').textContent = `Team: ${selectedEmployee.team}`;
	byId('profile-email').textContent = selectedEmployee.email;
	byId('profile-phone').textContent = selectedEmployee.phone;
	byId('profile-total-leaves').textContent = selectedEmployee.totalLeaves;
	byId('profile-leaves-taken').textContent = selectedEmployee.leavesTaken;
	byId('profile-pending-leaves').textContent = pendingLeaves(selectedEmployee);
	byId('profile-salary').textContent = formatCurrencyINR(selectedEmployee.salary);
}

// Chat
function renderChatUsers(){
	const sel = byId('chat-user');
	sel.innerHTML = '';
	EMPLOYEES.forEach(e => {
		const opt = document.createElement('option');
		opt.value = e.id;
		opt.textContent = `${e.name} (${e.team})`;
		sel.appendChild(opt);
	});
}
function renderChatWindow(){
	const win = byId('chat-window');
	win.innerHTML = '';
	getChatMessages().forEach(m => {
		const div = document.createElement('div');
		div.className = 'msg';
		const emp = EMPLOYEES.find(e => e.id === m.empId);
		const name = emp ? emp.name : m.empId;
		div.innerHTML = `
			<div class="meta">${name} • ${new Date(m.ts).toLocaleString()}</div>
			<div class="bubble">${m.text}</div>
		`;
		win.appendChild(div);
	});
	win.scrollTop = win.scrollHeight;
}

// Hours tracker
let hourEntries = loadHourEntries();
function getHoursEntries(empId, month){
	if(!empId || !month){ return []; }
	return hourEntries
		.filter(entry => entry.empId === empId && entry.date.startsWith(month));
}
function updateHoursDateBounds(month){
	const dateInput = byId('hours-date');
	if(!dateInput || !month) return;
	const [year, monthNum] = month.split('-').map(Number);
	if(!year || !monthNum) return;
	const last = lastDayOfMonth(year, monthNum - 1);
	const min = `${month}-01`;
	const max = `${month}-${String(last).padStart(2, '0')}`;
	dateInput.min = min;
	dateInput.max = max;
	const currentValue = dateInput.value;
	const today = new Date();
	const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
	if(!currentValue || currentValue < min || currentValue > max){
		if(monthCompare(month, currentMonth) === 0){
			dateInput.value = formatDateInput(today);
		} else {
			dateInput.value = min;
		}
	}
}
function renderHoursEmployeeSelect(){
	const sel = byId('hours-employee');
	if(!sel) return;
	const prev = sel.value;
	sel.innerHTML = '';
	EMPLOYEES.forEach(e => {
		const opt = document.createElement('option');
		opt.value = e.id;
		opt.textContent = `${e.name} (${e.id})`;
		sel.appendChild(opt);
	});
	if(prev && Array.from(sel.options).some(opt => opt.value === prev)){
		sel.value = prev;
	} else if(sel.options.length){
		sel.value = sel.options[0].value;
	}
}
function renderHoursView(){
	const tableBody = byId('hours-table-body');
	const empSelect = byId('hours-employee');
	const monthInput = byId('hours-month');
	if(!tableBody || !empSelect || !monthInput) return;
	if(!AUTH || AUTH.role !== 'client'){
		tableBody.innerHTML = '';
		const totalEl = byId('hours-total');
		const daysEl = byId('hours-days');
		const expectedEl = byId('hours-expected');
		const balanceEl = byId('hours-balance');
		if(totalEl) totalEl.textContent = '0 h';
		if(daysEl) daysEl.textContent = '0';
		if(expectedEl) expectedEl.textContent = '0 h';
		if(balanceEl){
			balanceEl.textContent = '0 h';
			balanceEl.style.color = 'var(--muted)';
		}
		return;
	}
	const empId = empSelect.value;
	const month = monthInput.value;
	updateHoursDateBounds(month);
	if(!empId || !month){
		tableBody.innerHTML = '';
		return;
	}
	const entries = getHoursEntries(empId, month).sort((a, b) => a.date.localeCompare(b.date));
	const total = entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
	const days = entries.length;
	const expected = days * 8;
	const balance = total - expected;
	const totalEl = byId('hours-total');
	const daysEl = byId('hours-days');
	const expectedEl = byId('hours-expected');
	const balanceEl = byId('hours-balance');
	if(totalEl) totalEl.textContent = `${formatHoursValue(total)} h`;
	if(daysEl) daysEl.textContent = days;
	if(expectedEl) expectedEl.textContent = `${formatHoursValue(expected)} h`;
	if(balanceEl){
		const formattedBalance = formatHoursValue(balance);
		if(balance > 0){
			balanceEl.textContent = `+${formattedBalance} h`;
			balanceEl.style.color = 'var(--accent)';
		} else if(balance < 0){
			balanceEl.textContent = `${formattedBalance} h`;
			balanceEl.style.color = 'var(--danger)';
		} else {
			balanceEl.textContent = '0 h';
			balanceEl.style.color = 'var(--muted)';
		}
	}
	tableBody.innerHTML = '';
	if(entries.length === 0){
		const tr = document.createElement('tr');
		tr.innerHTML = `<td colspan="3" class="muted">No hours recorded for this month yet.</td>`;
		tableBody.appendChild(tr);
		return;
	}
	entries.forEach(entry => {
		const status = entry.hours >= 8 ? 'Present' : entry.hours > 0 ? 'Partial' : 'Absent';
		const cls = entry.hours >= 8 ? 'present' : entry.hours > 0 ? 'partial' : 'absent';
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${formatDateHuman(entry.date)}</td>
			<td>${formatHoursValue(entry.hours)} h</td>
			<td><span class="tag ${cls}">${status}</span></td>
		`;
		tableBody.appendChild(tr);
	});
}
function saveHoursEntry(hoursValue){
	if(!AUTH || AUTH.role !== 'client'){ return; }
	const empSelect = byId('hours-employee');
	const monthInput = byId('hours-month');
	const dateInput = byId('hours-date');
	const feedback = byId('hours-error');
	if(!empSelect || !monthInput || !dateInput || !feedback){ return; }
	const empId = empSelect.value;
	const month = monthInput.value;
	const date = dateInput.value;
	if(!empId || !month || !date){
		feedback.style.color = 'var(--danger)';
		feedback.textContent = 'Select employee, month, and date.';
		return;
	}
	if(!date.startsWith(month)){
		feedback.style.color = 'var(--danger)';
		feedback.textContent = 'Date must be within the selected month.';
		return;
	}
	const hoursNum = Number(hoursValue);
	if(Number.isNaN(hoursNum) || hoursNum < 0 || hoursNum > 24){
		feedback.style.color = 'var(--danger)';
		feedback.textContent = 'Enter hours between 0 and 24.';
		return;
	}
	hourEntries = upsertHourEntry({ empId, date, hours: hoursNum });
	feedback.style.color = 'var(--accent)';
	feedback.textContent = `Saved ${formatHoursValue(hoursNum)} h for ${formatDateHuman(date)}.`;
	renderHoursView();
	setTimeout(() => {
		const fb = byId('hours-error');
		if(fb){
			fb.textContent = '';
			fb.style.color = 'var(--muted)';
		}
	}, 2500);
}

// Payroll
function renderPayrollEmployees(){
	const sel = byId('payroll-employee');
	sel.innerHTML = '';
	if(AUTH && AUTH.role === 'employee'){
		const emp = EMPLOYEES.find(e => e.id === AUTH.empId);
		if(emp){
			const opt = document.createElement('option');
			opt.value = emp.id;
			opt.textContent = `${emp.name} (${emp.id})`;
			sel.appendChild(opt);
			sel.value = emp.id;
		}
		sel.disabled = true;
	} else {
		EMPLOYEES.forEach(e => {
			const opt = document.createElement('option');
			opt.value = e.id;
			opt.textContent = `${e.name} - ${e.role}`;
			sel.appendChild(opt);
		});
		sel.disabled = false;
	}
}

function showPayrollSummary(emp, month){
	const breakup = computePayrollBreakup(emp.salary);
	byId('payroll-summary').innerHTML = `
		<div class="payroll-grid">
			<div class="cell">
				<div class="label">Employee</div>
				<div class="value">${emp.name} (${emp.id})</div>
			</div>
			<div class="cell">
				<div class="label">Month</div>
				<div class="value">${month}</div>
			</div>
			<div class="cell">
				<div class="label">Gross</div>
				<div class="value">${formatCurrencyINR(breakup.gross)}</div>
			</div>
			<div class="cell">
				<div class="label">Deductions</div>
				<div class="value">${formatCurrencyINR(breakup.pf + breakup.professionalTax)}</div>
			</div>
			<div class="cell">
				<div class="label">Net Pay</div>
				<div class="value">${formatCurrencyINR(breakup.net)}</div>
			</div>
			<div class="cell">
				<button class="primary" id="payroll-download">Download Payslip</button>
			</div>
		</div>
	`;
	byId('payroll-download').addEventListener('click', () => generatePayslipPdf(emp, month));
}

// Holidays & fests
function renderHolidays(){
	const hl = byId('holidays-list'); hl.innerHTML = '';
	HOLIDAYS.forEach(h => {
		const li = document.createElement('li');
		li.innerHTML = `<span>${h.name}</span><span class="muted">${h.date}</span>`;
		hl.appendChild(li);
	});
	const fl = byId('fests-list'); fl.innerHTML = '';
	FESTS.forEach(f => {
		const li = document.createElement('li');
		li.innerHTML = `<span>${f.name}</span><span class="muted">${f.date}</span>`;
		fl.appendChild(li);
	});
}

// Init
window.addEventListener('DOMContentLoaded', () => {
	const now = new Date();
	const currentYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

	// Nav
	document.querySelectorAll('.nav-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const route = btn.dataset.route;
			if(!route){ return; }
			if(route !== 'login' && !AUTH){
				showRoute('login');
				return;
			}
			if(route === 'hours' && (!AUTH || AUTH.role !== 'client')){
				showRoute(AUTH ? 'dashboard' : 'login');
				return;
			}
			showRoute(route);
		});
	});
	byId('btn-logout').addEventListener('click', () => {
		clearAuth();
		AUTH = null;
		applyAuthGuards();
		showRoute('login');
	});

	// Dashboard
	renderDashboard();

	// Employees
	renderEmployees();
	byId('employee-search').addEventListener('input', (e) => renderEmployees(e.target.value));
	byId('back-to-list').addEventListener('click', () => {
		byId('employee-profile').hidden = true;
	});
	byId('btn-generate-payslip').addEventListener('click', () => {
		if(!selectedEmployee){ return; }
		// Employees can only download their own; client can download any opened profile
		if(AUTH && AUTH.role === 'employee' && selectedEmployee.id !== AUTH.empId){ return; }
		const now = new Date();
		const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
		generatePayslipPdf(selectedEmployee, month);
	});

	// Chat
	renderChatUsers();
	renderChatWindow();
	byId('chat-form').addEventListener('submit', (e) => {
		e.preventDefault();
		if(!AUTH){ return; }
		const empId = byId('chat-user').value;
		const text = byId('chat-input').value.trim();
		if(!text) return;
		addChatMessage({ empId, text, ts: Date.now() });
		byId('chat-input').value = '';
		renderChatWindow();
	});

	// Payroll
	renderPayrollEmployees();
	byId('payroll-month').value = currentYm;
	byId('payroll-month').max = currentYm; // prevent picking future months in UI
	byId('payroll-generate').addEventListener('click', () => {
		if(!AUTH){ showRoute('login'); return; }
		const emp = EMPLOYEES.find(e => e.id === byId('payroll-employee').value);
		const month = byId('payroll-month').value || currentYm;
		if(!emp) return;
		// Validate month is not in the future
		const err = byId('payroll-error');
		if(monthCompare(month, currentYm) > 0){
			err.textContent = 'Cannot generate payslip for a future month.';
			return;
		}
		// If current month, only allow after 10 PM on the last day
		if(monthCompare(month, currentYm) === 0){
			if(!isCurrentMonthEligible(new Date(), month)){
				const [y, m] = month.split('-').map(Number);
				const lastDay = lastDayOfMonth(y, m - 1);
				const when = new Date(y, m - 1, lastDay, 22, 0, 0, 0);
				err.textContent = `Payslip for ${month} will be available after 10:00 PM on ${when.toLocaleDateString()}.`;
				return;
			}
		}
		err.textContent = '';
		// Guard: employee can only generate their own
		if(AUTH.role === 'employee' && AUTH.empId !== emp.id){ return; }
		showPayrollSummary(emp, month);
	});

	// Hours tracker
	renderHoursEmployeeSelect();
	const hoursEmployee = byId('hours-employee');
	const hoursMonth = byId('hours-month');
	const hoursDate = byId('hours-date');
	const hoursValue = byId('hours-value');
	const hoursSave = byId('hours-save');
	const hoursPresent = byId('hours-present');
	if(hoursMonth){
		hoursMonth.value = currentYm;
		hoursMonth.max = currentYm;
		hoursMonth.addEventListener('change', () => {
			renderHoursView();
		});
	}
	if(hoursEmployee){
		hoursEmployee.addEventListener('change', () => renderHoursView());
	}
	if(hoursDate){
		const selectedMonth = hoursMonth ? hoursMonth.value : currentYm;
		updateHoursDateBounds(selectedMonth);
		if(!hoursDate.value){
			hoursDate.value = monthCompare(selectedMonth, currentYm) === 0 ? formatDateInput(now) : `${selectedMonth}-01`;
		}
	}
	if(hoursSave){
		hoursSave.addEventListener('click', () => {
			const value = hoursValue ? hoursValue.value : '';
			saveHoursEntry(value);
		});
	}
	if(hoursPresent){
		hoursPresent.addEventListener('click', () => {
			if(hoursValue){
				hoursValue.value = '8';
			}
			saveHoursEntry(8);
		});
	}
	renderHoursView();

	// Holidays
	renderHolidays();

	// Footer year
	byId('year').textContent = new Date().getFullYear();

	// Client login
	const clForm = byId('client-login-form');
	clForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const code = byId('client-code').value.trim();
		if(code === CLIENT_PIN){
			writeAuth({ role: 'client' });
			requireAuth('dashboard');
			byId('client-login-error').textContent = '';
			byId('client-code').value = '';
		} else {
			byId('client-login-error').textContent = 'Invalid access code.';
		}
	});
	// Employee login
	const empForm = byId('employee-login-form');
	empForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const empIdRaw = byId('employee-login-id').value.trim();
		const usernameRaw = byId('employee-login-username').value.trim();
		const password = byId('employee-login-password').value;
		const emp = EMPLOYEES.find(x => x.id.toUpperCase() === empIdRaw.toUpperCase());
		if(emp && emp.username.toLowerCase() === usernameRaw.toLowerCase() && emp.password === password){
			writeAuth({ role: 'employee', empId: emp.id });
			requireAuth('dashboard');
			byId('employee-login-error').textContent = '';
			['employee-login-id','employee-login-username','employee-login-password'].forEach(id => {
				const el = byId(id);
				if(el){ el.value = ''; }
			});
		} else {
			byId('employee-login-error').textContent = 'Invalid employee ID, username, or password.';
		}
	});

	// Role choice -> reveal respective form
	const chooseClient = byId('choose-client');
	const chooseEmployee = byId('choose-employee');
	const clientCard = byId('client-login-card');
	const employeeCard = byId('employee-login-card');
	if(chooseClient && chooseEmployee){
		const activateTab = (active, inactive) => {
			active.classList.add('active');
			active.setAttribute('aria-selected', 'true');
			active.setAttribute('tabindex', '0');
			inactive.classList.remove('active');
			inactive.setAttribute('aria-selected', 'false');
			inactive.setAttribute('tabindex', '-1');
		};
		const showClient = () => {
			if(clientCard){ clientCard.hidden = false; }
			if(employeeCard){ employeeCard.hidden = true; }
			activateTab(chooseClient, chooseEmployee);
			const field = clientCard ? clientCard.querySelector('input') : null;
			if(field){ field.focus({ preventScroll: true }); }
		};
		const showEmployee = () => {
			if(clientCard){ clientCard.hidden = true; }
			if(employeeCard){ employeeCard.hidden = false; }
			activateTab(chooseEmployee, chooseClient);
			const field = employeeCard ? employeeCard.querySelector('select, input') : null;
			if(field){ field.focus({ preventScroll: true }); }
		};
		chooseClient.addEventListener('click', showClient);
		chooseEmployee.addEventListener('click', showEmployee);
		[chooseClient, chooseEmployee].forEach((tab, index, tabs) => {
			tab.addEventListener('keydown', (event) => {
				if(event.key === 'ArrowRight' || event.key === 'ArrowLeft'){
					event.preventDefault();
					const delta = event.key === 'ArrowRight' ? 1 : -1;
					const nextIndex = (index + delta + tabs.length) % tabs.length;
					const nextTab = tabs[nextIndex];
					nextTab.focus();
					nextTab.click();
				}
				if(event.key === 'Enter' || event.key === ' '){
					event.preventDefault();
					tab.click();
				}
			});
		});
	}

	// Enforce auth on load
	requireAuth('dashboard');
});


