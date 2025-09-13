const API_BASE_URL = 'http://localhost/api';

// GET all assets
export const getAllAssets = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

// POST new asset
export const createAsset = async (assetData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assetData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
};

// PUT update asset
export const updateAsset = async (id, assetData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assetData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
};

// DELETE asset
export const deleteAsset = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
};

// GET assets progress
export const getAssetsProgress = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/assets/progress`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching assets progress:', error);
    throw error;
  }
};