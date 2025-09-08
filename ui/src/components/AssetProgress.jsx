
import { useTranslation } from 'react-i18next';

const AssetProgress = ({ assets }) => {
  const { t } = useTranslation();

  const calculateProgress = (currentAmount, targetAmount) => {
    if (targetAmount <= 0) return 0;
    return Math.min((currentAmount / targetAmount) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <h3 className="font-bold mb-4 text-lg">{t('assetTargets')}</h3>
      {assets.length > 0 ? (
        <div className="space-y-4">
          {assets.map((asset, index) => {
            const progress = calculateProgress(asset.currentAmount, asset.targetAmount);
            const progressColor = getProgressColor(progress);
            return (
              <div key={asset._id || index}>
                <div className="flex justify-between mb-1">
                  <span className="text-base font-medium text-gray-700 dark:text-white">{asset.name}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-white">
                    {asset.currentAmount.toLocaleString('tr-TR')} / {asset.targetAmount.toLocaleString('tr-TR')} {asset.unit || 'TRY'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div className={`${progressColor} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(progress)}% {t('completed')}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
        </div>
      )}
    </div>
  );
};

export default AssetProgress;
