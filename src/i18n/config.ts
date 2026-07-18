import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';

// Get language from localStorage or browser default
const getLanguage = () => {
  const saved = localStorage.getItem('i18nLanguage');
  if (saved) return saved;
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'hi' ? 'hi' : 'en';
};

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nLanguage', lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'hi' ? 'ltr' : 'ltr';
});

export default i18n;
