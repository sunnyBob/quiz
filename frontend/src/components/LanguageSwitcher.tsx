import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language || 'zh-CN';

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'zh-CN' ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app-language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors text-xs sm:text-sm font-medium text-gray-700"
      title="Switch Language / 切换语言"
    >
      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span className="hidden xs:inline sm:inline">{currentLanguage === 'zh-CN' ? '中' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
