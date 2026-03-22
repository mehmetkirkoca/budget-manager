import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { creditCardService, creditCardUtils } from '../services/creditCardService';

const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', DONE: 'done', ERROR: 'error' };

const StatementUploadModal = ({ cardId, onClose, onImported }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(STEPS.UPLOAD);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [importing, setImporting] = useState(false);

  // Manual fields for parse-error fallback
  const [manual, setManual] = useState({
    totalDebt: '', minPayment: '', statementDate: '', paymentDueDate: ''
  });

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') return;
    setUploading(true);
    try {
      const result = await creditCardService.uploadStatementPDF(cardId, file);
      setParsed(result);
      if (result.parseError) {
        setStep(STEPS.ERROR);
      } else {
        // Pre-select: normal harcamalar seçili, kredi/taksit deselected
        const txns = (result.transactions || []).map(txn => ({
          ...txn,
          selected: !txn.isCredit && !txn.isInstallment
        }));
        setTransactions(txns);
        setStep(STEPS.PREVIEW);
      }
    } catch (err) {
      setParsed({ parseError: true });
      setStep(STEPS.ERROR);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleImport = async () => {
    setImporting(true);
    try {
      const payload = step === STEPS.ERROR
        ? {
            totalDebt:      manual.totalDebt      ? parseFloat(manual.totalDebt)      : null,
            minPayment:     manual.minPayment     ? parseFloat(manual.minPayment)     : null,
            statementDate:  manual.statementDate  || null,
            paymentDueDate: manual.paymentDueDate || null,
          }
        : {
            totalDebt:               parsed.totalDebt,
            minPayment:              parsed.minPayment,
            statementDate:           parsed.statementDate,
            paymentDueDate:          parsed.paymentDueDate,
            totalLimit:              parsed.totalLimit,
            availableLimit:          parsed.availableLimit,
            transactions:            transactions,
            installmentTransactions: transactions.filter(t => t.isInstallment),
          };

      await creditCardService.importStatement(cardId, payload);
      setStep(STEPS.DONE);
    } catch (err) {
      alert(t('errorImportStatement'));
    } finally {
      setImporting(false);
    }
  };

  const handleDone = () => {
    onImported && onImported();
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* STEP: UPLOAD */}
      {step === STEPS.UPLOAD && (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 text-center cursor-pointer hover:border-indigo-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {uploading ? (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-3"></div>
              <p>{t('loading')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
              <FiUpload className="text-4xl mb-3" />
              <p className="font-medium">{t('selectPdfFile')}</p>
              <p className="text-sm mt-1">{t('dragOrClick')}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* STEP: PREVIEW */}
      {step === STEPS.PREVIEW && parsed && (
        <div className="space-y-4">
          {/* Kart özeti */}
          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('statementDebt')}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {parsed.totalDebt != null ? creditCardUtils.formatCurrency(parsed.totalDebt) : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('statementMinPayment')}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                {parsed.minPayment != null ? creditCardUtils.formatCurrency(parsed.minPayment) : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('statementDate')}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{parsed.statementDate || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('statementDueDate')}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{parsed.paymentDueDate || '-'}</p>
            </div>
          </div>

          {/* İşlem tablosu (read-only) */}
          {transactions.length > 0 && (
            <div className="overflow-x-auto max-h-64 overflow-y-auto border rounded-lg dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">{t('date')}</th>
                    <th className="px-3 py-2 text-left">{t('description')}</th>
                    <th className="px-3 py-2 text-right">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, idx) => (
                    <tr
                      key={idx}
                      className={`border-t dark:border-gray-700 ${
                        txn.isCredit ? 'opacity-40 line-through' :
                        txn.isInstallment ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{txn.date}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200 truncate max-w-xs" title={txn.description}>
                        {txn.description}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                        {creditCardUtils.formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('cancel')}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              {importing ? t('loading') : t('updateCard')}
            </button>
          </div>
        </div>
      )}

      {/* STEP: ERROR — manuel giriş */}
      {step === STEPS.ERROR && (
        <div className="space-y-4">
          <div className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <p className="text-sm">{t('parseError')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('statementDebt')}</label>
              <input
                type="number" value={manual.totalDebt}
                onChange={e => setManual(p => ({ ...p, totalDebt: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('statementMinPayment')}</label>
              <input
                type="number" value={manual.minPayment}
                onChange={e => setManual(p => ({ ...p, minPayment: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('statementDate')}</label>
              <input
                type="date" value={manual.statementDate}
                onChange={e => setManual(p => ({ ...p, statementDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('statementDueDate')}</label>
              <input
                type="date" value={manual.paymentDueDate}
                onChange={e => setManual(p => ({ ...p, paymentDueDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('cancel')}
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              {importing ? t('loading') : t('updateCard')}
            </button>
          </div>
        </div>
      )}

      {/* STEP: DONE */}
      {step === STEPS.DONE && (
        <div className="text-center py-6 space-y-3">
          <FiCheckCircle className="mx-auto text-5xl text-green-500" />
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {t('success')}
          </p>
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            {t('close')}
          </button>
        </div>
      )}
    </div>
  );
};

export default StatementUploadModal;
