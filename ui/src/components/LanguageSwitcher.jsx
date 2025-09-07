import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
        <FaGlobe className="w-4 h-4" />
        <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
      </button>
      <div className="absolute right-0 mt-2 w-24 bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="py-1">
          <button
            onClick={() => changeLanguage('en')}
            className="block w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage('tr')}
            className="block w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            TR
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;