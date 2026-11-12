import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslation } from '../../i18n/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title={title}
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="md"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel || t('common.delete')}
          </Button>
        </div>
      }
    >
      <p className="text-[14px] text-secondary leading-[1.55]">{description}</p>
    </Modal>
  );
};
