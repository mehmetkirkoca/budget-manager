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
      netBalance: 'Net Balance',
      totalAssets: 'Total Assets',
      savingsRate: 'Savings Rate',
      recentTransactions: 'Recent Transactions',
      expenseCategories: 'Expense Categories',
      budgetOverview: 'Budget Overview',
      expenseDistribution: 'Expense Distribution',
      assetTargets: 'Asset Targets',
      
      // Pages
      expenseTransactions: 'Expense Transactions',
      assetManagement: 'Asset Management',
      
      // Forms
      addExpense: 'Add New Expense',
      editExpense: 'Edit Expense',
      addAsset: 'Add Asset',
      newExpense: 'New Expense',
      updateExpense: 'Update Expense',
      newAsset: 'New Asset',
      amount: 'Amount',
      category: 'Category',
      date: 'Date',
      description: 'Description',
      name: 'Name',
      type: 'Type',
      value: 'Value',
      targetAmount: 'Target Amount',
      currentAmount: 'Current Amount',
      assetType: 'Asset Type',
      currentValue: 'Current Value',
      targetValue: 'Target Value',
      status: 'Status',
      completed: 'Completed',
      pending: 'Pending',
      
      // Actions
      save: 'Save',
      update: 'Update',
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
      confirmDelete: 'Are you sure you want to delete this expense?',
      requiredFieldsError: 'Category, Amount and Date fields are required.',
      assetRequiredFieldsError: 'Type, Current Amount and Target Amount fields are required.',
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
      netBalance: 'Net Kalan',
      totalAssets: 'Toplam Varlık',
      savingsRate: 'Tasarruf Oranı',
      recentTransactions: 'Son İşlemler',
      expenseCategories: 'Gider Kategorileri',
      budgetOverview: 'Bütçe Özeti',
      expenseDistribution: 'Gider Dağılımı',
      assetTargets: 'Varlık Hedefleri',
      
      // Pages
      expenseTransactions: 'Gider İşlemleri',
      assetManagement: 'Varlık Yönetimi',
      
      // Forms
      addExpense: 'Yeni Gider Ekle',
      editExpense: 'Gider Düzenle',
      addAsset: 'Varlık Ekle',
      newExpense: 'Yeni Gider',
      updateExpense: 'Gider Güncelle',
      newAsset: 'Yeni Varlık',
      amount: 'Tutar',
      category: 'Kategori',
      date: 'Tarih',
      description: 'Açıklama',
      name: 'İsim',
      type: 'Tür',
      value: 'Değer',
      targetAmount: 'Hedef Tutar',
      currentAmount: 'Mevcut Tutar',
      assetType: 'Varlık Türü',
      currentValue: 'Mevcut Değer',
      targetValue: 'Hedef Değer',
      status: 'Durum',
      completed: 'Gerçekleşti',
      pending: 'Beklenen',
      
      // Actions
      save: 'Kaydet',
      update: 'Güncelle',
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
      confirmDelete: 'Bu gideri silmek istediğinizden emin misiniz?',
      requiredFieldsError: 'Kategori, Tutar ve Tarih alanları zorunludur.',
      assetRequiredFieldsError: 'Tür, Mevcut Tutar ve Hedef Tutar alanları zorunludur.',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Varsayılan dil İngilizce
    fallbackLng: 'en',
    debug: true,
    
    detection: {
      order: ['localStorage', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;