import { Modal, Button, CloseButton, RadioGroup, Radio, Description } from '@heroui/react';
import { Folder, MoveRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/useAppStore';

function MoveBookmarkModal({ bookmark, currentWorkspaceId, onClose, onComplete }) {
  const { t } = useTranslation();
  const { workspaces, parseWorkspaceTitle } = useAppStore();
  const [selectedWorkspace, setSelectedWorkspace] = useState('');

  // Filter out current workspace
  const availableWorkspaces = workspaces.filter((ws) => ws.id !== currentWorkspaceId);

  const handleMove = async () => {
    if (!selectedWorkspace || !bookmark?.id) return;
    try {
      await chrome.bookmarks.move(bookmark.id, { parentId: selectedWorkspace });
      onComplete?.();
      onClose();
    } catch (error) {
      console.error('Failed to move bookmark:', error);
      alert(t('moveFailed'));
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        variant='transparent'
        isOpen={!!onClose}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose?.();
        }}>
        <Modal.Container
          size='md'
          placement='center'>
          <Modal.Dialog>
            <Modal.CloseTrigger onPress={onClose} />
            <Modal.Header className='flex items-center justify-between px-6 pt-6'>
              <span className='text-base font-semibold'>{t('moveToWorkspace')}</span>
            </Modal.Header>

            <Modal.Body className='space-y-4 px-6'>
              {availableWorkspaces.length === 0 ? (
                <div className='py-4 text-center text-sm text-mist-950'>{t('noOtherWorkspace')}</div>
              ) : (
                <RadioGroup
                  onChange={(key) => setSelectedWorkspace(key)}
                  className='max-h-60 space-y-0.5 overflow-y-auto'>
                  {availableWorkspaces.map((ws) => {
                    const { emoji, text } = parseWorkspaceTitle(ws.title);
                    return (
                      <Radio
                        key={ws.id}
                        value={ws.id}
                        className='rounded-md px-3 py-3 transition-colors hover:bg-mist-100 data-[selected=true]:bg-sky-200'>
                        <div className='flex items-center gap-2'>
                          {emoji && <span>{emoji}</span>}
                          <span className='text-sm'>{text || ws.title}</span>
                          <span className='text-xs text-mist-400'>({ws.children?.length || 0})</span>
                        </div>
                      </Radio>
                    );
                  })}
                </RadioGroup>
              )}
              <p>
                {t('selectTargetWorkspace')} <span className='inline-block w-3'></span>
                {selectedWorkspace ? workspaces.find((ws) => ws.id === selectedWorkspace)?.title : ''}
              </p>
            </Modal.Body>

            <Modal.Footer className='gap-2 px-6 pb-6'>
              <Button
                variant='outline'
                onPress={onClose}>
                {t('cancel')}
              </Button>
              <Button
                color='primary'
                onPress={handleMove}
                isDisabled={!selectedWorkspace}>
                {t('move')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default MoveBookmarkModal;
