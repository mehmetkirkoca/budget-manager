import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiCalendar,
  FiCopy,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiBarChart2,
  FiPieChart,
  FiPlus,
  FiSettings,
  FiTrash2,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from 'recharts';
import Modal from '../components/Modal';
import StatementAnalysisModal from '../components/StatementAnalysisModal';
import { getAllAssets } from '../services/assetService';
import { getAllIncomes } from '../services/incomeService';
import { getAllRecurringPayments } from '../services/recurringPaymentService';
import { creditCardInstallmentService, creditCardService, creditCardUtils } from '../services/creditCardService';
import {
  buildScenario,
  calculateFlatAverage,
  getDefaultScenarioSettings,
  summarizeLoan,
} from '../services/scenarioSimulator';

const fmt = value => creditCardUtils.formatCurrency(value || 0);
const numberValue = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (encodeURIComponent(JSON.stringify(value)) || "") + expires + "; path=/; SameSite=Lax";
};

const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

const makeTransaction = startMonth => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: '',
  amount: 0,
  direction: 'expense',
  month: startMonth,
  startMonth,
  endMonth: '',
  repeats: false,
  enabled: true,
});

const cashColor = value => {
  if (value < 0) return 'text-red-600 dark:text-red-400 font-semibold';
  if (value < 10000) return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-emerald-600 dark:text-emerald-400';
};

export default function Analysis() {
  const { t, i18n } = useTranslation();
  const [showStatementAnalysis, setShowStatementAnalysis] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showStartingCashDetails, setShowStartingCashDetails] = useState(false);
  const [columnDetailModal, setColumnDetailModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    assets: [],
    incomes: [],
    recurringPayments: [],
    creditCards: [],
    installments: [],
  });
  const [settings, setSettings] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    document.title = `${t('analysis')} - ${t('appTitle')}`;
  }, [t]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [assets, incomes, recurringPayments, creditCards, installmentResult] = await Promise.all([
          getAllAssets(),
          getAllIncomes(),
          getAllRecurringPayments(),
          creditCardService.getAllCreditCards(),
          creditCardInstallmentService.getAllInstallments({ status: 'active', limit: 500 }),
        ]);
        const installments = installmentResult.installments || installmentResult.data || installmentResult || [];
        const nextData = { assets, incomes, recurringPayments, creditCards, installments };
        setData(nextData);
        const savedSettings = getCookie('scenario_settings');
        setSettings(current => current || savedSettings || getDefaultScenarioSettings({ assets }));
      } catch (err) {
        console.error(err);
        setError(t('scenarioLoadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  useEffect(() => {
    if (settings) {
      setCookie('scenario_settings', settings, 30);
    }
  }, [settings]);

  const scenario = useMemo(() => {
    if (!settings) return null;
    console.log('[Analysis.jsx] buildScenario tetikleniyor. Güncel Settings:', settings);
    const res = buildScenario({ ...data, settings });
    console.log('[Analysis.jsx] buildScenario tamamlandı. Hesaplanan satırlar:', res?.rows);
    return res;
  }, [data, settings]);

  const loanSummary = useMemo(() => summarizeLoan(settings?.loan), [settings]);

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    year: 'numeric',
  }), [i18n.language]);

  const updateSettings = patch => {
    console.log('[Analysis.jsx] updateSettings çağrıldı. Patch:', patch);
    setSettings(current => ({ ...current, ...patch }));
  };

  const updateLoan = patch => {
    setSettings(current => ({ ...current, loan: { ...current.loan, ...patch } }));
  };

  const updateTransaction = (id, patch) => {
    setSettings(current => ({
      ...current,
      plannedTransactions: current.plannedTransactions.map(transaction =>
        transaction.id === id ? { ...transaction, ...patch } : transaction
      ),
    }));
  };

  const addTransaction = () => {
    setSettings(current => ({
      ...current,
      plannedTransactions: [...current.plannedTransactions, makeTransaction(current.startMonth)],
    }));
  };

  const removeTransaction = id => {
    setSettings(current => ({
      ...current,
      plannedTransactions: current.plannedTransactions.filter(transaction => transaction.id !== id),
    }));
  };

  const duplicateTransaction = (transaction) => {
    const newTx = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    setSettings(current => ({
      ...current,
      plannedTransactions: [...current.plannedTransactions, newTx],
    }));
  };

  const toggleLiquidAsset = id => {
    setSettings(current => {
      const selected = new Set(current.liquidAssetIds || []);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      return { ...current, liquidAssetIds: [...selected] };
    });
  };

  const flatAverages = useMemo(() => {
    if (!settings || !data?.recurringPayments) return {};
    const res = {};
    data.recurringPayments.forEach(payment => {
      res[payment._id] = calculateFlatAverage(payment, settings);
    });
    return res;
  }, [settings, data?.recurringPayments]);

  // Helper calculations for starting cash breakdown
  const liquidAssetsDetails = useMemo(() => {
    if (!data?.assets || !settings?.liquidAssetIds) return [];
    return data.assets.filter(asset => settings.liquidAssetIds.includes(asset._id));
  }, [data?.assets, settings?.liquidAssetIds]);

  const liquidAssetsSum = useMemo(() => {
    return liquidAssetsDetails.reduce((sum, asset) => sum + numberValue(asset.currentValueTRY || asset.currentAmount), 0);
  }, [liquidAssetsDetails]);

  const loanAmount = useMemo(() => {
    return settings?.loan && settings.loan.enabled !== false ? numberValue(settings.loan.amount) : 0;
  }, [settings?.loan]);

  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!scenario?.rows) return [];
    return scenario.rows.map(row => ({
      name: monthFormatter.format(row.date),
      cash: row.cash,
      net: row.net,
    }));
  }, [scenario?.rows, monthFormatter]);

  const summaryCards = scenario ? [
    { label: t('startingCash'), value: fmt(scenario.summary.initialCash), icon: FiDollarSign, color: 'text-sky-600' },
    { label: t('endingCash'), value: fmt(scenario.summary.endingCash), icon: FiTrendingUp, color: cashColor(scenario.summary.endingCash) },
    { label: t('lowestCash'), value: fmt(scenario.summary.minCash), icon: FiTrendingDown, color: cashColor(scenario.summary.minCash) },
    { label: t('financingNeed'), value: fmt(scenario.summary.financingNeed), icon: FiCreditCard, color: scenario.summary.financingNeed > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
  ] : [];

  if (loading || !settings) {
    return <div className="py-10 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('scenarioPlanner')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('scenarioPlannerSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowStatementAnalysis(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <FiPieChart className="h-4 w-4" />
            {t('statementAnalysis')}
          </button>
          <Link
            to="/credit-cards/payment"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <FiDollarSign className="h-4 w-4" />
            {t('paymentAndInstallments')}
          </Link>
          <Link
            to="/credit-cards/calendar"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <FiCalendar className="h-4 w-4" />
            {t('paymentCalendar')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(card => {
          const Icon = card.icon;
          const isStartingCash = card.label === t('startingCash');
          return (
            <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  {isStartingCash && (
                    <button
                      onClick={() => setShowStartingCashDetails(true)}
                      className="text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                      title="Hesaplama Detayları"
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className={`text-xl font-semibold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </section>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t('scenarioSettings')}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('startMonth')}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{settings.startMonth}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('horizonMonths')}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{settings.horizonMonths} {t('month')}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('creditCardStrategy')}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {settings.creditCardStrategy === 'minimum' ? `${t('payMinimum')} (%${(settings.minimumPaymentRate * 100).toFixed(0)})` :
                   settings.creditCardStrategy === 'full' ? t('payFullBalance') :
                   settings.creditCardStrategy === 'fixed' ? `${t('payFixedAmount')} (${fmt(settings.fixedCreditCardPayment)})` :
                   t('ignoreCreditCards')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('loanScenario')}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {settings.loan.enabled 
                    ? `${fmt(settings.loan.amount)} | ${settings.loan.termMonths} ${t('month')} | %${(settings.loan.monthlyRate * 100).toFixed(2)}`
                    : t('disabled')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('recurringPayments')}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {settings.recurringPaymentsMode === 'ignore' ? t('ignoreMode') :
                   settings.recurringPaymentsMode === 'dueMonth' ? t('dueMonthMode') :
                   t('monthlyEquivalentMode')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('plannedTransactions')}: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{settings.plannedTransactions.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {settings.loan.enabled && (
              <div className="flex items-center gap-4 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0 sm:border-r sm:pr-4 dark:border-gray-700">
                <div className="text-center text-xs">
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-semibold">{t('monthlyPayment')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mt-0.5">{fmt(loanSummary.monthlyPayment)}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-semibold">{t('totalPayment')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mt-0.5">{fmt(loanSummary.totalPayment)}</p>
                </div>
                <div className="text-center text-xs">
                  <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-semibold">{t('totalInterest')}</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mt-0.5">{fmt(loanSummary.totalInterest)}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-gray-650"
            >
              <FiSettings className="h-4 w-4" />
              {t('editParameters')}
            </button>
          </div>
        </div>
      </div>

      {/* Cash Flow Projection (Full Width) */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('cashFlowProjection')}</h2>
          <button
            onClick={() => setShowChartModal(true)}
            className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
            title="Grafik Görünümü"
          >
            <FiBarChart2 className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/60">
              <tr>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">#</th>
                <th className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">{t('month')}</th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('income')}</span>
                    <button
                      onClick={() => setColumnDetailModal('income')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('income')} Kalemleri`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('recurringPayments')}</span>
                    <button
                      onClick={() => setColumnDetailModal('recurring')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('recurringPayments')} Kalemleri`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('creditCards')}</span>
                    <button
                      onClick={() => setColumnDetailModal('creditCards')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('creditCards')} ve Taksit Kalemleri`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('planned')}</span>
                    <button
                      onClick={() => setColumnDetailModal('planned')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('planned')} İşlem Kalemleri`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('loan')}</span>
                    <button
                      onClick={() => setColumnDetailModal('loan')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('loan')} Senaryosu Detayları`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('net')}</span>
                    <button
                      onClick={() => setColumnDetailModal('net')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('net')} Hesaplama Mantığı`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>{t('cash')}</span>
                    <button
                      onClick={() => setColumnDetailModal('cash')}
                      className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
                      title={`${t('cash')} Rezervi Detayları`}
                    >
                      <FiEye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {scenario.rows.map((row, index) => (
                <tr key={row.key} className="border-t border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30">
                  <td className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500">{index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-gray-200">{monthFormatter.format(row.date)}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{fmt(row.income)}</td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right ${row.recurring > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {row.recurring > 0 ? fmt(-row.recurring) : fmt(0)}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right ${row.creditCard > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="block font-medium">{row.creditCard > 0 ? fmt(-row.creditCard) : fmt(0)}</span>
                    {row.creditCardStatement > 0 && (
                      <span className="block text-[10px] text-gray-400 dark:text-gray-500 font-normal">
                        {t('statement') || 'Ekstre'}: {fmt(row.creditCardStatement)}
                      </span>
                    )}
                    {row.creditCardInterest > 0 && (
                      <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Faiz: +{fmt(row.creditCardInterest)}
                      </span>
                    )}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right ${row.planned >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>{fmt(row.planned)}</td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right ${row.loanPayment > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {row.loanPayment > 0 ? fmt(-row.loanPayment) : fmt(0)}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right ${row.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{fmt(row.net)}</td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right ${cashColor(row.cash)}`}>{fmt(row.cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabbed Scenario Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={t('scenarioSettings')}
        size="full"
      >
        <div className="flex h-[75vh] md:h-[80vh] min-h-[500px] -mx-4 -my-4 overflow-hidden">
          {/* Left Tab Navigation */}
          <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              ⚙️ {t('scenarioAssumptions')}
            </button>
            <button
              onClick={() => setActiveTab('creditCards')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'creditCards'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              💳 {t('creditCardStrategy')}
            </button>
            <button
              onClick={() => setActiveTab('loan')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'loan'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              📈 {t('loanScenario')}
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recurring'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              🔄 {t('recurringPayments')}
            </button>
            <button
              onClick={() => setActiveTab('planned')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'planned'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              📝 {t('plannedTransactions')}
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="w-3/4 p-5 overflow-y-auto custom-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-3">
                  {t('scenarioAssumptions')}
                </h4>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('startMonth')}</span>
                  <input
                    type="month"
                    value={settings.startMonth}
                    onChange={event => updateSettings({ startMonth: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('horizonMonths')}</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.horizonMonths}
                    onChange={event => updateSettings({ horizonMonths: numberValue(event.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('startingCashMode')}</span>
                  <select
                    value={settings.initialCashMode}
                    onChange={event => updateSettings({ initialCashMode: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                  >
                    <option value="assets">{t('fromSelectedAssets')}</option>
                    <option value="manual">{t('manualAmount')}</option>
                  </select>
                </label>
                {settings.initialCashMode === 'manual' && (
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('startingCash')}</span>
                    <input
                      type="number"
                      min="0"
                      value={settings.initialCash}
                      onChange={event => updateSettings({ initialCash: numberValue(event.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </label>
                )}
                {settings.initialCashMode === 'assets' && (
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">{t('liquidAssets')}</span>
                    <div className="max-h-80 space-y-2 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50/50 dark:bg-gray-900/30">
                      {data.assets.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noAssets')}</p>
                      ) : data.assets.map(asset => (
                        <label key={asset._id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-gray-700 dark:text-gray-200">{asset.name}</span>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400">{asset.assetType || asset.type}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="whitespace-nowrap font-medium text-gray-500 dark:text-gray-400">{fmt(asset.currentValueTRY || asset.currentAmount)}</span>
                            <input
                              type="checkbox"
                              checked={settings.liquidAssetIds?.includes(asset._id)}
                              onChange={() => toggleLiquidAsset(asset._id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'creditCards' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-3">
                  {t('creditCardStrategy')}
                </h4>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('creditCardStrategy')}</span>
                  <select
                    value={settings.creditCardStrategy}
                    onChange={event => updateSettings({ creditCardStrategy: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="minimum">{t('payMinimum')}</option>
                    <option value="full">{t('payFullBalance')}</option>
                    <option value="fixed">{t('payFixedAmount')}</option>
                    <option value="none">{t('ignoreCreditCards')}</option>
                  </select>
                </label>
                {settings.creditCardStrategy === 'minimum' && (
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('minimumPaymentRate')} (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={settings.minimumPaymentRate !== undefined ? Number((settings.minimumPaymentRate * 100).toFixed(2)) : ''}
                      onChange={event => updateSettings({ minimumPaymentRate: numberValue(event.target.value) / 100 })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </label>
                )}
                {settings.creditCardStrategy === 'fixed' && (
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('fixedMonthlyPayment')}</span>
                    <input
                      type="number"
                      min="0"
                      value={settings.fixedCreditCardPayment}
                      onChange={event => updateSettings({ fixedCreditCardPayment: numberValue(event.target.value) })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </label>
                )}
              </div>
            )}

            {activeTab === 'loan' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-3">
                  {t('loanScenario')}
                </h4>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium text-gray-705 dark:text-gray-300">{t('enabled')}</span>
                  <input
                    type="checkbox"
                    checked={settings.loan.enabled}
                    onChange={event => updateLoan({ enabled: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                {settings.loan.enabled && (
                  <div className="space-y-3 pt-1">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('loanAmount')}</span>
                      <input
                        type="number"
                        min="0"
                        value={settings.loan.amount}
                        onChange={event => updateLoan({ amount: numberValue(event.target.value) })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('termMonths')}</span>
                      <input
                        type="number"
                        min="1"
                        value={settings.loan.termMonths}
                        onChange={event => updateLoan({ termMonths: numberValue(event.target.value) })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('monthlyRate')} (%)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.loan.monthlyRate !== undefined ? Number((settings.loan.monthlyRate * 100).toFixed(4)) : ''}
                        onChange={event => updateLoan({ monthlyRate: numberValue(event.target.value) / 100 })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t('startMonth')}</span>
                      <input
                        type="month"
                        value={settings.loan.startMonth}
                        onChange={event => updateLoan({ startMonth: event.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recurring' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-3">
                  {t('recurringPayments')}
                </h4>
                
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">
                    {t('recurringPaymentsMode')}
                  </span>
                  <select
                    value={settings.recurringPaymentsMode || 'monthlyEquivalent'}
                    onChange={event => updateSettings({ recurringPaymentsMode: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="monthlyEquivalent">{t('monthlyEquivalentMode')}</option>
                    <option value="dueMonth">{t('dueMonthMode')}</option>
                    <option value="ignore">{t('ignoreMode')}</option>
                  </select>
                </label>

                <div className="space-y-2 pt-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t('recurringPayments')} ({data.recurringPayments.filter(p => p.isActive !== false).length})
                  </span>
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50/50 dark:bg-gray-900/30 custom-scrollbar">
                    {data.recurringPayments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noPayments') || 'Kayıt bulunamadı'}</p>
                    ) : (
                      data.recurringPayments.map(payment => {
                        const amount = numberValue(payment.amountInfo?.effectiveAmount || payment.calculatedAmount || payment.amount);
                        const mode = settings.recurringPaymentsMode || 'monthlyEquivalent';
                        const simAmount = mode === 'ignore' ? 0 :
                                          mode === 'monthlyEquivalent' ? calculateFlatAverage(payment, settings) :
                                          amount;

                        return (
                          <div key={payment._id} className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-2.5 text-xs dark:border-gray-700 dark:bg-gray-800 ${payment.isActive === false ? 'opacity-50' : ''}`}>
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-gray-700 dark:text-gray-200">{payment.name}</span>
                              <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                                {t('frequency')}: {t(payment.frequency) || payment.frequency}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block font-semibold text-gray-700 dark:text-gray-200">
                                {fmt(amount)}
                              </span>
                              {mode !== 'ignore' && payment.frequency !== 'monthly' && payment.frequency !== 'weekly' && (
                                <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                                  {mode === 'monthlyEquivalent' 
                                    ? `~${fmt(simAmount)} / ${t('month') || 'ay'}`
                                    : `${t('totalAmount') || 'Toplam'}`}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'planned' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {t('plannedTransactions')}
                  </h4>
                  <button
                    onClick={addTransaction}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    {t('add')}
                  </button>
                </div>
                {settings.plannedTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">{t('noPlannedTransactions')}</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 border border-gray-150 dark:border-gray-700/50 rounded-lg p-2 bg-gray-50/30 dark:bg-gray-900/10 custom-scrollbar">
                    {settings.plannedTransactions.map(transaction => (
                      <div key={transaction.id} className="grid gap-2 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 p-2.5 dark:border-gray-700 grid-cols-[1fr_90px_90px_100px_76px] items-center">
                        <input
                          value={transaction.label}
                          onChange={event => updateTransaction(transaction.id, { label: event.target.value })}
                          placeholder={t('description')}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full"
                        />
                        <input
                          type="number"
                          min="0"
                          value={transaction.amount}
                          onChange={event => updateTransaction(transaction.id, { amount: numberValue(event.target.value) })}
                          placeholder={t('amount')}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full"
                        />
                        <select
                          value={transaction.direction}
                          onChange={event => updateTransaction(transaction.id, { direction: event.target.value })}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full text-center"
                        >
                          <option value="expense">{t('expense')}</option>
                          <option value="income">{t('income')}</option>
                        </select>
                        <input
                          type="month"
                          value={transaction.repeats ? transaction.startMonth : transaction.month}
                          onChange={event => updateTransaction(
                            transaction.id,
                            transaction.repeats ? { startMonth: event.target.value } : { month: event.target.value }
                          )}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 w-full text-center"
                        />
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => duplicateTransaction(transaction)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title={t('duplicate')}
                          >
                            <FiCopy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeTransaction(transaction.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={t('delete')}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 col-span-5 pl-1 select-none">
                          <input
                            type="checkbox"
                            checked={transaction.repeats}
                            onChange={event => updateTransaction(transaction.id, { repeats: event.target.checked })}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          {t('repeatMonthly')}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStatementAnalysis}
        onClose={() => setShowStatementAnalysis(false)}
        title={t('statementAnalysis')}
        size="xl"
      >
        <StatementAnalysisModal onClose={() => setShowStatementAnalysis(false)} />
      </Modal>

      {/* Column Content Items Detail Modal */}
      <Modal
        isOpen={Boolean(columnDetailModal)}
        onClose={() => setColumnDetailModal(null)}
        title={
          columnDetailModal === 'income' ? `${t('income')} Kalemleri` :
          columnDetailModal === 'recurring' ? `${t('recurringPayments')} Kalemleri` :
          columnDetailModal === 'creditCards' ? `${t('creditCards')} ve Taksit Kalemleri` :
          columnDetailModal === 'planned' ? `${t('planned')} İşlem Kalemleri` :
          columnDetailModal === 'loan' ? `${t('loan')} Senaryosu Detayları` :
          columnDetailModal === 'net' ? `${t('net')} Nakit Akışı Hesaplama Mantığı` :
          columnDetailModal === 'cash' ? `${t('cash')} Rezervi ve Likit Varlıklar` :
          'Kalem Detayları'
        }
        size={['creditCards', 'recurring', 'income'].includes(columnDetailModal) ? 'lg' : 'md'}
      >
        <div className="space-y-4 py-2 text-sm text-gray-600 dark:text-gray-300">
          {/* 1. GELİR KALEMLERİ */}
          {columnDetailModal === 'income' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Toplam Aktif Düzenli Gelir</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {fmt(data.incomes.filter(i => i.isActive !== false && i.isRecurring).reduce((sum, i) => {
                      const amt = numberValue(i.amount);
                      const monthly = i.frequency === 'weekly' ? amt * 4.33 : i.frequency === 'quarterly' ? amt / 3 : i.frequency === 'yearly' ? amt / 12 : amt;
                      return sum + monthly;
                    }, 0))}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <span>{data.incomes.filter(i => i.isActive !== false).length} Aktif Gelir Kalemi</span>
                </div>
              </div>

              {data.incomes.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">Kayıtlı gelir kalemi bulunamadı.</div>
              ) : (
                <div className="overflow-x-auto max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Gelir Kaynağı</th>
                        <th className="px-3 py-2">Tutar</th>
                        <th className="px-3 py-2">Frekans / Tür</th>
                        <th className="px-3 py-2 text-right">Aylık Eşdeğer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.incomes.filter(i => i.isActive !== false).map((income, idx) => {
                        const amt = numberValue(income.amount);
                        const monthly = income.isRecurring
                          ? (income.frequency === 'weekly' ? amt * 4.33 : income.frequency === 'quarterly' ? amt / 3 : income.frequency === 'yearly' ? amt / 12 : amt)
                          : amt;
                        return (
                          <tr key={income._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                              {income.title || income.description || income.name || 'Gelir'}
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-semibold">{fmt(income.amount)}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[11px]">
                                {income.isRecurring
                                  ? (income.frequency === 'monthly' ? 'Aylık' : income.frequency === 'weekly' ? 'Haftalık' : income.frequency === 'yearly' ? 'Yıllık' : 'Aylık')
                                  : 'Tek Seferlik'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmt(monthly)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. TEKRARLAYAN ÖDEMELER */}
          {columnDetailModal === 'recurring' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                <div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Toplam Tekrarlayan Gider</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-0.5">
                    {fmt(data.recurringPayments.filter(p => p.isActive !== false).reduce((sum, p) => {
                      if (settings.recurringPaymentsMode === 'ignore') return sum;
                      if (settings.recurringPaymentsMode === 'dueMonth') return sum + (p.amount || 0);
                      return sum + (flatAverages[p._id] !== undefined ? flatAverages[p._id] : (p.amount || 0));
                    }, 0))}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    Mod: {settings.recurringPaymentsMode === 'dueMonth' ? 'Gerçek Vade Ayı (Tam Tutar)' : settings.recurringPaymentsMode === 'ignore' ? 'Yoksay' : 'Aylık Eşdeğer (Düzleştirilmiş Ortalama)'}
                  </span>
                </div>
              </div>

              {data.recurringPayments.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">Kayıtlı tekrarlayan ödeme bulunamadı.</div>
              ) : (
                <div className="overflow-x-auto max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Ödeme Başlığı</th>
                        <th className="px-3 py-2">Kategori</th>
                        <th className="px-3 py-2">Tutar / Frekans</th>
                        <th className="px-3 py-2 text-right">Projeksiyon Değeri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.recurringPayments.filter(p => p.isActive !== false).map((payment, idx) => {
                        let projVal = 0;
                        if (settings.recurringPaymentsMode === 'ignore') {
                          projVal = 0;
                        } else if (settings.recurringPaymentsMode === 'dueMonth') {
                          projVal = payment.amount || 0;
                        } else {
                          projVal = flatAverages[payment._id] !== undefined ? flatAverages[payment._id] : (payment.amount || 0);
                        }

                        return (
                          <tr key={payment._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                              {payment.name || payment.title || 'Ödeme'}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{payment.category?.name || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                              {fmt(payment.amount)} <span className="text-[10px] text-gray-400">({payment.frequency || 'monthly'})</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-red-600 dark:text-red-400">
                              {fmt(projVal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. KREDİ KARTLARI VE TAKSİTLER */}
          {columnDetailModal === 'creditCards' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Uygulanan Kart Stratejisi</p>
                  <p className="text-base font-bold text-indigo-800 dark:text-indigo-200 mt-0.5">
                    {settings.creditCardStrategy === 'full' ? 'Ekstrenin / Borcun Tamamı' :
                     settings.creditCardStrategy === 'fixed' ? `Sabit Tutar (${fmt(settings.fixedCreditCardPayment)})` :
                     settings.creditCardStrategy === 'none' ? 'Ödeme Yapma' :
                     `Asgari Ödeme (%${((settings.minimumPaymentRate || 0.03) * 100).toFixed(0)})`}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-gray-400 block text-[11px]">Toplam Kart Borcu</span>
                    <strong className="text-gray-900 dark:text-gray-100 font-bold">{fmt(data.creditCards.reduce((s, c) => s + (c.currentBalance || 0), 0))}</strong>
                  </div>
                  <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-gray-400 block text-[11px]">Aylık Taksit Yükü</span>
                    <strong className="text-gray-900 dark:text-gray-100 font-bold">{fmt(data.installments.reduce((s, i) => s + (i.installmentAmount || 0), 0))}</strong>
                  </div>
                  <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-gray-400 block text-[11px]">Aylık Efektif Faiz</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">%{(Number(scenario?.summary?.effectiveCardRate || 0.051) * 100).toFixed(2)}</strong>
                  </div>
                  <div className="p-2 bg-white/70 dark:bg-gray-800/70 rounded border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-gray-400 block text-[11px]">İlk Ay Faiz Yükü</span>
                    <strong className="text-red-600 dark:text-red-400 font-bold">+{fmt(scenario?.summary?.firstMonthInterest || 0)}</strong>
                  </div>
                </div>
              </div>

              {settings.creditCardStrategy !== 'full' && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
                  <div>
                    <span className="font-semibold block">Faiz & Vergi Uygulaması (KKDF %15 + BSMV %5):</span>
                    <span>Asgari ödeme yapıldığında ödenmeyen kalan borca aylık faiz ve vergiler işletilerek sonraki aya devretmektedir.</span>
                  </div>
                  {scenario?.summary?.totalCardInterest > 0 && (
                    <div className="text-right whitespace-nowrap pl-4">
                      <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Toplam Projeksiyon Faiz Yükü</span>
                      <span className="font-bold text-red-600 dark:text-red-400 text-sm">+{fmt(scenario.summary.totalCardInterest)}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Kayıtlı Kredi Kartları</h4>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase">
                      <tr>
                        <th className="px-3 py-2">Banka / Kart Adı</th>
                        <th className="px-3 py-2">Hesap Kesim</th>
                        <th className="px-3 py-2">Son Ödeme</th>
                        <th className="px-3 py-2">Akdi Faiz (%)</th>
                        <th className="px-3 py-2 text-right">Güncel Borç</th>
                        <th className="px-3 py-2 text-right">Tahmini Faiz (Aylık)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.creditCards.map(card => {
                        const monthlyRate = Number(card.interestRate?.monthly) || 0.0425;
                        const minRate = Number(card.minimumPaymentRate) || Number(settings?.minimumPaymentRate) || 0.03;
                        const unpaid = Math.max(0, Number(card.currentBalance || 0) * (1 - minRate));
                        const estInterest = settings.creditCardStrategy !== 'full' ? unpaid * monthlyRate * 1.20 : 0;

                        return (
                          <tr key={card._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{card.bankName} - {card.name}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Ayın {card.statementDay}. günü</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Ayın {card.paymentDueDay}. günü</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                              %{(monthlyRate * 100).toFixed(2)} <span className="text-[10px] text-gray-400">(Efektif: %{(monthlyRate * 1.20 * 100).toFixed(2)})</span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800 dark:text-gray-200">{fmt(card.currentBalance)}</td>
                            <td className="px-3 py-2 text-right font-bold text-amber-600 dark:text-amber-400">
                              {estInterest > 0 ? `+${fmt(estInterest)}` : '₺0,00'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {data.installments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Aktif Taksit Kalemleri</h4>
                  <div className="overflow-x-auto max-h-[30vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Harcama Açıklaması</th>
                          <th className="px-3 py-2">Kart</th>
                          <th className="px-3 py-2">Aylık Taksit</th>
                          <th className="px-3 py-2">Kalan / Toplam</th>
                          <th className="px-3 py-2 text-right">Toplam Kalan Borç</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {data.installments.map(inst => (
                          <tr key={inst._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{inst.purchaseDescription || 'Taksitli Alışveriş'}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{inst.creditCard?.name || '-'}</td>
                            <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">{fmt(inst.installmentAmount)}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{inst.remainingInstallments} / {inst.totalInstallments || '-'}</td>
                            <td className="px-3 py-2 text-right font-bold text-purple-600 dark:text-purple-400">{fmt(inst.installmentAmount * inst.remainingInstallments)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. PLANLI İŞLEMLER */}
          {columnDetailModal === 'planned' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Planlı İşlem Kalemleri</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Senaryoda belirli aylara planladığınız ek gelirler (+) ve ek harcamalar/yatırımlar (-) burada listelenir.
                </p>
              </div>

              {settings.plannedTransactions?.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">Henüz eklenmiş planlı işlem bulunmuyor.</div>
              ) : (
                <div className="overflow-x-auto max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">İşlem Açıklaması</th>
                        <th className="px-3 py-2">Yön</th>
                        <th className="px-3 py-2">Tutar</th>
                        <th className="px-3 py-2">Dönem / Ay</th>
                        <th className="px-3 py-2">Tür</th>
                        <th className="px-3 py-2 text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {settings.plannedTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{tx.label || 'Planlı İşlem'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.direction === 'income' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                              {tx.direction === 'income' ? '+ Gelir' : '- Gider'}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-bold text-gray-800 dark:text-gray-200">{fmt(tx.amount)}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {tx.repeats ? `${tx.startMonth} - ${tx.endMonth || 'Sürekli'}` : tx.month}
                          </td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{tx.repeats ? 'Tekrarlayan' : 'Tek Seferlik'}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={`text-[11px] font-medium ${tx.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                              {tx.enabled ? 'Etkin' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. KREDİ SENARYOSU */}
          {columnDetailModal === 'loan' && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg border ${settings.loan?.enabled ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40' : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">Kredi Simülasyon Durumu</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${settings.loan?.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {settings.loan?.enabled ? 'Etkin' : 'Devre Dışı'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Kredi tutarı ilk ay başlangıç nakdine eklenir, ardından belirlenen vade boyunca her ay net nakit akışından taksit düşülür.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Kredi Tutarı</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{fmt(settings.loan?.amount)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Akdi Baz Faiz</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">%{(Number(settings.loan?.monthlyRate || 0) * 100).toFixed(2)}</p>
                  <span className="text-[10px] text-gray-400">Efektif (+%30 Vergi): %{(Number(settings.loan?.monthlyRate || 0) * 1.30 * 100).toFixed(3)}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Vade</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{settings.loan?.termMonths || 12} Ay</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Aylık Taksit (Vergiler Dahil)</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">{fmt(loanSummary.monthlyPayment)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Toplam Geri Ödeme</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{fmt(loanSummary.totalPayment)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Toplam Faiz & Vergi Yükü</p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">{fmt(loanSummary.totalInterest)}</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. NET NAKİT AKIŞI FORMÜLÜ */}
          {columnDetailModal === 'net' && (
            <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Aylık Net Nakit Akışı Formülü</p>
                <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Net = (Gelir + Planlı Gelir) - (Tekrarlayan + Kredi Kartı + Kredi Taksiti + Planlı Gider)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-emerald-600 font-bold text-sm">+</span>
                  <div>
                    <strong className="text-emerald-700 dark:text-emerald-300 block">Nakit Girişleri:</strong>
                    <span>Aylık düzenli gelirler ve o aya tanımlı planlı ek gelirler (prim, tahsilat vb.)</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <span className="text-red-600 font-bold text-sm">-</span>
                  <div>
                    <strong className="text-red-700 dark:text-red-300 block">Nakit Çıkışları:</strong>
                    <span>Tekrarlayan fatura/aidatlar, seçili stratejiye göre kredi kartı ödemeleri, varsa kredi aylık taksitleri ve o aya planlanan ek harcamalar</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. NAKİT REZERVİ VE LİKİT VARLIKLAR */}
          {columnDetailModal === 'cash' && (
            <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase mb-1">Kümülatif Nakit Hesaplama Mantığı</p>
                <p className="text-sm font-mono font-bold text-sky-800 dark:text-sky-200">
                  Ay Sonu Nakit = Başlangıç Nakdi + Kümülatif Net Akış
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-400 block">Başlangıç Nakdi</span>
                  <strong className="text-sm text-gray-900 dark:text-gray-100 font-bold">{fmt(scenario?.summary?.initialCash)}</strong>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-400 block">En Düşük Nakit</span>
                  <strong className={`text-sm font-bold ${cashColor(scenario?.summary?.minCash)}`}>{fmt(scenario?.summary?.minCash)}</strong>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-400 block">Finansman İhtiyacı</span>
                  <strong className={`text-sm font-bold ${scenario?.summary?.financingNeed > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {fmt(scenario?.summary?.financingNeed)}
                  </strong>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-400 block">Dönem Sonu Nakit</span>
                  <strong className={`text-sm font-bold ${cashColor(scenario?.summary?.endingCash)}`}>{fmt(scenario?.summary?.endingCash)}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setColumnDetailModal(null)}
              className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for starting cash calculation breakdown */}
      <Modal
        isOpen={showStartingCashDetails}
        onClose={() => setShowStartingCashDetails(false)}
        title="Başlangıç Nakdi Hesaplama Detayı"
        size="md"
      >
        <div className="space-y-4 py-2 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <span className="font-semibold block mb-1">Hesaplama Modu:</span>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-xs inline-block font-medium">
              {settings.initialCashMode === 'manual' ? 'Manuel Giriş' : 'Likit Varlıklar Toplamı'}
            </span>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <span className="font-semibold block mb-2">Hesaplama Kalemleri:</span>
            
            {settings.initialCashMode === 'manual' ? (
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800">
                <span>Manuel Girilen Tutar</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{fmt(settings.initialCash)}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {liquidAssetsDetails.length === 0 ? (
                  <div className="text-xs text-gray-400 py-1">Seçili likit varlık bulunmuyor.</div>
                ) : (
                  liquidAssetsDetails.map(asset => (
                    <div key={asset._id} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-850 text-xs">
                      <span>{asset.name}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(asset.currentValueTRY || asset.currentAmount)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center py-1.5 font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                  <span>Likit Varlıklar Toplamı</span>
                  <span>{fmt(liquidAssetsSum)}</span>
                </div>
              </div>
            )}

            {loanAmount > 0 && (
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Aktif Kredi Senaryosu (Giriş)</span>
                <span>+{fmt(loanAmount)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center text-base font-bold text-gray-900 dark:text-white">
            <span>Toplam Başlangıç Nakdi</span>
            <span className="text-indigo-600 dark:text-indigo-400">{fmt(scenario.summary.initialCash)}</span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowStartingCashDetails(false)}
              className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for cash projection chart */}
      <Modal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        title="Nakit Miktarı Projeksiyon Grafiği"
        size="xl"
      >
        <div className="space-y-4 py-2">
          <div className="h-[400px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <YAxis tickFormatter={val => `${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <ChartTooltip content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg text-xs">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</p>
                        <p className="text-indigo-600 dark:text-indigo-400">
                          {t('cash') || 'Nakit'}: <span className="font-bold">{fmt(payload[0].value)}</span>
                        </p>
                        {payload[1] && (
                          <p className={payload[1].value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {t('netFlow') || 'Net Akış'}: <span className="font-bold">{fmt(payload[1].value)}</span>
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="monotone" dataKey="cash" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
                <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowChartModal(false)}
              className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
