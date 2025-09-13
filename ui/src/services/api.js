const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Expenses API
  async getExpenses() {
    return this.request('/expenses');
  }

  async createExpense(expense) {
    return this.request('/expenses', {
      method: 'POST',
      body: expense,
    });
  }

  async updateExpense(id, expense) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: expense,
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Assets API
  async getAssets() {
    return this.request('/assets');
  }

  async createAsset(asset) {
    return this.request('/assets', {
      method: 'POST',
      body: asset,
    });
  }

  async updateAsset(id, asset) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: asset,
    });
  }

  async deleteAsset(id) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Summary API
  async getSummary() {
    return this.request('/summary');
  }
}

export default new ApiService();