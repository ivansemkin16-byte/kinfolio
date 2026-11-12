import React, { useState, useEffect } from 'react';
import { Note } from '../../types/note';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { useTranslation } from '../../i18n/LanguageContext';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, category?: string) => void;
  initialNote?: Note | null;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialNote) {
      setContent(initialNote.content);
      setCategory(initialNote.category || '');
    } else {
      setContent('');
      setCategory('');
    }
    setError('');
  }, [initialNote, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError(t('notes.contentError'));
      return;
    }
    onSave(content.trim(), category.trim() || undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialNote ? t('notes.modalEditTitle') : t('notes.modalAddTitle')}
      subtitle={t('notes.modalSubtitle')}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="note-editor-form" variant="primary">
            {initialNote ? t('notes.updateNote') : t('notes.saveNote')}
          </Button>
        </div>
      }
    >
      <form id="note-editor-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('notes.categoryLabel')}
          placeholder={t('notes.categoryPlaceholder')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Textarea
          label={t('notes.contentLabel')}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('notes.contentPlaceholder')}
          rows={5}
          error={error}
          autoFocus
        />
      </form>
    </Modal>
  );
};
