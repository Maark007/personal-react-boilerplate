import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import XHR from 'i18next-xhr-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import Backend from 'i18next-chained-backend';
import BackendAdapter from 'i18next-multiload-backend-adapter';

i18n
  .use(Backend)
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed with react
    },
    load: 'languageOnly',
    detection: {
      lookupLocalStorage: 'languagePreference', // key to store in
      caches: ['localStorage'], // where to cache
      order: ['localStorage', 'navigator'], // in which order to search for a language
    },
    backend: {
      backends: [
        LocalStorageBackend,
        new BackendAdapter(null, {
          backend: new XHR(null, {
            loadPath: '.netlify/functions/locales?lng={{lng}}&ns={{ns}}',
            allowMultiloading: true,
          }),
        }),
      ], // order defines lookup pattern
      backendOptions: [{ prefix: 'i18next_translation_' }, {}],
    },
    ns: [], // removes 'translation' default key from backend query,
  });
