
import { useTranslation } from 'react-i18next';

const AssetProgress = ({ assets }) => {
  const { t } = useTranslation();

  const calculateProgress = (current, target) => {
    if (target <= 0) return 0;
    return (current / target) * 100;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <h3 className="font-bold mb-4 text-lg">{t('assetTargets')}</h3>
      <div className="space-y-4">
        {assets.map((asset, index) => {
          const progress = calculateProgress(asset.current, asset.target);
          return (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-gray-700 dark:text-white">{asset.name}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-white">{asset.current.toLocaleString('tr-TR')} / {asset.target.toLocaleString('tr-TR')} TRY</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className={`${asset.color} h-2.5 rounded-full`} style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetProgress;
