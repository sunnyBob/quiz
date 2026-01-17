import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          // English translations will go here
          welcome: 'Welcome to Quiz System',
        },
      },
      zh: {
        translation: {
          // Chinese translations will go here
          welcome: '欢迎来到考试系统',
        },
      },
    },
  });

export default i18n;

