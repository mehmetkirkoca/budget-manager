import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CategoryForm = ({ onClose, category, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setColor(category.color || '#6366f1');
    } else {
      setName('');
      setDescription('');
      setColor('#6366f1');
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('categoryNameRequired'));
      return;
    }
    
    const categoryData = { 
      name: name.trim(), 
      description: description.trim(), 
      color 
    };
    
    // Call the onSave callback with the category data
    if (onSave) {
      onSave(categoryData);
    }
  };

  const predefinedColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#6b7280'  // gray
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('name')}</label>
        <input 
          type="text" 
          id="name" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required 
          maxLength={50}
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('description')}</label>
        <input 
          type="text" 
          id="description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('color')}</label>
        <div className="flex items-center space-x-2">
          <input 
            type="color" 
            value={color} 
            onChange={e => setColor(e.target.value)} 
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-600">{color}</span>
        </div>
        
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">{t('predefinedColors')}:</p>
          <div className="flex flex-wrap gap-2">
            {predefinedColors.map(presetColor => (
              <button
                key={presetColor}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${color === presetColor ? 'border-gray-800' : 'border-gray-300'}`}
                style={{ backgroundColor: presetColor }}
                onClick={() => setColor(presetColor)}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
        >
          {t('cancel')}
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {category ? t('update') : t('save')}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;