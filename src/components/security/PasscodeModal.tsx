import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useTranslation } from '../../i18n/LanguageContext';
import { lockService, validatePasscodeFormat } from '../../services/lockService';
import { useToast } from '../../hooks/useToast';
import { triggerHaptic } from '../../motion/haptics';

export type PasscodeModalMode = 'set' | 'change' | 'disable';

interface PasscodeModalProps {
  isOpen: boolean;
  mode: PasscodeModalMode;
  onClose: () => void;
  onUpdated: (hasPasscode: boolean) => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  mode,
  onClose,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPasscode('');
      setNewPasscode('');
      setConfirmPasscode('');
      setError('');
    }
  }, [isOpen, mode]);

  const title =
    mode === 'set'
      ? t('settings.passcodeModalSetTitle')
      : mode === 'change'
      ? t('settings.passcodeModalChangeTitle')
      : t('settings.passcodeModalDisableTitle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      if (mode === 'change' || mode === 'disable') {
        const ok = await lockService.verifyPasscode(currentPasscode);
        if (!ok) {
          setError(t('settings.passcodeWrongError'));
          triggerHaptic('warning');
          return;
        }
      }

      if (mode === 'disable') {
        await lockService.clearPasscode();
        triggerHaptic('selection');
        showToast(t('settings.passcodeDisabled'));
        onUpdated(false);
        onClose();
        return;
      }

      if (!validatePasscodeFormat(newPasscode)) {
        setError(t('settings.passcodeMinError'));
        triggerHaptic('warning');
        return;
      }

      if (newPasscode.trim() !== confirmPasscode.trim()) {
        setError(t('settings.passcodeMismatchError'));
        triggerHaptic('warning');
        return;
      }

      await lockService.setPasscode(newPasscode);
      triggerHaptic('success');
      showToast(t('settings.passcodeSaved'));
      onUpdated(true);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={t('settings.passcodeModalSubtitle')}
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="passcode-form"
            variant={mode === 'disable' ? 'danger' : 'primary'}
            disabled={isSaving}
          >
            {mode === 'disable' ? t('settings.passcodeDisableBtn') : t('common.save')}
          </Button>
        </div>
      }
    >
      <form id="passcode-form" onSubmit={handleSubmit} className="space-y-4">
        {(mode === 'change' || mode === 'disable') && (
          <Input
            type="password"
            label={t('settings.passcodeCurrentLabel')}
            value={currentPasscode}
            onChange={(e) => {
              setCurrentPasscode(e.target.value);
              if (error) setError('');
            }}
            autoFocus
          />
        )}

        {mode !== 'disable' && (
          <>
            <Input
              type="password"
              label={t('settings.passcodeNewLabel')}
              value={newPasscode}
              onChange={(e) => {
                setNewPasscode(e.target.value);
                if (error) setError('');
              }}
              autoFocus={mode === 'set'}
            />
            <Input
              type="password"
              label={t('settings.passcodeConfirmLabel')}
              value={confirmPasscode}
              onChange={(e) => {
                setConfirmPasscode(e.target.value);
                if (error) setError('');
              }}
            />
          </>
        )}

        {error && <p className="text-[12.5px] text-danger-text font-medium">{error}</p>}
      </form>
    </Modal>
  );
};
