import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, RadioGroup, Radio } from '@nextui-org/react'
import { Folder } from 'lucide-react'

function MoveBookmarkModal({ bookmark, currentWorkspaceId, onClose, onComplete }) {
  const { t } = useTranslation()
  const { workspaces, parseWorkspaceTitle } = useAppStore()
  const [selectedWorkspace, setSelectedWorkspace] = useState('')

  // Filter out current workspace
  const availableWorkspaces = workspaces.filter(ws => ws.id !== currentWorkspaceId)

  const handleMove = async () => {
    if (!selectedWorkspace || !bookmark?.id) return
    try {
      await chrome.bookmarks.move(bookmark.id, { parentId: selectedWorkspace })
      onComplete?.()
      onClose()
    } catch (error) {
      console.error('Failed to move bookmark:', error)
      alert(t('moveFailed') || '移动失败')
    }
  }

  return (
    <Modal isOpen onClose={onClose} size="sm" placement="center" className="dark:bg-content1">
      <ModalContent>
        <ModalHeader className="text-base font-semibold flex items-center gap-2">
          <Folder size={18} />
          {t('moveTo') || '移动到...'}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500 mb-3">
            {t('selectTargetWorkspace') || '选择目标工作区'}
          </p>
          {availableWorkspaces.length === 0 ? (
            <div className="text-sm text-default-400 text-center py-4">
              {t('noOtherWorkspace') || '没有其他工作区'}
            </div>
          ) : (
            <RadioGroup value={selectedWorkspace} onValueChange={setSelectedWorkspace} className="max-h-60 overflow-y-auto">
              {availableWorkspaces.map((ws) => {
                const { emoji, text } = parseWorkspaceTitle(ws.title)
                return (
                  <Radio key={ws.id} value={ws.id}>
                    <div className="flex items-center gap-2">
                      {emoji && <span>{emoji}</span>}
                      <span className="text-sm">{text || ws.title}</span>
                      <span className="text-xs text-default-400">
                        ({ws.children?.length || 0})
                      </span>
                    </div>
                  </Radio>
                )
              })}
            </RadioGroup>
          )}
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="light" onPress={onClose}>
            {t('cancel')}
          </Button>
          <Button color="primary" onPress={handleMove} isDisabled={!selectedWorkspace}>
            {t('move') || '移动'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default MoveBookmarkModal
