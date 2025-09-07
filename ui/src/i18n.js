import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      assets: 'Assets',
      totalBalance: 'Total Balance',
      monthlyIncome: 'Monthly Income',
      monthlyExpenses: 'Monthly Expenses',
      savingsRate: 'Savings Rate',
      recentTransactions: 'Recent Transactions',
      expenseCategories: 'Expense Categories',
      budgetOverview: 'Budget Overview',
      addExpense: 'Add Expense',
      addAsset: 'Add Asset',
      amount: 'Amount',
      category: 'Category',
      date: 'Date',
      description: 'Description',
      save: 'Save',
      cancel: 'Cancel',
    }
  },
  tr: {
    translation: {
      dashboard: 'Gösterge Paneli',
      expenses: 'Giderler',
      assets: 'Varlıklar',
      totalBalance: 'Toplam Bakiye',
      monthlyIncome: 'Aylık Gelir',
      monthlyExpenses: 'Aylık Giderler',
      savingsRate: 'Tasarruf Oranı',
      recentTransactions: 'Son İşlemler',
      expenseCategories: 'Gider Kategorileri',
      budgetOverview: 'Bütçe Özeti',
      addExpense: 'Gider Ekle',
      addAsset: 'Varlık Ekle',
      amount: 'Tutar',
      category: 'Kategori',
      date: 'Tarih',
      description: 'Açıklama',
      save: 'Kaydet',
      cancel: 'İptal',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;