// --- Core Data Initialization ---
const STORAGE_KEY = 'choicedraft_data';

// Embedded fallback data – used when fetch() is unavailable (e.g., file:// protocol)
export const DEFAULT_USERS = [
  { id: 'user_1', name: 'Alex Educator', email: 'alex@example.com', password: 'password123', role: 'Teacher', institution: 'Springfield High' },
  { id: 'user_2', name: 'Maria Santos', email: 'maria@example.com', password: 'password123', role: 'Student', institution: 'ChoiceDraft Academy' },
  { id: 'user_3', name: 'Jose Reyes', email: 'jose@example.com', password: 'password123', role: 'Contributor', institution: 'Manila Tech' }
];

export const dataStore = {
  data: null,

  async init() {
    // 1. Try to load from localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
      if (!this.data.users) this.data.users = DEFAULT_USERS;
      if (!this.data.tests) this.data.tests = []; // Fix: Ensure tests array exists
      return this.data;
    }

    // 2. Try fetching from JSON files (works on a local server)
    try {
      const [dataRes, usersRes] = await Promise.all([
        fetch('./data.json'),
        fetch('./users.json')
      ]);

      if (dataRes.ok) {
        this.data = await dataRes.json();
        this.data.users = usersRes.ok ? await usersRes.json() : DEFAULT_USERS;
        if (!this.data.tests) this.data.tests = []; // Fix: Ensure tests array exists
        this.save();
        return this.data;
      }
    } catch (e) {
      // fetch() failed (e.g., file:// protocol) — fall through to embedded data
      console.warn('fetch() failed, using embedded fallback data.', e.message);
    }

    // 3. Fallback: use embedded data directly (guarantees file:// compatibility)
    this.data = {
      tests: [],
      users: DEFAULT_USERS,
      currentUser: null
    };
    this.save();
    return this.data;
  },

  save() {
    if (this.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }
};
