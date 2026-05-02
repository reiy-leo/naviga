import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@nextui-org/react'

function EditBookmarkModal({ bookmark, parentBookmark, subBookmark, targetFolderId, onClose, onSave }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [isNew, setIsNew] = useState(true)
  const [mode, setMode] = useState('add') // 'add' | 'edit' | 'addSub' | 'editSub'
  
  useEffect(() => {
    if (subBookmark) {
      // 编辑子书签
      setTitle(subBookmark.title || '')
      setUrl(subBookmark.url || '')
      setIsNew(false)
      setMode('editSub')
    } else if (bookmark) {
      // 编辑现有书签
      setTitle(bookmark.title || '')
      setUrl(bookmark.url || '')
      setIsNew(false)
      setMode('edit')
    } else if (parentBookmark) {
      // 添加子书签
      setTitle('')
      setUrl('')
      setIsNew(true)
      setMode('addSub')
    } else {
      // 添加新书签
      setTitle('')
      setUrl('')
      setIsNew(true)
      setMode('add')
    }
  }, [bookmark, parentBookmark, subBookmark])
  
  const handleSave = async () => {
    // URL 校验
    if (!url.trim()) return
    // 简单 URL 格式化
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    try {
      if (mode === 'editSub') {
        // 更新子书签
        const { updateSubBookmark } = useAppStore.getState()
        updateSubBookmark(parentBookmark?.id || subBookmark?.parentId, subBookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
      } else if (mode === 'addSub') {
        // 添加子书签到 store
        const { addSubBookmark } = useAppStore.getState()
        const parentSubs = useAppStore.getState().subBookmarks[parentBookmark.id] || []
        
        if (parentSubs.length >= 5) {
          alert(t('maxSubBookmarks'))
          return
        }
        
        addSubBookmark(parentBookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
      } else if (isNew) {
        // 创建新书签
        const parentId = targetFolderId || useAppStore.getState().currentWorkspace
        await chrome.bookmarks.create({
          parentId,
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
      } else {
        // 更新书签
        await chrome.bookmarks.update(bookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
      }
      
      onSave?.()
      onClose()
    } catch (error) {
      console.error('Failed to save bookmark:', error)
      alert(t('saveFailed') || '保存失败')
    }
  }
  
  const getTitle = () => {
    switch (mode) {
      case 'editSub': return t('editSubBookmark')
      case 'addSub': return t('addSubBookmark')
      case 'edit': return t('editBookmark')
      default: return t('addBookmark')
    }
  }

  const canSave = url.trim().length > 0
  
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      placement="center"
      className="dark:bg-content1"
    >
      <ModalContent>
        <ModalHeader className="text-base font-semibold">
          {getTitle()}
        </ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label={t('name')}
            placeholder={t('name')}
            value={title}
            onValueChange={setTitle}
            variant="bordered"
            autoFocus
          />
          <Input
            label="URL"
            placeholder="https://..."
            value={url}
            onValueChange={setUrl}
            variant="bordered"
            type="url"
          />
        </ModalBody>
        <ModalFooter className="gap-2">
          <Button variant="light" onPress={onClose}>
            {t('cancel')}
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!canSave}
          >
            {t('save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditBookmarkModal
