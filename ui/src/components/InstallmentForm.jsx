import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { creditCardInstallmentService, creditCardService, creditCardUtils } from '../services/creditCardService';
import { getAllCategories } from '../services/categoryService';

const InstallmentForm = ({ creditCardId, installment = null, onSave, onCancel }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams(); // Credit card ID from URL
  const isEdit = !!installment;
  const cardId = creditCardId || id;

  const [formData, setFormData] = useState({
    creditCard: cardId || installment?.creditCard?._id || '',
    purchaseDescription: installment?.purchaseDescription || '',
    category: installment?.category?._id || '',
    merchant: installment?.merchant || '',
    originalAmount: installment?.originalAmount || 0,
    totalInstallments: installment?.totalInstallments || 3,
    interestRate: installment?.interestRate || 0,
    purchaseDate: installment?.purchaseDate ? 
      new Date(installment.purchaseDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    installmentType: installment?.installmentType || 'equal',
    earlyPaymentOption: installment?.earlyPaymentOption ?? true,
    earlyPaymentDiscount: installment?.earlyPaymentDiscount || 0,
    autoPayment: installment?.autoPayment || false,
    isPromotional: installment?.isPromotional || false,
    promotionalPeriod: installment?.promotionalPeriod || 0,
    promotionalRate: installment?.promotionalRate || 0,
    tags: installment?.tags || [],
    notes: installment?.notes || ''
  });

  const [creditCards, setCreditCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [calculationPreview, setCalculationPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (formData.originalAmount > 0 && formData.totalInstallments > 0) {
      calculatePreview();
    }
  }, [formData.originalAmount, formData.totalInstallments, formData.interestRate, formData.installmentType]);

  const fetchFormData = async () => {
    try {
      const [cardsData, categoriesData] = await Promise.all([
        creditCardService.getAllCreditCards(),
        getAllCategories()
      ]);
      
      setCreditCards(cardsData);
      setCategories(categoriesData.filter(cat => cat.isActive));

      // Set default category to "Kredi Kartı" if it exists
      const creditCardCategory = categoriesData.find(cat => cat.name === 'Kredi Kartı' && cat.isActive);
      if (creditCardCategory && !formData.category) {
        setFormData(prev => ({ ...prev, category: creditCardCategory._id }));
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const calculatePreview = () => {
    const { originalAmount, totalInstallments, interestRate, installmentType } = formData;
    
    if (originalAmount <= 0 || totalInstallments <= 0) return;

    let monthlyPayment, totalWithInterest, totalInterest;

    switch (installmentType) {
      case 'equal':
        if (interestRate > 0) {
          const monthlyRate = interestRate / 12;
          monthlyPayment = originalAmount * monthlyRate * Math.pow(1 + monthlyRate, totalInstallments) / 
                          (Math.pow(1 + monthlyRate, totalInstallments) - 1);
        } else {
          monthlyPayment = originalAmount / totalInstallments;
        }
        totalWithInterest = monthlyPayment * totalInstallments;
        totalInterest = totalWithInterest - originalAmount;
        break;
      
      case 'interest_first':
        totalInterest = originalAmount * interestRate * (totalInstallments / 12);
        totalWithInterest = originalAmount + totalInterest;
        monthlyPayment = totalWithInterest / totalInstallments;
        break;
      
      default:
        monthlyPayment = originalAmount / totalInstallments;
        totalWithInterest = originalAmount;
        totalInterest = 0;
    }

    setCalculationPreview({
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalWithInterest: Math.round(totalWithInterest * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : 
                      type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.creditCard) {
      newErrors.creditCard = t('creditCardRequired');
    }

    if (!formData.purchaseDescription.trim()) {
      newErrors.purchaseDescription = t('purchaseDescriptionRequired');
    }

    if (!formData.category) {
      newErrors.category = t('categoryRequired');
    }

    if (formData.originalAmount <= 0) {
      newErrors.originalAmount = t('originalAmountMustBePositive');
    }

    if (formData.totalInstallments < 1 || formData.totalInstallments > 36) {
      newErrors.totalInstallments = t('installmentsMustBeBetween1And36');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let savedInstallment;
      if (isEdit) {
        savedInstallment = await creditCardInstallmentService.updateInstallment(installment._id, formData);
      } else {
        savedInstallment = await creditCardInstallmentService.createInstallment(formData);
      }

      if (onSave) {
        onSave(savedInstallment);
      } else {
        navigate('/credit-cards');
      }
    } catch (error) {
      console.error('Error saving installment:', error);
      alert(t('errorSavingInstallment'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-1 gap-6">
        {/* Form Fields */}
        <div className="space-y-4">
              {/* Purchase Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('purchaseInformation')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('creditCard')} *
                    </label>
                    <select
                      name="creditCard"
                      value={formData.creditCard}
                      onChange={handleInputChange}
                      disabled={!!cardId}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.creditCard ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">{t('selectCreditCard')}</option>
                      {creditCards.map(card => (
                        <option key={card._id} value={card._id}>
                          {card.bankName} {card.name} (...{card.cardNumber})
                        </option>
                      ))}
                    </select>
                    {errors.creditCard && <p className="mt-1 text-sm text-red-500">{errors.creditCard}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('purchaseDescription')} *
                    </label>
                    <input
                      type="text"
                      name="purchaseDescription"
                      value={formData.purchaseDescription}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.purchaseDescription ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder={t('enterPurchaseDescription')}
                    />
                    {errors.purchaseDescription && <p className="mt-1 text-sm text-red-500">{errors.purchaseDescription}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('category')} *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('merchant')}
                      </label>
                      <input
                        type="text"
                        name="merchant"
                        value={formData.merchant}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder={t('enterMerchant')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('purchaseDate')} *
                      </label>
                      <input
                        type="date"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Installment Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('installmentDetails')}</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('originalAmount')} (TL) *
                      </label>
                      <input
                        type="number"
                        name="originalAmount"
                        value={formData.originalAmount}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.originalAmount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.originalAmount && <p className="mt-1 text-sm text-red-500">{errors.originalAmount}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('totalInstallments')} *
                      </label>
                      <input
                        type="number"
                        name="totalInstallments"
                        value={formData.totalInstallments}
                        onChange={handleInputChange}
                        min="1"
                        max="36"
                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                          errors.totalInstallments ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.totalInstallments && <p className="mt-1 text-sm text-red-500">{errors.totalInstallments}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('interestRate')} (% {t('annual')})
                      </label>
                      <input
                        type="number"
                        name="interestRate"
                        value={(formData.interestRate * 100).toFixed(2)}
                        onChange={(e) => handleInputChange({
                          target: {
                            name: 'interestRate',
                            value: parseFloat(e.target.value) / 100,
                            type: 'number'
                          }
                        })}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('installmentType')}
                      </label>
                      <select
                        name="installmentType"
                        value={formData.installmentType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="equal">{t('equalPayments')}</option>
                        <option value="balloon">{t('balloonPayment')}</option>
                        <option value="interest_first">{t('interestFirst')}</option>
                        <option value="principal_first">{t('principalFirst')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

          {/* Payment Preview */}
          {calculationPreview && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 p-4 rounded-lg">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                <FiInfo className="mr-2" />
                {t('paymentPreview')}
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('monthlyPayment')}:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {creditCardUtils.formatCurrency(calculationPreview.monthlyPayment)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('totalAmount')}:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {creditCardUtils.formatCurrency(calculationPreview.totalWithInterest)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('totalInterest')}:</span>
                  <span className={`font-semibold ${calculationPreview.totalInterest > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {creditCardUtils.formatCurrency(calculationPreview.totalInterest)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes and Tags */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{t('additionalInfo')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('notes')}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t('enterNotes')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tags')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={t('addTag')}
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    {t('add')}
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-xs flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="ml-1 text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{t('options')}</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="earlyPaymentOption"
                  checked={formData.earlyPaymentOption}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('allowEarlyPayment')}</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoPayment"
                  checked={formData.autoPayment}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('autoPayment')}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center text-sm"
        >
          <FiX className="mr-1" size={16} />
          {t('cancel')}
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
        >
          <FiSave className="mr-1" size={16} />
          {loading ? t('saving') : (isEdit ? t('updateInstallment') : t('addInstallment'))}
        </button>
      </div>
    </form>
  );
};

export default InstallmentForm;