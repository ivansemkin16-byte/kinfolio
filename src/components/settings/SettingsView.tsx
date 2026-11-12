import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  Download,
  Upload,
  Trash2,
  Info,
  Check,
  HardDrive,
  RefreshCw,
  Globe,
  Sun,
  Moon,
  Monitor,
  KeyRound,
} from 'lucide-react';
import { exportAllData, importDataFromFile, clearAllLocalData } from '../../services/backupService';
import { settingsRepository } from '../../db/repositories/settingsRepository';
import { ThemeMode } from '../../types/settings';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Select } from '../common/Select';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { SegmentedControl } from '../common/SegmentedControl';
import { PageHeader } from '../layout/PageHeader';
import { PasscodeModal, PasscodeModalMode } from '../security/PasscodeModal';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../i18n/LanguageContext';

interface SettingsViewProps {
  hasPasscode: boolean;
  onPasscodeChange: (hasPasscode: boolean) => void;
  onAutoLockChange: (minutes: number) => void;
  onLockNow: () => void;
  onDataReset: () => void;
  onLoadDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  hasPasscode,
  onPasscodeChange,
  onAutoLockChange,
  onLockNow,
  onDataReset,
  onLoadDemoData,
}) => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const [autoLockMinutes, setAutoLockMinutes] = useState('15');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isEraseConfirmOpen, setIsEraseConfirmOpen] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [passcodeModalMode, setPasscodeModalMode] = useState<PasscodeModalMode | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    settingsRepository.get('autoLockMinutes', 15).then((val) => {
      setAutoLockMinutes(val === 0 ? 'never' : String(val));
    });
  }, []);

  const handleAutoLockChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAutoLockMinutes(val);
    const numeric = val === 'never' ? 0 : parseInt(val, 10);
    await settingsRepository.set('autoLockMinutes', numeric);
    onAutoLockChange(numeric);
    showToast(t('toasts.autoLockUpdated'));
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    const label =
      mode === 'dark'
        ? t('settings.themeDark')
        : mode === 'light'
        ? t('settings.themeLight')
        : t('settings.themeSystem');
    showToast(t('toasts.themeUpdated', { theme: label }));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportAllData();
      setExportSuccess(true);
      showToast(t('toasts.backupDownloaded'));
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err: any) {
      showToast(err.message || t('toasts.exportFailed'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const res = await importDataFromFile(file);
      if (res.success) {
        showToast(t('toasts.backupImported', { count: res.count }));
        onDataReset();
      } else {
        showToast(res.error || t('toasts.importFailed'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || t('toasts.importError'), 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      setIsErasing(true);
      await clearAllLocalData();
      onPasscodeChange(false);
      showToast(t('toasts.localCleared'));
      setIsEraseConfirmOpen(false);
      onDataReset();
    } catch (err: any) {
      showToast(err.message || t('toasts.clearFailed'), 'error');
    } finally {
      setIsErasing(false);
    }
  };

  return (
    <div className="space-y-7 max-w-3xl pb-8">
      <PageHeader title={t('settings.heading')} subtitle={t('settings.subtitle')} />

      {/* 1. Appearance (Theme & Language) */}
      <section className="bg-surface border border-border-strong/65 rounded-[4px] p-4 sm:p-6 space-y-5 shadow-soft">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-surface-green flex items-center justify-center text-green-700 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="type-title text-primary">{t('settings.languageTitle')}</h2>
            <p className="text-[13.5px] text-secondary mt-0.5">{t('settings.languageDesc')}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border divide-y divide-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[14px] font-medium text-primary block">
                {t('settings.themeLabel')}
              </span>
              <p className="text-[13px] text-secondary mt-0.5">{t('settings.themeHint')}</p>
            </div>
            <SegmentedControl<ThemeMode>
              ariaLabel={t('settings.themeLabel')}
              roleMode="radiogroup"
              size="xs"
              value={themeMode}
              onChange={handleThemeChange}
              options={[
                {
                  value: 'system',
                  label: t('settings.themeSystem'),
                  icon: <Monitor className="w-3.5 h-3.5" />,
                },
                {
                  value: 'light',
                  label: t('settings.themeLight'),
                  icon: <Sun className="w-3.5 h-3.5" />,
                },
                {
                  value: 'dark',
                  label: t('settings.themeDark'),
                  icon: <Moon className="w-3.5 h-3.5" />,
                },
              ]}
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[14px] font-medium text-primary block">
                {t('settings.languageLabel')}
              </span>
              <p className="text-[13px] text-secondary mt-0.5">{t('settings.languageHint')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      {/* 2. Privacy & Security */}
      <section className="bg-surface border border-border-strong/65 rounded-[4px] p-4 sm:p-6 space-y-5 shadow-soft">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-surface-green flex items-center justify-center text-green-700 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="type-title text-primary">{t('settings.securityTitle')}</h2>
            <p className="text-[13.5px] text-secondary mt-0.5">{t('settings.securityDesc')}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border divide-y divide-border">
          <div className="pb-4 space-y-3.5">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <KeyRound className="w-4 h-4 text-secondary mt-1 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[14px] font-medium text-primary block">
                    {t('settings.passcodeTitle')}
                  </span>
                  <p className="text-[13px] text-secondary mt-0.5 leading-[1.45]">
                    {t('settings.passcodeDesc')}
                  </p>
                </div>
              </div>
              <Badge size="sm" variant={hasPasscode ? 'success' : 'default'} className="shrink-0">
                {hasPasscode ? t('settings.passcodeActive') : t('settings.passcodeUnset')}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pl-6">
              {!hasPasscode ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPasscodeModalMode('set')}
                  icon={<Lock className="w-3.5 h-3.5" />}
                >
                  {t('settings.passcodeSetBtn')}
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onLockNow}
                    icon={<Lock className="w-3.5 h-3.5" />}
                  >
                    {t('settings.lockNowBtn')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPasscodeModalMode('change')}
                  >
                    {t('settings.passcodeChangeBtn')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setPasscodeModalMode('disable')}
                  >
                    {t('settings.passcodeDisableBtn')}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="autolock-select" className="text-[14px] font-medium text-primary block">
                {t('settings.autoLockLabel')}
              </label>
              <p className="text-[13px] text-secondary mt-0.5">{t('settings.autoLockDesc')}</p>
            </div>
            <div className="sm:w-52 shrink-0">
              <Select
                compact
                id="autolock-select"
                value={autoLockMinutes}
                onChange={handleAutoLockChange}
              >
                <option value="5">{t('settings.min5')}</option>
                <option value="15">{t('settings.min15')}</option>
                <option value="30">{t('settings.min30')}</option>
                <option value="60">{t('settings.hour1')}</option>
                <option value="never">{t('settings.never')}</option>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Backup & Restore */}
      <section className="bg-surface border border-border-strong/65 rounded-[4px] p-4 sm:p-6 space-y-4 shadow-soft">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-surface-soft border border-border flex items-center justify-center text-primary shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="type-title text-primary">{t('settings.backupsTitle')}</h2>
            <p className="text-[13.5px] text-secondary mt-0.5">{t('settings.backupsDesc')}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row flex-wrap gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting}
            icon={
              exportSuccess ? (
                <Check className="w-4 h-4 text-green-700" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
          >
            {exportSuccess
              ? t('settings.downloadedBtn')
              : isExporting
              ? t('settings.exportingBtn')
              : t('settings.exportBtn')}
          </Button>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
              id="backup-file-input"
            />
            <Button
              size="md"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              icon={<Upload className="w-4 h-4" />}
            >
              {isImporting ? t('settings.importingBtn') : t('settings.importBtn')}
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Data Management */}
      <section className="bg-surface border border-border-strong/65 rounded-[4px] p-4 sm:p-6 space-y-4 shadow-soft">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-danger-bg border border-danger-border flex items-center justify-center text-danger-text shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="type-title text-primary">{t('settings.dangerTitle')}</h2>
            <p className="text-[13.5px] text-secondary mt-0.5 leading-[1.45]">
              {t('settings.dangerDesc')}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row flex-wrap gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={onLoadDemoData}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {t('settings.loadDemoBtn')}
          </Button>

          <Button
            size="md"
            variant="danger"
            onClick={() => setIsEraseConfirmOpen(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            {t('settings.eraseBtn')}
          </Button>
        </div>
      </section>

      {/* 5. Colophon / About */}
      <section className="p-5 sm:p-6 bg-surface-kraft/60 border border-dashed border-border-strong rounded-[4px] space-y-2.5">
        <div className="flex items-center gap-2 text-primary font-serif font-semibold text-[16px]">
          <Info className="w-4 h-4 text-green-700" />
          <span>{t('settings.aboutTitle')}</span>
        </div>
        <p className="type-hand text-[20px] text-secondary leading-[1.35]">{t('settings.aboutDesc')}</p>
        <div className="pt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
          <span>{t('settings.aboutFooter1')}</span>
          <span>•</span>
          <span>{t('settings.aboutFooter2')}</span>
          <span>•</span>
          <span>{t('settings.aboutFooter3')}</span>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isEraseConfirmOpen}
        onClose={() => setIsEraseConfirmOpen(false)}
        isLoading={isErasing}
        title={t('settings.eraseConfirmTitle')}
        description={t('settings.confirmErase')}
        confirmLabel={t('settings.eraseBtn')}
        onConfirm={handleConfirmClearAll}
      />

      {passcodeModalMode && (
        <PasscodeModal
          isOpen={!!passcodeModalMode}
          mode={passcodeModalMode}
          onClose={() => setPasscodeModalMode(null)}
          onUpdated={onPasscodeChange}
        />
      )}
    </div>
  );
};
