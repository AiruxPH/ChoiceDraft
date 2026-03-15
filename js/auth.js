import { dataStore } from './data.js';

export const authService = {
  async getCurrentUser() {
    if (!dataStore.data) await dataStore.init();
    return dataStore.data ? dataStore.data.currentUser : null;
  },

  async login(email, password) {
    if (!dataStore.data) await dataStore.init();
    const user = dataStore.data.users.find(u => u.email === email && u.password === password);
    if (user) {
      // Don't store password in currentUser session object
      const { password, ...sessionUser } = user;
      dataStore.data.currentUser = sessionUser;
      dataStore.save();
      return { success: true, user: sessionUser };
    }
    return { success: false, error: "Invalid email or password" };
  },

  async register(name, email, password) {
    if (!dataStore.data) await dataStore.init();
    if (dataStore.data.users.some(u => u.email === email)) {
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

    dataStore.data.users.push(newUser);
    const { password: pw, ...sessionUser } = newUser;
    dataStore.data.currentUser = sessionUser;
    dataStore.save();
    return { success: true, user: sessionUser };
  },

  async logout() {
    if (!dataStore.data) await dataStore.init();
    dataStore.data.currentUser = null;
    dataStore.save();
    return true;
  }
};