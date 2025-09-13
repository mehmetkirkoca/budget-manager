import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiX, FiCreditCard } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { creditCardService } from '../services/creditCardService';

const CreditCardForm = ({ creditCard = null, onSave, onCancel }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!creditCard;

  const [formData, setFormData] = useState({
    name: creditCard?.name || '',
    bankName: creditCard?.bankName || '',
    cardType: creditCard?.cardType || 'visa',
    cardNumber: creditCard?.cardNumber || '',
    totalLimit: creditCard?.totalLimit || 0,
    availableLimit: creditCard?.availableLimit || 0,
    currentBalance: creditCard?.currentBalance || 0,
    statementDay: creditCard?.statementDay || 1,
    paymentDueDay: creditCard?.paymentDueDay || 15,
    minimumPaymentRate: creditCard?.minimumPaymentRate || 0.03,
    interestRate: {
      monthly: creditCard?.interestRate?.monthly || 0.0299,
      annual: creditCard?.interestRate?.annual || 0.359
    },
    gracePeriodDays: creditCard?.gracePeriodDays || 45,
    cashAdvanceRate: creditCard?.cashAdvanceRate || 0.04,
    fees: {
      annualFee: creditCard?.fees?.annualFee || 0,
      latePaymentFee: creditCard?.fees?.latePaymentFee || 50,
      overlimitFee: creditCard?.fees?.overlimitFee || 100
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const numericValue = type === 'number' ? parseFloat(value) || 0 : value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: numericValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('cardNameRequired');
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = t('bankNameRequired');
    }

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = t('cardNumberRequired');
    } else if (!/^\d{4}$/.test(formData.cardNumber)) {
      newErrors.cardNumber = t('cardNumberMustBe4Digits');
    }

    if (formData.totalLimit <= 0) {
      newErrors.totalLimit = t('totalLimitMustBePositive');
    }

    if (formData.availableLimit > formData.totalLimit) {
      newErrors.availableLimit = t('availableLimitCannotExceedTotal');
    }

    if (formData.statementDay < 1 || formData.statementDay > 31) {
      newErrors.statementDay = t('statementDayMustBeBetween1And31');
    }

    if (formData.paymentDueDay < 1 || formData.paymentDueDay > 31) {
      newErrors.paymentDueDay = t('paymentDueDayMustBeBetween1And31');
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
      let savedCard;
      if (isEdit) {
        savedCard = await creditCardService.updateCreditCard(creditCard._id, formData);
      } else {
        savedCard = await creditCardService.createCreditCard(formData);
      }

      if (onSave) {
        onSave(savedCard);
      } else {
        navigate('/credit-cards');
      }
    } catch (error) {
      console.error('Error saving credit card:', error);
      alert(t('errorSavingCard'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/credit-cards');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Information */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{t('basicInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('cardName')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('enterCardName')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('bankName')} *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('enterBankName')}
                />
                {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('cardType')} *
                </label>
                <select
                  name="cardType"
                  value={formData.cardType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="americanexpress">American Express</option>
                  <option value="troy">Troy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('cardNumberLast4')} *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  maxLength={4}
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="1234"
                />
                {errors.cardNumber && <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>}
              </div>
            </div>
          </div>

          {/* Limits and Balance */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{t('limitsAndBalance')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('totalLimit')} (TL) *
                </label>
                <input
                  type="number"
                  name="totalLimit"
                  value={formData.totalLimit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.totalLimit ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.totalLimit && <p className="mt-1 text-sm text-red-500">{errors.totalLimit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('availableLimit')} (TL) *
                </label>
                <input
                  type="number"
                  name="availableLimit"
                  value={formData.availableLimit}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.availableLimit ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.availableLimit && <p className="mt-1 text-sm text-red-500">{errors.availableLimit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('currentBalance')} (TL)
                </label>
                <input
                  type="number"
                  name="currentBalance"
                  value={formData.currentBalance}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Payment Schedule */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{t('paymentSchedule')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('statementDay')} *
                </label>
                <input
                  type="number"
                  name="statementDay"
                  value={formData.statementDay}
                  onChange={handleInputChange}
                  min="1"
                  max="31"
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.statementDay ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.statementDay && <p className="mt-1 text-sm text-red-500">{errors.statementDay}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('paymentDueDay')} *
                </label>
                <input
                  type="number"
                  name="paymentDueDay"
                  value={formData.paymentDueDay}
                  onChange={handleInputChange}
                  min="1"
                  max="31"
                  className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.paymentDueDay ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.paymentDueDay && <p className="mt-1 text-sm text-red-500">{errors.paymentDueDay}</p>}
              </div>
            </div>
          </div>

          {/* Interest Rates */}
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{t('interestRates')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('monthlyInterestRate')} (%)
                </label>
                <input
                  type="number"
                  name="interestRate.monthly"
                  value={(formData.interestRate.monthly * 100).toFixed(2)}
                  onChange={(e) => handleInputChange({
                    target: {
                      name: 'interestRate.monthly',
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
                  {t('annualInterestRate')} (%)
                </label>
                <input
                  type="number"
                  name="interestRate.annual"
                  value={(formData.interestRate.annual * 100).toFixed(2)}
                  onChange={(e) => handleInputChange({
                    target: {
                      name: 'interestRate.annual',
                      value: parseFloat(e.target.value) / 100,
                      type: 'number'
                    }
                  })}
                  min="0"
                  max="1000"
                  step="0.01"
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
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
              {loading ? t('saving') : (isEdit ? t('updateCard') : t('addCard'))}
            </button>
          </div>
    </form>
  );
};

export default CreditCardForm;