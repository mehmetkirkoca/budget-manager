import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      assets: 'Assets',
      
      // Header & Common
      appTitle: 'Budget Manager',
      sidebarTitle: 'Budget',
      
      // Dashboard
      totalBalance: 'Total Balance',
      monthlyIncome: 'Monthly Income',
      monthlyExpenses: 'Monthly Expenses',
      savingsRate: 'Savings Rate',
      recentTransactions: 'Recent Transactions',
      expenseCategories: 'Expense Categories',
      budgetOverview: 'Budget Overview',
      
      // Forms
      addExpense: 'Add Expense',
      addAsset: 'Add Asset',
      amount: 'Amount',
      category: 'Category',
      date: 'Date',
      description: 'Description',
      name: 'Name',
      type: 'Type',
      value: 'Value',
      targetAmount: 'Target Amount',
      currentAmount: 'Current Amount',
      
      // Actions
      save: 'Save',
      cancel: 'Cancel',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      close: 'Close',
      
      // Categories
      food: 'Food',
      transport: 'Transport',
      entertainment: 'Entertainment',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      shopping: 'Shopping',
      education: 'Education',
      other: 'Other',
      
      // Asset Types
      savings: 'Savings',
      investment: 'Investment',
      realEstate: 'Real Estate',
      crypto: 'Cryptocurrency',
      
      // Table Headers
      actions: 'Actions',
      progress: 'Progress',
      
      // Messages
      noData: 'No data available',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Operation completed successfully',
    }
  },
  tr: {
    translation: {
      // Navigation
      dashboard: 'Gösterge Paneli',
      expenses: 'Giderler',
      assets: 'Varlıklar',
      
      // Header & Common
      appTitle: 'Bütçe Yöneticisi',
      sidebarTitle: 'Bütçe',
      
      // Dashboard
      totalBalance: 'Toplam Bakiye',
      monthlyIncome: 'Aylık Gelir',
      monthlyExpenses: 'Aylık Giderler',
      savingsRate: 'Tasarruf Oranı',
      recentTransactions: 'Son İşlemler',
      expenseCategories: 'Gider Kategorileri',
      budgetOverview: 'Bütçe Özeti',
      
      // Forms
      addExpense: 'Gider Ekle',
      addAsset: 'Varlık Ekle',
      amount: 'Tutar',
      category: 'Kategori',
      date: 'Tarih',
      description: 'Açıklama',
      name: 'İsim',
      type: 'Tür',
      value: 'Değer',
      targetAmount: 'Hedef Tutar',
      currentAmount: 'Mevcut Tutar',
      
      // Actions
      save: 'Kaydet',
      cancel: 'İptal',
      add: 'Ekle',
      edit: 'Düzenle',
      delete: 'Sil',
      close: 'Kapat',
      
      // Categories
      food: 'Yemek',
      transport: 'Ulaşım',
      entertainment: 'Eğlence',
      utilities: 'Faturalar',
      healthcare: 'Sağlık',
      shopping: 'Alışveriş',
      education: 'Eğitim',
      other: 'Diğer',
      
      // Asset Types
      savings: 'Tasarruf',
      investment: 'Yatırım',
      realEstate: 'Gayrimenkul',
      crypto: 'Kripto Para',
      
      // Table Headers
      actions: 'İşlemler',
      progress: 'İlerleme',
      
      // Messages
      noData: 'Veri bulunamadı',
      loading: 'Yükleniyor...',
      error: 'Bir hata oluştu',
      success: 'İşlem başarıyla tamamlandı',
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