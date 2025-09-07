
export const summaryData = {
  monthlyIncome: 8500,
  monthlyExpenses: 6250.75,
  netBalance: 2249.25,
  totalAssets: 125430.50,
  goalRemaining: 74569.50,
};

export const expenseData = [
  { name: 'Kira', value: 2500, color: '#0088FE' },
  { name: 'Faturalar', value: 850, color: '#00C49F' },
  { name: 'Market', value: 1500, color: '#FFBB28' },
  { name: 'Ulaşım', value: 450, color: '#FF8042' },
  { name: 'Diğer', value: 950.75, color: '#8884d8' },
];

export const assetData = [
  { name: 'Acil Durum Fonu', current: 15000, target: 20000, color: 'bg-green-500' },
  { name: 'Yeni Araba', current: 25000, target: 80000, color: 'bg-blue-500' },
  { name: 'Tatil', current: 5000, target: 12000, color: 'bg-yellow-500' },
];

export const transactionData = [
    { id: 1, category: 'Market', description: 'Haftalık alışveriş', amount: 345.50, date: '2025-09-06', status: 'Gerçekleşti' },
    { id: 2, category: 'Faturalar', description: 'Elektrik Faturası', amount: 280.75, date: '2025-09-05', status: 'Gerçekleşti' },
    { id: 3, category: 'Kira', description: 'Eylül Kirası', amount: 2500.00, date: '2025-09-01', status: 'Gerçekleşti' },
    { id: 4, category: 'Ulaşım', description: 'Aylık Akbil', amount: 450.00, date: '2025-09-01', status: 'Gerçekleşti' },
    { id: 5, category: 'Beklenmedik', description: 'Dişçi', amount: 750.00, date: '2025-09-10', status: 'Beklenen' },
];
