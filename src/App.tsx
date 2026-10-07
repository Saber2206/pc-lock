import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bluetooth,
  BluetoothConnected,
  Lock,
  Unlock,
  Laptop,
  Languages,
  Loader2,
  PowerOff,
  FlaskConical,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BleClient, numbersToDataView } from '@capacitor-community/bluetooth-le';

// ==========================================================
// إعدادات البلوتوث — يجب أن تطابق برنامج الكمبيوتر (المرحلة 2)
// ==========================================================
const SERVICE_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CHAR_UUID    = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const PC_NAME      = 'PC-Lock';

// الأوامر المتفق عليها مع الكمبيوتر
const CMD_LOCK   = 0x01; // قفل
const CMD_UNLOCK = 0x02; // فتح

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Mode = 'demo' | 'ble';

export default function App() {
  const { t, i18n } = useTranslation();

  const [mode, setMode] = useState<Mode | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deviceIdRef = useRef<string | null>(null);

  // اتجاه الصفحة RTL / LTR
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  // تهيئة البلوتوث مرة واحدة
  useEffect(() => {
    BleClient.initialize({ androidNeverForLocation: true }).catch(() => {});
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  // ============ الاتصال الحقيقي بالبلوتوث ============
  const handleConnectBle = async () => {
    if (isConnecting) return;
    setMode('ble');
    setIsConnecting(true);
    setError(null);
    try {
      // تفتح نافذة أندرويد لاختيار جهاز PC-Lock
   const device = await BleClient.requestDevice({ services: [SERVICE_UUID] });
      deviceIdRef.current = device.deviceId;

      await BleClient.connect(device.deviceId, () => {
        // انقطاع مفاجئ (الكمبيوتر طُفئ مثلًا)
        setIsConnected(false);
        setIsLocked(true);
        setDeviceName(null);
        setMode(null);
        deviceIdRef.current = null;
      });

      setDeviceName(device.name ?? PC_NAME);
      setIsConnected(true);
    } catch {
      setMode(null);
      setError(t('error'));
    } finally {
      setIsConnecting(false);
    }
  };

  // ============ وضع تجريبي بدون كمبيوتر (مؤقت) ============
  const handleConnectDemo = () => {
    if (isConnecting) return;
    setMode('demo');
    setIsConnecting(true);
    setError(null);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setDeviceName('Demo PC');
    }, 1500);
  };

  const handleDisconnect = async () => {
    if (mode === 'ble' && deviceIdRef.current) {
      try { await BleClient.disconnect(deviceIdRef.current); } catch { /* تجاهل */ }
      deviceIdRef.current = null;
    }
    setIsConnected(false);
    setDeviceName(null);
    setIsLocked(true);
    setMode(null);
  };

  // ============ إرسال أوامر القفل / الفتح ============
  const sendCommand = async (cmd: number) => {
    if (mode === 'demo') {
      setIsLocked(cmd === CMD_LOCK);
      return;
    }
    const id = deviceIdRef.current;
    if (!id) return;
    try {
      await BleClient.write(id, SERVICE_UUID, CHAR_UUID, numbersToDataView([cmd]));
      setIsLocked(cmd === CMD_LOCK);
    } catch {
      setError(t('error'));
    }
  };

  const toggleLock = () => {
    if (!isConnected) return;
    setError(null);
    sendCommand(isLocked ? CMD_UNLOCK : CMD_LOCK);
  };

  return (
    <div className={cn(
      'min-h-screen bg-slate-950 text-slate-50 flex justify-center overflow-hidden font-sans',
      dir === 'rtl' ? 'font-arabic' : ''
    )}>
      <div className="w-full max-w-md bg-slate-900 relative shadow-2xl flex flex-col h-[100dvh]">

        {/* ===================== الهيدر ===================== */}
        <header className="px-6 py-5 flex items-center justify-between bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Laptop size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{t('app_title')}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-emerald-500' : 'bg-rose-500')}></span>
                {isConnected ? t('status_connected') : t('status_disconnected')}
              </div>
            </div>
          </div>

          <button
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 active:scale-95 transition-transform hover:bg-slate-700"
            aria-label={t('language')}
          >
            <Languages size={18} />
          </button>
        </header>

        {/* ===================== المحتوى ===================== */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative">

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-colors duration-1000',
              isConnected ? (isLocked ? 'bg-blue-600' : 'bg-emerald-600') : 'bg-slate-700'
            )} />
          </div>

          <AnimatePresence mode="wait">
            {!isConnected ? (
              /* ============ شاشة عدم الاتصال ============ */
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center w-full z-10"
              >
                <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-8 relative">
                  {isConnecting && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="absolute inset-[-4px] rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent"
                    />
                  )}
                  <Bluetooth size={48} className={isConnecting ? 'text-blue-400' : 'text-slate-400'} />
                </div>

                <h2 className="text-2xl font-bold mb-2 text-center">{t('bluetooth_required')}</h2>
                <p className="text-slate-400 text-center mb-10 max-w-[280px]">
                  {t('connect_bluetooth')}
                </p>

                {/* زر البلوتوث الحقيقي */}
                <button
                  onClick={handleConnectBle}
                  disabled={isConnecting}
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-semibold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
                >
                  {isConnecting && mode === 'ble' ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      {t('searching')}
                    </>
                  ) : (
                    <>
                      <Bluetooth size={24} />
                      {t('connect_bluetooth')}
                    </>
                  )}
                </button>

                {/* زر الوضع التجريبي */}
                <button
                  onClick={handleConnectDemo}
                  disabled={isConnecting}
                  className="mt-4 w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 border border-slate-700"
                >
                  {isConnecting && mode === 'demo' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('searching')}
                    </>
                  ) : (
                    <>
                      <FlaskConical size={18} />
                      {t('demo')}
                    </>
                  )}
                </button>

                {error && <p className="text-rose-400 text-sm mt-4 text-center">{error}</p>}
              </motion.div>
            ) : (
              /* ============ شاشة القفل / الفتح ============ */
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center w-full z-10"
              >
                <div className="mb-12 flex flex-col items-center">
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-4 flex items-center gap-2 border border-emerald-500/20">
                    <BluetoothConnected size={16} />
                    {deviceName}
                  </div>
                  <h2 className="text-3xl font-bold">
                    {isLocked ? t('pc_locked') : t('pc_unlocked')}
                  </h2>
                  <p className="text-slate-400 mt-2">
                    {isLocked ? t('tap_to_unlock') : t('tap_to_lock')}
                  </p>
                </div>

                {/* زر القفل الكبير */}
                <button
                  onClick={toggleLock}
                  aria-label={isLocked ? t('tap_to_unlock') : t('tap_to_lock')}
                  className={cn(
                    'relative group w-48 h-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300',
                    isLocked
                      ? 'bg-gradient-to-b from-blue-500 to-blue-700 shadow-blue-600/30 active:shadow-inner'
                      : 'bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-emerald-600/30 active:shadow-inner'
                  )}
                >
                  <div className={cn(
                    'absolute inset-0 rounded-full border-2 opacity-50',
                    isLocked ? 'border-blue-400' : 'border-emerald-400'
                  )} />
                  <div className={cn(
                    'absolute inset-[-15px] rounded-full border border-dashed opacity-20 animate-[spin_10s_linear_infinite]',
                    isLocked ? 'border-blue-300' : 'border-emerald-300'
                  )} />

                  <motion.div
                    animate={{ scale: [0.9, 1.1, 1] }}
                    key={isLocked ? 'locked' : 'unlocked'}
                    transition={{ duration: 0.3 }}
                  >
                    {isLocked ? (
                      <Lock size={64} className="text-white drop-shadow-md" />
                    ) : (
                      <Unlock size={64} className="text-white drop-shadow-md" />
                    )}
                  </motion.div>
                </button>

                {error && <p className="text-rose-400 text-sm mt-6 text-center">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ===================== زر قطع الاتصال ===================== */}
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="p-6 bg-slate-900 border-t border-slate-800 z-10"
            >
              <button
                onClick={handleDisconnect}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700 hover:border-rose-500/30"
              >
                <PowerOff size={18} />
                {t('disconnect')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
