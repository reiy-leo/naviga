import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button, Switch } from '@nextui-org/react'
import { Link2, Check, X } from 'lucide-react'

function EditBookmarkModal({ bookmark, parentBookmark, subBookmark, targetFolderId, onClose, onSave }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [iconMode, setIconMode] = useState('auto') // 'auto' | 'manual'
  const [iconUrl, setIconUrl] = useState('')
  const [iconValid, setIconValid] = useState(null) // null | true | false
  const [iconPreview, setIconPreview] = useState(null)
  const [isNew, setIsNew] = useState(true)
  const [mode, setMode] = useState('add') // 'add' | 'edit' | 'addSub' | 'editSub'
  const [existingFaviconUrl, setExistingFaviconUrl] = useState(null)
  const iconInputRef = useRef(null)
  const previewImgRef = useRef(null)
  const iconDebounceRef = useRef(null)

  // 解析当前书签的 favicon（用于编辑时显示已有图标）
  const resolveExistingFavicon = useCallback(() => {
    let rawUrl = null
    if (mode === 'editSub' && subBookmark?.url) {
      try {
        const domain = new URL(subBookmark.url).origin
        rawUrl = useAppStore.getState().faviconCache?.[domain]?.favicon || null
      } catch { rawUrl = null }
    } else if (mode === 'edit' && bookmark?.url) {
      try {
        const domain = new URL(bookmark.url).origin
        rawUrl = useAppStore.getState().faviconCache?.[domain]?.favicon || null
      } catch { rawUrl = null }
    }
    setExistingFaviconUrl(rawUrl)
    if (!rawUrl) return
    // 如果是非 base64 的 URL，说明是手动填写的图标
    if (!rawUrl.startsWith('data:')) {
      setIconMode('manual')
      setIconUrl(rawUrl)
      setIconValid(true)
      setIconPreview(rawUrl)
    } else {
      setIconMode('auto')
      setIconUrl('')
      setIconValid(null)
      setIconPreview(null)
    }
  }, [mode, bookmark, subBookmark])

  useEffect(() => {
    if (subBookmark) {
      setTitle(subBookmark.title || '')
      setUrl(subBookmark.url || '')
      setIsNew(false)
      setMode('editSub')
      resolveExistingFavicon()
    } else if (bookmark) {
      setTitle(bookmark.title || '')
      setUrl(bookmark.url || '')
      setIsNew(false)
      setMode('edit')
      resolveExistingFavicon()
    } else if (parentBookmark) {
      setTitle('')
      setUrl('')
      setIsNew(true)
      setMode('addSub')
      setExistingFaviconUrl(null)
      setIconMode('auto')
      setIconUrl('')
      setIconValid(null)
      setIconPreview(null)
    } else {
      setTitle('')
      setUrl('')
      setIsNew(true)
      setMode('add')
      setExistingFaviconUrl(null)
      setIconMode('auto')
      setIconUrl('')
      setIconValid(null)
      setIconPreview(null)
    }
  }, [bookmark, parentBookmark, subBookmark, resolveExistingFavicon])

  // 验证手动填写的图标 URL，验证通过后 async 转成 base64
  const validateAndConvertIcon = useCallback(async (url) => {
    if (!url || !url.trim()) {
      setIconValid(null)
      setIconPreview(null)
      return
    }
    const trimmed = url.trim()
    // 快速格式检查
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setIconValid(false)
      setIconPreview(null)
      return
    }
    // 用 Image() 验证是否为有效图片
    const img = new Image()
    img.onload = async () => {
      setIconValid(true)
      // 验证通过，通过 background fetch 转 base64
      try {
        const dataUrl = await useAppStore.getState().fetchFaviconAsDataUrl(trimmed)
        if (dataUrl) {
          setIconPreview(dataUrl) // base64
        } else {
          setIconPreview(trimmed) // fallback 到原始 URL
        }
      } catch {
        setIconPreview(trimmed)
      }
    }
    img.onerror = () => {
      setIconValid(false)
      setIconPreview(null)
    }
    img.src = trimmed
  }, [])

  const handleIconUrlChange = (value) => {
    setIconUrl(value)
    // 防抖验证：清除之前的定时器
    if (iconDebounceRef.current) clearTimeout(iconDebounceRef.current)
    iconDebounceRef.current = setTimeout(() => validateAndConvertIcon(value), 500)
  }

  const handleSave = async () => {
    if (!url.trim()) return
    // 简单 URL 格式化
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    try {
      if (mode === 'editSub') {
        const { updateSubBookmark } = useAppStore.getState()
        updateSubBookmark(parentBookmark?.id || subBookmark?.parentId, subBookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
        // 处理图标：manual 模式用 base64 存入 IndexedDB
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin
            // iconPreview 已经是 base64 或 fallback URL
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview)
          } catch {}
        }
      } else if (mode === 'addSub') {
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
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview)
          } catch {}
        }
      } else if (isNew) {
        const parentId = targetFolderId || useAppStore.getState().currentWorkspace
        await chrome.bookmarks.create({
          parentId,
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview)
          } catch {}
        }
      } else {
        await chrome.bookmarks.update(bookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        })
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview)
          } catch {}
        }
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

          {/* 图标设置 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600">{t('icon') || '图标'}</span>
              <div className="flex items-center gap-2">
                <button
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    iconMode === 'auto'
                      ? 'bg-primary-500 text-white'
                      : 'bg-default-100 text-default-500 hover:bg-default-200'
                  }`}
                  onClick={() => { setIconMode('auto'); setIconUrl(''); setIconValid(null); setIconPreview(null) }}
                >
                  {t('auto') || '自动获取'}
                </button>
                <button
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    iconMode === 'manual'
                      ? 'bg-primary-500 text-white'
                      : 'bg-default-100 text-default-500 hover:bg-default-200'
                  }`}
                  onClick={() => setIconMode('manual')}
                >
                  {t('manual') || '手动填写'}
                </button>
              </div>
            </div>

            {/* 自动获取模式：显示当前图标预览 */}
            {iconMode === 'auto' && (
              <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                {existingFaviconUrl ? (
                  <img
                    src={existingFaviconUrl}
                    alt=""
                    className="w-8 h-8 object-contain rounded-md"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center rounded-md bg-default-100">
                    <Link2 size={16} className="text-default-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-default-600">{t('autoFetchHint') || '将自动从网站获取图标'}</div>
                  {existingFaviconUrl && (
                    <div className="text-[10px] text-default-400 truncate mt-0.5">{existingFaviconUrl}</div>
                  )}
                </div>
              </div>
            )}

            {/* 手动填写模式 */}
            {iconMode === 'manual' && (
              <div className="space-y-2">
                <Input
                  ref={iconInputRef}
                  label={t('iconUrl') || '图标地址'}
                  placeholder="https://example.com/icon.png"
                  value={iconUrl}
                  onValueChange={handleIconUrlChange}
                  variant="bordered"
                  size="sm"
                  color={iconValid === false ? 'danger' : iconValid === true ? 'success' : 'default'}
                  description={
                    iconValid === false
                      ? (t('invalidIconUrl') || '无效的图片地址')
                      : iconValid === true
                      ? (t('validIconUrl') || '有效的图片地址')
                      : ''
                  }
                />
                {/* 图标预览 */}
                {iconPreview && (
                  <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                    <img
                      src={iconPreview}
                      alt=""
                      className="w-8 h-8 object-contain rounded-md"
                      ref={previewImgRef}
                      onError={() => { setIconValid(false); setIconPreview(null) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-default-600">{t('preview') || '预览'}</div>
                      <div className="text-[10px] text-default-400 truncate mt-0.5">{iconUrl}</div>
                    </div>
                    <button
                      className="p-1 rounded-md hover:bg-danger-100 transition-colors"
                      onClick={() => { setIconUrl(''); setIconValid(null); setIconPreview(null) }}
                    >
                      <X size={12} className="text-danger-400" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
