import { useState, useEffect } from 'react';
import { getAllCategories } from '../services/categoryService';
import { useTranslation } from 'react-i18next';

const RecurringPaymentForm = ({ onClose, payment, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    description: '',
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    dayOfMonth: '',
    dayOfWeek: '',
    monthOfYear: '',
    autoCreate: false,
    reminderDays: 3,
    isActive: true
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (payment) {
      setFormData({
        name: payment.name || '',
        category: payment.category?._id || payment.category || '',
        amount: payment.amount || '',
        description: payment.description || '',
        frequency: payment.frequency || 'monthly',
        startDate: payment.startDate ? new Date(payment.startDate).toISOString().split('T')[0] : '',
        endDate: payment.endDate ? new Date(payment.endDate).toISOString().split('T')[0] : '',
        dayOfMonth: payment.dayOfMonth || '',
        dayOfWeek: payment.dayOfWeek || '',
        monthOfYear: payment.monthOfYear || '',
        autoCreate: payment.autoCreate || false,
        reminderDays: payment.reminderDays || 3,
        isActive: payment.isActive !== undefined ? payment.isActive : true
      });
    }
  }, [payment]);

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.category || !formData.amount || !formData.startDate) {
      alert(t('requiredFieldsError'));
      return;
    }

    // Additional validation based on frequency
    if (formData.frequency === 'monthly' && !formData.dayOfMonth) {
      alert('Day of month is required for monthly payments');
      return;
    }
    if (formData.frequency === 'weekly' && formData.dayOfWeek === '') {
      alert('Day of week is required for weekly payments');
      return;
    }
    if (formData.frequency === 'yearly' && (!formData.dayOfMonth || !formData.monthOfYear)) {
      alert('Day and month are required for yearly payments');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : undefined,
        dayOfWeek: formData.dayOfWeek !== '' ? parseInt(formData.dayOfWeek) : undefined,
        monthOfYear: formData.monthOfYear ? parseInt(formData.monthOfYear) : undefined,
        reminderDays: parseInt(formData.reminderDays),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving recurring payment:', error);
      alert(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const frequencyOptions = [
    { value: 'weekly', label: t('weekly') },
    { value: 'monthly', label: t('monthly') },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: t('yearly') }
  ];

  const dayOfWeekOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('name')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('category')} *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('amount')} (TRY) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('frequency')} *
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Conditional Fields Based on Frequency */}
          {formData.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Week *
              </label>
              <select
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Select day</option>
                {dayOfWeekOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(formData.frequency === 'monthly' || formData.frequency === 'quarterly') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day of Month *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                name="dayOfMonth"
                value={formData.dayOfMonth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          )}

          {formData.frequency === 'yearly' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Month *
                </label>
                <select
                  name="monthOfYear"
                  value={formData.monthOfYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select month</option>
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Day of Month *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="dayOfMonth"
                  value={formData.dayOfMonth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </>
          )}

          {/* Reminder Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reminder Days
            </label>
            <input
              type="number"
              min="0"
              max="30"
              name="reminderDays"
              value={formData.reminderDays}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Auto Create Checkbox */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="autoCreate"
                checked={formData.autoCreate}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-create expense when due
              </span>
            </label>
          </div>

          {/* Active Checkbox - only for edit mode */}
          {payment && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </span>
              </label>
            </div>
          )}

          {/* Spacer for balance when not in edit mode */}
          {!payment && <div></div>}
        </div>
      </div>

      {/* Description - Full Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('description')}
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('loading') : payment ? t('update') : t('save')}
        </button>
      </div>
    </form>
  );
};

export default RecurringPaymentForm;