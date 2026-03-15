import { dataStore } from './data.js';

export const testService = {
  async getTests() {
    if (!dataStore.data) await dataStore.init();
    return dataStore.data ? dataStore.data.tests : [];
  },

  async getTestById(id) {
    const tests = await this.getTests();
    return tests.find(t => t.id === id);
  },

  async createTest(testData, getCurrentUserFn) {
    if (!dataStore.data) await dataStore.init();
    const user = await getCurrentUserFn();
    
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

    dataStore.data.tests.unshift(newTest); // Add to beginning
    dataStore.save();
    return newTest;
  },

  async updateTest(id, updates) {
    if (!dataStore.data) await dataStore.init();
    const index = dataStore.data.tests.findIndex(t => t.id === id);
    if (index !== -1) {
      dataStore.data.tests[index] = { ...dataStore.data.tests[index], ...updates };
      // Deep merge settings if provided
      if (updates.settings) {
        dataStore.data.tests[index].settings = { ...dataStore.data.tests[index].settings, ...updates.settings };
      }
      dataStore.save();
      return true;
    }
    return false;
  },

  async addQuestion(testId, question) {
    if (!dataStore.data) await dataStore.init();
    const test = dataStore.data.tests.find(t => t.id === testId);
    if (test) {
      const newQuestion = {
        id: Math.random().toString(36).substr(2, 9),
        ...question
      };
      test.questions.push(newQuestion);
      dataStore.save();
      return newQuestion;
    }
    return null;
  },

  async updateQuestion(testId, qid, updates) {
    if (!dataStore.data) await dataStore.init();
    const test = dataStore.data.tests.find(t => t.id === testId);
    if (test) {
      const qIndex = test.questions.findIndex(q => q.id === qid);
      if (qIndex !== -1) {
        test.questions[qIndex] = { ...test.questions[qIndex], ...updates };
        dataStore.save();
        return true;
      }
    }
    return false;
  },

  async deleteQuestion(testId, qid) {
    if (!dataStore.data) await dataStore.init();
    const test = dataStore.data.tests.find(t => t.id === testId);
    if (test) {
      test.questions = test.questions.filter(q => q.id !== qid);
      dataStore.save();
      return true;
    }
    return false;
  }
};