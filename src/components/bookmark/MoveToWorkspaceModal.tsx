import { Modal, Button, RadioGroup, Radio } from '@heroui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v7 as UUIDv7 } from 'uuid';

import { saveShadow } from '@/db/shadows';
import { useAppStore } from '@/store/useAppStore';

interface MoveToWorkspaceModalProps {
  bookmark: any;
  title: string;
  currentWorkspaceId: string;
  onClose: () => void;
  onComplete?: () => void;
  moveType: string;
}

function MoveToWorkspaceModal({
  bookmark,
  title,
  currentWorkspaceId,
  onClose,
  onComplete,
  moveType,
}: MoveToWorkspaceModalProps) {
  const { t } = useTranslation();
  const { workspaces, parseWorkspaceTitle } = useAppStore();
  const [selectedWorkspace, setSelectedWorkspace] = useState('');

  const availableWorkspaces = workspaces.filter((ws: any) => ws.id !== currentWorkspaceId);

  const handleMove = async () => {
    if (!selectedWorkspace || !bookmark?.id) return;
    try {
      if (moveType === 'moveBookmark') {
        await chrome.bookmarks.move(bookmark.id, { parentId: selectedWorkspace });
      } else if (moveType === 'shadowBookmark') {
        await saveShadow(UUIDv7(), {
          ...bookmark,
          shadowing: bookmark.id,
          parentId: selectedWorkspace,
        });
      }
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
              <span className='text-base font-semibold'>{title}</span>
            </Modal.Header>

            <Modal.Body className='space-y-4 px-6'>
              {availableWorkspaces.length === 0 ? (
                <div className='py-4 text-center text-sm text-gray-950'>{t('noOtherWorkspace')}</div>
              ) : (
                <RadioGroup
                  onChange={(key: string) => setSelectedWorkspace(key)}
                  className='max-h-60 space-y-0.5 overflow-y-auto'>
                  {availableWorkspaces.map((ws: any) => {
                    const { emoji, text } = parseWorkspaceTitle(ws.title);
                    return (
                      <Radio
                        key={ws.id}
                        value={ws.id}
                        className='rounded-md px-3 py-3 transition-colors hover:bg-gray-100 data-[selected=true]:bg-sky-200'>
                        <div className='flex items-center gap-2'>
                          {emoji && <span>{emoji}</span>}
                          <span className='text-sm'>{text || ws.title}</span>
                          <span className='text-xs text-gray-400'>({ws.children?.length || 0})</span>
                        </div>
                      </Radio>
                    );
                  })}
                </RadioGroup>
              )}
              <p>
                {t('selectTargetWorkspace')} <span className='inline-block w-3'></span>
                {selectedWorkspace ? workspaces.find((ws: any) => ws.id === selectedWorkspace)?.title : ''}
              </p>
            </Modal.Body>

            <Modal.Footer className='gap-2 px-6 pb-6'>
              <Button
                variant='outline'
                onPress={onClose}>
                {t('cancel')}
              </Button>
              <Button
                variant='primary'
                onPress={handleMove}
                isDisabled={!selectedWorkspace}>
                {moveType === 'moveBookmark' && t('move')}
                {moveType === 'shadowBookmark' && t('create')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default MoveToWorkspaceModal;
