import { useState, useEffect } from 'react';
import DynamicTable from '../components/DynamicTable';
import Modal from '../components/Modal';
import CategoryForm from '../components/CategoryForm';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Categories = () => {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t('categories')} - ${t('appTitle')}`;
  }, [t]);

  // Fetch categories from API on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (category) => {
    if (window.confirm(t('confirmDeleteCategory'))) {
      try {
        await deleteCategory(category._id);
        setCategories(categories.filter(c => c._id !== category._id));
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('Failed to delete category');
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (categoryData) => {
    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory = await updateCategory(editingCategory._id, categoryData);
        setCategories(categories.map(category => 
          category._id === editingCategory._id ? updatedCategory : category
        ));
      } else {
        // Add new category
        const newCategory = await createCategory(categoryData);
        setCategories([...categories, newCategory]);
      }
      handleModalClose();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const columns = [
    { header: t('name'), key: 'name' },
    { header: t('description'), key: 'description' },
    {
      header: t('color'),
      key: 'color',
      render: (row) => (
        <div className="flex items-center">
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-300 mr-2"
            style={{ backgroundColor: row.color }}
          ></div>
          <span className="text-sm text-gray-600">{row.color}</span>
        </div>
      )
    },
    {
      header: t('actions'),
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
            title={t('edit')}
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="text-red-600 hover:text-red-800 p-1 rounded"
            title={t('delete')}
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('categoryManagement')}</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <FiPlus className="mr-2"/>
            {t('addCategory')}
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('noData')}</p>
        </div>
      ) : (
        <DynamicTable columns={columns} data={categories} />
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingCategory ? t('editCategory') : t('addCategory')}>
        <CategoryForm onClose={handleModalClose} category={editingCategory} onSave={handleSave} />
      </Modal>
    </div>
  );
};

export default Categories;