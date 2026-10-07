import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      translation: {
        app_title: 'PC Lock',
        status_connected: 'Connecté',
        status_disconnected: 'Déconnecté',
        language: 'Langue',
        bluetooth_required: 'Connexion Bluetooth requise',
        connect_bluetooth: 'Se connecter au PC',
        searching: 'Recherche…',
        pc_locked: 'PC verrouillé',
        pc_unlocked: 'PC déverrouillé',
        tap_to_unlock: 'Appuyez pour déverrouiller',
        tap_to_lock: 'Appuyez pour verrouiller',
        disconnect: 'Déconnecter',
        error: 'Échec. Vérifiez que le PC est allumé puis réessayez.',
        demo: 'Mode démo (sans Bluetooth)',
      },
    },
    ar: {
      translation: {
        app_title: 'قفل الكمبيوتر',
        status_connected: 'متصل',
        status_disconnected: 'غير متصل',
        language: 'اللغة',
        bluetooth_required: 'يلزم الاتصال بالبلوتوث',
        connect_bluetooth: 'اتصال بالكمبيوتر',
        searching: 'جارٍ البحث…',
        pc_locked: 'الكمبيوتر مقفل',
        pc_unlocked: 'الكمبيوتر مفتوح',
        tap_to_unlock: 'اضغط للفتح',
        tap_to_lock: 'اضغط للقفل',
        disconnect: 'قطع الاتصال',
        error: 'فشل. تأكد أن الكمبيوتر يعمل ثم حاول مجددًا.',
        demo: 'وضع تجريبي (بدون بلوتوث)',
      },
    },
  },
  lng: localStorage.getItem('lang') || 'ar',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
