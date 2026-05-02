import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store/useAppStore'

function ContextMenu({ x, y, bookmark, onClose }) {
  const { t } = useTranslation()
  const handleEdit = () => {
    // 触发编辑事件
    window.dispatchEvent(new CustomEvent('edit-bookmark', { detail: bookmark }))
    onClose()
  }
  
  const handleDelete = async () => {
    if (confirm(t('confirmDelete') || '确定要删除此书签吗？')) {
      try {
        await chrome.bookmarks.remove(bookmark.id)
      } catch (error) {
        console.error('Failed to delete bookmark:', error)
      }
    }
    onClose()
  }
  
  const handleAddSub = () => {
    // 触发添加子书签事件
    window.dispatchEvent(new CustomEvent('add-sub-bookmark', { detail: bookmark }))
    onClose()
  }
  
  // 点击其他地方关闭菜单
  useEffect(() => {
    const handleClick = () => onClose()
    setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 0)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])
  
  // 确保菜单不会超出视窗
  const adjustedX = x + 160 > window.innerWidth ? x - 160 : x
  const adjustedY = y + 120 > window.innerHeight ? y - 120 : y
  
  return (
    <div
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-item" onClick={handleEdit}>
        ✏️ 编辑
      </div>
      <div className="context-menu-item" onClick={handleAddSub}>
        ➕ 添加子书签
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item danger" onClick={handleDelete}>
        🗑️ 删除
      </div>
    </div>
  )
}

export default ContextMenu
