// Demo data for Yodhin Solutions
// Employees (1-8)
const EMPLOYEES = [
	{
		id: 'Yodhin_007', name: 'Arun Kumar g', role: 'QA Engineer', team: 'quality',
		email: 'aganesan@yodhinsolutions.com', phone: '+91 90000 00001',
		username: 'aganesan', password: 'Yodhin_007',
		avatar: 'https://i.pravatar.cc/150?img=11',
		totalLeaves: 24, leavesTaken: 6,
		salary: 85000
	},
	{
		id: 'E002', name: 'govindharaj', role: 'Devops engineer', team: 'support',
		email: 'gmanickam@yodhinsolutions.com', phone: '+91 90000 00002',
		username: 'isha.k', password: 'YS@9354',
		avatar: 'https://i.pravatar.cc/150?img=12',
		totalLeaves: 24, leavesTaken: 4,
		salary: 65000
	},
	{
		id: 'E003', name: 'Rohan Gupta', role: 'UI/UX Designer', team: 'Design',
		email: 'rohan@yodhinsolutions.com', phone: '+91 90000 00003',
		username: 'rohan.g', password: 'YS@7620',
		avatar: 'https://i.pravatar.cc/150?img=13',
		totalLeaves: 24, leavesTaken: 5,
		salary: 70000
	},
	{
		id: 'E004', name: 'Neha Verma', role: 'Product Manager', team: 'Product',
		email: 'neha@yodhinsolutions.com', phone: '+91 90000 00004',
		username: 'neha.v', password: 'YS@4488',
		avatar: 'https://i.pravatar.cc/150?img=14',
		totalLeaves: 30, leavesTaken: 8,
		salary: 120000
	},
	{
		id: 'E005', name: 'Kunal Sharma', role: 'DevOps Engineer', team: 'Infra',
		email: 'kunal@yodhinsolutions.com', phone: '+91 90000 00005',
		username: 'kunal.s', password: 'YS@5542',
		avatar: 'https://i.pravatar.cc/150?img=15',
		totalLeaves: 24, leavesTaken: 3,
		salary: 90000
	},
	{
		id: 'E006', name: 'Priya Iyer', role: 'Data Analyst', team: 'Data',
		email: 'priya@yodhinsolutions.com', phone: '+91 90000 00006',
		username: 'priya.i', password: 'YS@2145',
		avatar: 'https://i.pravatar.cc/150?img=16',
		totalLeaves: 24, leavesTaken: 2,
		salary: 75000
	},
	{
		id: 'E007', name: 'Vikram Singh', role: 'HR Specialist', team: 'People',
		email: 'vikram@yodhinsolutions.com', phone: '+91 90000 00007',
		username: 'vikram.s', password: 'YS@3371',
		avatar: 'https://i.pravatar.cc/150?img=17',
		totalLeaves: 30, leavesTaken: 1,
		salary: 60000
	},
	{
		id: 'E008', name: 'Simran Kaur', role: 'Accountant', team: 'Finance',
		email: 'simran@yodhinsolutions.com', phone: '+91 90000 00008',
		username: 'simran.k', password: 'YS@6630',
		avatar: 'https://i.pravatar.cc/150?img=18',
		totalLeaves: 24, leavesTaken: 7,
		salary: 70000
	}
];

// Holidays (sample current year)
const HOLIDAYS = [
	{ date: '2025-01-26', name: 'Republic Day' },
	{ date: '2025-03-14', name: 'Holi' },
	{ date: '2025-08-15', name: 'Independence Day' },
	{ date: '2025-10-02', name: 'Gandhi Jayanti' },
	{ date: '2025-10-20', name: 'Diwali' },
	{ date: '2025-12-25', name: 'Christmas' }
];

// Fests / Events
const FESTS = [
	{ date: '2025-04-05', name: 'Annual Day' },
	{ date: '2025-06-21', name: 'Team Offsite' },
	{ date: '2025-12-20', name: 'Year-end Party' }
];

// Simple chat persistence
const CHAT_STORAGE_KEY = 'ys_chat_messages';
function getChatMessages() {
	try {
		const raw = localStorage.getItem(CHAT_STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function addChatMessage(message) {
	const list = getChatMessages();
	list.push(message);
	localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(list));
	return list;
}

// Auth demo secrets (client-only; for production use a backend)
const CLIENT_PIN = 'YS-CLIENT';
const AUTH_STORAGE_KEY = 'ys_auth_state';
function readAuth() {
	try {
		const raw = localStorage.getItem(AUTH_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function writeAuth(state) {
	localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}
function clearAuth() {
	localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Working hours tracking
const HOURS_STORAGE_KEY = 'ys_hours_records';
function loadHourEntries() {
	try {
		const raw = localStorage.getItem(HOURS_STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function saveHourEntries(entries) {
	localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(entries));
}
function upsertHourEntry(entry) {
	const entries = loadHourEntries();
	const idx = entries.findIndex(e => e.empId === entry.empId && e.date === entry.date);
	if (idx >= 0) {
		entries[idx] = entry;
	} else {
		entries.push(entry);
	}
	saveHourEntries(entries);
	return entries;
}


