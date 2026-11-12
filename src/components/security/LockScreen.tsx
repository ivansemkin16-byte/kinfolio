import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { lockService } from '../../services/lockService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { APPLE_SPRINGS, SpringDriver, createSpringDriver } from '../../motion/spring';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { triggerHaptic } from '../../motion/haptics';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const shakeDriverRef = useRef<SpringDriver | null>(null);

  useEffect(() => {
    const driver = createSpringDriver(0, APPLE_SPRINGS.momentum, (x) => {
      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      }
    });
    shakeDriverRef.current = driver;
    return () => {
      driver.stop();
      shakeDriverRef.current = null;
    };
  }, []);

  const triggerWrongShake = () => {
    triggerHaptic('warning');
    if (reducedMotion || !shakeDriverRef.current) return;
    shakeDriverRef.current.setValueImmediate(0);
    shakeDriverRef.current.setTarget(0, {
      velocity: 580,
      config: { damping: 0.38, response: 0.24, precision: 0.2, velocityPrecision: 1 },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || isVerifying) return;

    try {
      setIsVerifying(true);
      const valid = await lockService.verifyPasscode(passcode);
      if (valid) {
        triggerHaptic('success');
        setPasscode('');
        setError('');
        onUnlock();
      } else {
        setError(t('lockScreen.wrongPasscode'));
        setPasscode('');
        triggerWrongShake();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-screen-title"
      className="fixed inset-0 z-[60] bg-cover-leather/95 backdrop-blur-md flex items-center justify-center p-5"
    >
      {/* Closed Notebook Paper Clasp Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm paper-grid border-2 border-border-strong rounded-[6px] p-6 sm:p-7 pt-8 shadow-modal space-y-5 will-change-transform"
      >
        <div
          aria-hidden="true"
          className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-[1px]"
        />

        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-surface-kraft border border-border-strong flex items-center justify-center text-primary shadow-soft">
            <Lock className="w-5 h-5" />
          </div>
          <h1 id="lock-screen-title" className="type-title text-primary">
            {t('lockScreen.title')}
          </h1>
          <p className="type-hand text-[19px] text-secondary leading-[1.25]">
            {t('lockScreen.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              if (error) setError('');
            }}
            placeholder={t('lockScreen.placeholder')}
            aria-label={t('lockScreen.placeholder')}
            error={error}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!passcode.trim() || isVerifying}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {t('lockScreen.unlockBtn')}
          </Button>
        </form>
      </div>
    </div>
  );
};
