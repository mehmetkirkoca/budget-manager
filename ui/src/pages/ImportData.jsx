import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  importFromFile,
  importDataWithOptions,
  getImportPreview,
  validateImportData,
  IMPORT_MODES,
  IMPORT_COLLECTIONS
} from '../services/importService';

const ImportData = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    mode: 'merge',
    skipDuplicates: true,
    validateData: true,
    collections: ['all']
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file);
        setError('');
        setPreview(null);
      } else {
        setError('Please select a valid JSON file');
        setSelectedFile(null);
      }
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const previewData = await getImportPreview(jsonData);
          setPreview(previewData);
        } catch (error) {
          setError(`Error generating preview: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      setError(`Error reading file: ${error.message}`);
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importFromFile(selectedFile, importOptions);
      setSuccess(`Import completed successfully! Imported ${result.summary?.totalRecords || 0} records.`);
      setPreview(null);

      // Redirect to dashboard after successful import
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(`Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setImportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCollectionToggle = (collectionId) => {
    setImportOptions(prev => {
      const newCollections = prev.collections.includes('all')
        ? IMPORT_COLLECTIONS.map(c => c.id)
        : [...prev.collections];

      if (collectionId === 'all') {
        return {
          ...prev,
          collections: ['all']
        };
      }

      const index = newCollections.indexOf(collectionId);
      if (index > -1) {
        newCollections.splice(index, 1);
      } else {
        newCollections.push(collectionId);
      }

      return {
        ...prev,
        collections: newCollections.length === 0 ? ['all'] : newCollections
      };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Import Budget Data</h1>
          <p className="text-gray-600 dark:text-gray-400">Import your budget data from a JSON export file</p>
        </div>

        {/* File Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Import File</h2>
          <div className="mb-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
            />
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        {/* Import Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Import Options</h2>

          {/* Import Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Mode</label>
            <div className="space-y-2">
              {IMPORT_MODES.map(mode => (
                <label key={mode.id} className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value={mode.id}
                    checked={importOptions.mode === mode.id}
                    onChange={(e) => handleOptionChange('mode', e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{mode.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{mode.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Collections to Import */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data to Import</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.collections.includes('all')}
                  onChange={() => handleCollectionToggle('all')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">All Data</span>
              </label>
              {IMPORT_COLLECTIONS.map(collection => (
                <label key={collection.id} className="flex items-center ml-4">
                  <input
                    type="checkbox"
                    checked={importOptions.collections.includes(collection.id) || importOptions.collections.includes('all')}
                    onChange={() => handleCollectionToggle(collection.id)}
                    disabled={importOptions.collections.includes('all')}
                    className="mr-2 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{collection.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{collection.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={importOptions.skipDuplicates}
                onChange={(e) => handleOptionChange('skipDuplicates', e.target.checked)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900 dark:text-gray-100">Skip duplicate records</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={importOptions.validateData}
                onChange={(e) => handleOptionChange('validateData', e.target.checked)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900 dark:text-gray-100">Validate data before import</span>
            </label>
          </div>
        </div>

        {/* Preview Section */}
        {preview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Import Preview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(preview.summary || {}).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="text-red-800 dark:text-red-300">{error}</div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="text-green-800 dark:text-green-300">{success}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handlePreview}
            disabled={!selectedFile || loading}
            className="px-6 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating Preview...' : 'Preview Import'}
          </button>

          <button
            onClick={handleImport}
            disabled={!selectedFile || loading}
            className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportData;