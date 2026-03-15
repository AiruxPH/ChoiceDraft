// Shared application logic

// Handle generic page transitions
export function navigateTo(url) {
  window.location.href = url;
}

// --- Data Persistence Service ---
// Handles loading from data.json and saving to localStorage for live demo experience

const STORAGE_KEY = 'choicedraft_data';

// Embedded fallback data – used when fetch() is unavailable (e.g., file:// protocol)
const DEFAULT_USERS = [
  { id: 'user_1', name: 'Alex Educator', email: 'alex@example.com', password: 'password123', role: 'Teacher', institution: 'Springfield High' },
  { id: 'user_2', name: 'Maria Santos', email: 'maria@example.com', password: 'password123', role: 'Student', institution: 'ChoiceDraft Academy' },
  { id: 'user_3', name: 'Jose Reyes', email: 'jose@example.com', password: 'password123', role: 'Contributor', institution: 'Manila Tech' }
];

export const dataService = {
  data: null,

  async init() {
    // 1. Try to load from localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
      if (!this.data.users) this.data.users = DEFAULT_USERS;
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
  },

  async getTests() {
    if (!this.data) await this.init();
    return this.data ? this.data.tests : [];
  },

  async getTestById(id) {
    const tests = await this.getTests();
    return tests.find(t => t.id === id);
  },

  async createTest(testData) {
    if (!this.data) await this.init();
    const user = await this.getCurrentUser();

    const newTest = {
      id: 'test_' + Math.random().toString(36).substr(2, 9),
      ownerId: user ? user.id : 'guest',
      title: 'Untitled Test',
      description: '',
      status: 'Draft',
      questions: [],
      settings: {
        timeLimit: null,
        shuffleQuestions: false,
        shuffleChoices: false
      },
      collaborators: [],
      attempts: [],
      createdAt: new Date().toISOString(),
      ...testData
    };

    this.data.tests.unshift(newTest); // Add to beginning
    this.save();
    return newTest;
  },

  async updateTest(id, updates) {
    if (!this.data) await this.init();
    const index = this.data.tests.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.tests[index] = { ...this.data.tests[index], ...updates };
      // Deep merge settings if provided
      if (updates.settings) {
        this.data.tests[index].settings = { ...this.data.tests[index].settings, ...updates.settings };
      }
      this.save();
      return true;
    }
    return false;
  },

  async addQuestion(testId, question) {
    if (!this.data) await this.init();
    const test = this.data.tests.find(t => t.id === testId);
    if (test) {
      const newQuestion = {
        id: Math.random().toString(36).substr(2, 9),
        ...question
      };
      test.questions.push(newQuestion);
      this.save();
      return newQuestion;
    }
    return null;
  },

  async updateQuestion(testId, qid, updates) {
    if (!this.data) await this.init();
    const test = this.data.tests.find(t => t.id === testId);
    if (test) {
      const qIndex = test.questions.findIndex(q => q.id === qid);
      if (qIndex !== -1) {
        test.questions[qIndex] = { ...test.questions[qIndex], ...updates };
        this.save();
        return true;
      }
    }
    return false;
  },

  async deleteQuestion(testId, qid) {
    if (!this.data) await this.init();
    const test = this.data.tests.find(t => t.id === testId);
    if (test) {
      test.questions = test.questions.filter(q => q.id !== qid);
      this.save();
      return true;
    }
    return false;
  },

  async getCurrentUser() {
    if (!this.data) await this.init();
    return this.data ? this.data.currentUser : null;
  },

  async login(email, password) {
    if (!this.data) await this.init();
    const user = this.data.users.find(u => u.email === email && u.password === password);
    if (user) {
      // Don't store password in currentUser session object
      const { password, ...sessionUser } = user;
      this.data.currentUser = sessionUser;
      this.save();
      return { success: true, user: sessionUser };
    }
    return { success: false, error: "Invalid email or password" };
  },

  async register(name, email, password) {
    if (!this.data) await this.init();
    if (this.data.users.some(u => u.email === email)) {
      return { success: false, error: "Email already registered" };
    }

    const newUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password,
      role: 'Teacher',
      institution: 'ChoiceDraft User'
    };

    this.data.users.push(newUser);
    const { password: pw, ...sessionUser } = newUser;
    this.data.currentUser = sessionUser;
    this.save();
    return { success: true, user: sessionUser };
  },

  async logout() {
    if (!this.data) await this.init();
    this.data.currentUser = null;
    this.save();
    return true;
  }
};

export const icons = {
  logo: `<svg viewBox="0 0 150 150" fill="none" class="w-full h-full">
<path clip-rule="evenodd"
              d="M137.5 29.1667C134.185 29.1667 131.005 30.4836 128.661 32.8278C126.317 35.172 125 38.3515 125 41.6667V50H150V41.6667C150 38.3515 148.683 35.172 146.339 32.8278C143.995 30.4836 140.815 29.1667 137.5 29.1667ZM150 58.3333H125V127.083L137.5 145.833L150 127.083V58.3333ZM0 12.5V137.5C0 140.815 1.31696 143.995 3.66117 146.339C6.00537 148.683 9.18479 150 12.5 150H104.167C107.482 150 110.661 148.683 113.005 146.339C115.35 143.995 116.667 140.815 116.667 137.5V12.5C116.667 9.18479 115.35 6.00537 113.005 3.66117C110.661 1.31696 107.482 0 104.167 0H12.5C9.18479 0 6.00537 1.31696 3.66117 3.66117C1.31696 6.00537 0 9.18479 0 12.5ZM58.3333 37.5C58.3333 36.3949 58.7723 35.3351 59.5537 34.5537C60.3351 33.7723 61.3949 33.3333 62.5 33.3333H95.8333C96.9384 33.3333 97.9982 33.7723 98.7796 34.5537C99.561 35.3351 100 36.3949 100 37.5C100 38.6051 99.561 39.6649 98.7796 40.4463C97.9982 41.2277 96.9384 41.6667 95.8333 41.6667H62.5C61.3949 41.6667 60.3351 41.2277 59.5537 40.4463C58.7723 39.6649 58.3333 38.6051 58.3333 37.5ZM62.5 50C61.3949 50 60.3351 50.439 59.5537 51.2204C58.7723 52.0018 58.3333 53.0616 58.3333 54.1667C58.3333 55.2717 58.7723 56.3315 59.5537 57.1129C60.3351 57.8943 61.3949 58.3333 62.5 58.3333H95.8333C96.9384 58.3333 97.9982 57.8943 98.7796 57.1129C99.561 56.3315 100 55.2717 100 54.1667C100 53.0616 99.561 52.0018 98.7796 51.2204C97.9982 50.439 96.9384 50 95.8333 50H62.5ZM58.3333 91.6667C58.3333 90.5616 58.7723 89.5018 59.5537 88.7204C60.3351 87.939 61.3949 87.5 62.5 87.5H95.8333C96.9384 87.5 97.9982 87.939 98.7796 88.7204C99.561 89.5018 100 90.5616 100 91.6667C100 92.7717 99.561 93.8315 98.7796 94.6129C97.9982 95.3943 96.9384 95.8333 95.8333 95.8333H62.5C61.3949 95.8333 60.3351 95.3943 59.5537 94.6129C58.7723 93.8315 58.3333 92.7717 58.3333 91.6667ZM62.5 104.167C61.3949 104.167 60.3351 104.606 59.5537 105.387C58.7723 106.168 58.3333 107.228 58.3333 108.333C58.3333 109.438 58.7723 110.498 59.5537 111.28C60.3351 112.061 61.3949 112.5 62.5 112.5H95.8333C96.9384 112.5 97.9982 112.061 98.7796 111.28C99.561 110.498 100 109.438 100 108.333C100 107.228 99.561 110.498 98.7796 105.387C97.9982 104.606 96.9384 104.167 95.8333 104.167H62.5ZM25 91.6667V104.167H37.5V91.6667H25ZM20.8333 83.3333H41.6667C42.7717 83.3333 43.8315 83.7723 44.6129 84.5537C45.3943 85.3351 45.8333 86.3949 45.8333 87.5V108.333C45.8333 109.438 45.3943 110.498 44.6129 111.28C43.8315 112.061 42.7717 112.5 41.6667 112.5H20.8333C19.7283 112.5 18.6685 112.061 17.8871 111.28C17.1057 110.498 16.6667 109.438 16.6667 108.333V87.5C16.6667 86.3949 17.1057 85.3351 17.8871 84.5537C18.6685 83.7723 19.7283 83.3333 20.8333 83.3333ZM48.7792 40.4458C49.5382 39.66 49.9581 38.6075 49.9486 37.515C49.9391 36.4225 49.5009 35.3775 48.7284 34.6049C47.9559 33.8324 46.9108 33.3942 45.8183 33.3847C44.7258 33.3752 43.6733 33.7952 42.8875 34.5542L29.1667 48.275L23.7792 42.8875C22.9933 42.1285 21.9408 41.7085 20.8483 41.718C19.7558 41.7275 18.7108 42.1657 17.9383 42.9383C17.1657 43.7108 16.7275 44.7558 16.718 45.8483C16.7085 46.9408 17.1285 47.9933 17.8875 48.7792L29.1667 60.0583L48.7792 40.4458Z"
              fill="currentColor" fill-rule="evenodd" />  </svg>`
};

// Redirect logic from splash
export async function splashRedirect() {
  const user = await dataService.getCurrentUser();
  if (user) {
    navigateTo('home.html');
  } else {
    // Check if onboarding was cleared (using localStorage to persist beyond data object)
    const hasSeenOnboarding = localStorage.getItem('choicedraft_onboarding_seen');
    if (!hasSeenOnboarding) {
      navigateTo('onboarding.html');
    } else {
      navigateTo('signin.html');
    }
  }
}

// Attach to window for non-module script access
window.ChoiceDraftApp = {
  navigateTo,
  dataService,
  splashRedirect
};
