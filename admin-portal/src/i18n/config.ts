import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        buses: 'Routes & Buses',
        users: 'Users',
        chat: 'Chat',
        logs: 'Logs',
      },
      auth: {
        login: 'Admin Login',
        email: 'Email',
        password: 'Password',
        submit: 'Sign In',
        error: 'Invalid credentials.',
      },
      dashboard: {
        title: 'Live Tracking',
        activeBuses: 'Active Buses',
        offlineBuses: 'Offline Buses',
      },
    },
  },
  ta: {
    translation: {
      nav: {
        dashboard: 'முகப்பு',
        buses: 'பேருந்துகள்',
        users: 'பயனர்கள்',
        chat: 'அரட்டை',
        logs: 'பதிவுகள்',
      },
      auth: {
        login: 'நிர்வாகி உள்நுழைவு',
        email: 'மின்னஞ்சல்',
        password: 'கடவுச்சொல்',
        submit: 'உள்நுழைக',
        error: 'தவறான நற்சான்றிதழ்கள்.',
      },
      dashboard: {
        title: 'நேரடி கண்காணிப்பு',
        activeBuses: 'செயலில் உள்ள பேருந்துகள்',
        offlineBuses: 'இணைப்பற்ற பேருந்துகள்',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
