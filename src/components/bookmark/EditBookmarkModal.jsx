import { Modal, Button, Input, Separator, Label, Radio, RadioGroup, Description } from '@heroui/react';
import { Trash2, Link2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../../store/useAppStore';

function EditBookmarkModal({ bookmark, parentBookmark, subBookmark, targetFolderId, onClose, onSave }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconMode, setIconMode] = useState('auto');
  const [iconUrl, setIconUrl] = useState('');
  const [iconValid, setIconValid] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [isNew, setIsNew] = useState(true);
  const [mode, setMode] = useState('add');
  const [existingFaviconUrl, setExistingFaviconUrl] = useState(null);
  const previewImgRef = useRef(null);
  const iconDebounceRef = useRef(null);

  const resolveExistingFavicon = useCallback(() => {
    let rawUrl = null;
    if (mode === 'editSub' && subBookmark?.url) {
      try {
        const domain = new URL(subBookmark.url).origin;
        rawUrl = useAppStore.getState().faviconCache?.[domain]?.favicon || null;
      } catch {
        rawUrl = null;
      }
    } else if (mode === 'edit' && bookmark?.url) {
      try {
        const domain = new URL(bookmark.url).origin;
        rawUrl = useAppStore.getState().faviconCache?.[domain]?.favicon || null;
      } catch {
        rawUrl = null;
      }
    }
    setExistingFaviconUrl(rawUrl);
    if (!rawUrl) return;
    if (!rawUrl.startsWith('data:')) {
      setIconMode('manual');
      setIconUrl(rawUrl);
      setIconValid(true);
      setIconPreview(rawUrl);
    } else {
      setIconMode('auto');
      setIconUrl('');
      setIconValid(null);
      setIconPreview(null);
    }
  }, [mode, bookmark, subBookmark]);

  useEffect(() => {
    if (subBookmark) {
      // 编辑子书签
      setTitle(subBookmark.title || '');
      setUrl(subBookmark.url || '');
      setIsNew(false);
      setMode('editSub');
      resolveExistingFavicon();
    } else if (bookmark) {
      // 新建书签
      setTitle(bookmark.title || '');
      setUrl(bookmark.url || '');
      setIsNew(false);
      setMode('edit');
      resolveExistingFavicon();
    } else if (parentBookmark) {
      // 添加子书签
      setTitle('');
      setUrl('');
      setIsNew(true);
      setMode('addSub');
      setExistingFaviconUrl(null);
      setIconMode('auto');
      setIconUrl('');
      setIconValid(null);
      setIconPreview(null);
    } else {
      setTitle('');
      setUrl('');
      setIsNew(true);
      setMode('add');
      setExistingFaviconUrl(null);
      setIconMode('auto');
      setIconUrl('');
      setIconValid(null);
      setIconPreview(null);
    }
  }, [bookmark, parentBookmark, subBookmark, resolveExistingFavicon]);

  const validateAndConvertIcon = useCallback(async (url) => {
    if (!url || !url.trim()) {
      setIconValid(null);
      setIconPreview(null);
      return;
    }
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setIconValid(false);
      setIconPreview(null);
      return;
    }
    const img = new Image();
    img.onload = async () => {
      setIconValid(true);
      try {
        const dataUrl = await useAppStore.getState().fetchFaviconAsDataUrl(trimmed);
        if (dataUrl) setIconPreview(dataUrl);
        else setIconPreview(trimmed);
      } catch {
        setIconPreview(trimmed);
      }
    };
    img.onerror = () => {
      setIconValid(false);
      setIconPreview(null);
    };
    img.src = trimmed;
  }, []);

  const handleIconUrlChange = (value) => {
    setIconUrl(value);
    if (iconDebounceRef.current) clearTimeout(iconDebounceRef.current);
    iconDebounceRef.current = setTimeout(() => validateAndConvertIcon(value), 500);
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    try {
      if (mode === 'editSub') {
        // 编辑子书签
        const { updateSubBookmark } = useAppStore.getState();
        updateSubBookmark(parentBookmark?.id || subBookmark?.parentId, subBookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        });
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin;
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview);
          } catch {}
        }
      } else if (mode === 'addSub') {
        // 新建子书签
        const { addSubBookmark } = useAppStore.getState();
        const parentSubs = useAppStore.getState().subBookmarks[parentBookmark.id] || [];
        if (parentSubs.length >= 5) {
          alert(t('maxSubBookmarks'));
          return;
        }
        addSubBookmark(parentBookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        });
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin;
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview);
          } catch {}
        }
      } else if (isNew) {
        // 新建书签
        const parentId = targetFolderId || useAppStore.getState().currentWorkspace;
        await chrome.bookmarks.create({
          parentId,
          title: title.trim() || finalUrl,
          url: finalUrl,
        });
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin;
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview);
          } catch {}
        }
      } else {
        await chrome.bookmarks.update(bookmark.id, {
          title: title.trim() || finalUrl,
          url: finalUrl,
        });
        if (iconMode === 'manual' && iconValid && iconPreview) {
          try {
            const domain = new URL(finalUrl).origin;
            useAppStore.getState().setFaviconForDomain(domain, iconPreview, title.trim() || finalUrl, finalUrl, iconPreview);
          } catch {}
        }
      }
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      alert(t('saveFailed') || '保存失败');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'editSub':
        return t('editSubBookmark');
      case 'addSub':
        return t('addSubBookmark');
      case 'edit':
        return t('editBookmark');
      default:
        return t('addBookmark');
    }
  };

  const canSave = url.trim().length > 0;

  return (
    <Modal>
      <Modal.Backdrop
        variant='transparent'
        isOpen={!!onClose}
        onOpenChange={(open) => {
          if (!open) {
            onSave?.();
            onClose?.();
          }
        }}>
        <Modal.Container
          size='md'
          placement='center'>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header className='flex items-center justify-between px-6 pt-6'>
              <span className='text-base font-semibold'>{getTitle()}</span>
            </Modal.Header>

            <Modal.Body className='space-y-4 px-6 pb-6'>
              <div className='space-y-3'>
                <Label
                  className='block text-sm text-mist-400'
                  htmlFor='edit-bookmark-title'>
                  {t('name')}
                </Label>
                <Input
                  id='edit-bookmark-title'
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <Separator />
              <div className='space-y-3'>
                <Label
                  className='block text-sm text-mist-400'
                  htmlFor='edit-bookmark-url'>
                  {t('url')}
                </Label>
                <Input
                  id='edit-bookmark-url'
                  fullWidth
                  required
                  placeholder='https://...'
                  value={url}
                  type='url'
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Separator />

              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='block text-sm text-mist-400'>{t('icon')}</Label>
                  <RadioGroup
                    variant='ghost'
                    className='flex flex-row'
                    value={iconMode}
                    defaultValue={iconMode}
                    onChange={(value) => {
                      setIconMode(value);
                      if (value === 'auto') {
                        setIconUrl('');
                        setIconValid(null);
                        setIconPreview(null);
                      }
                    }}>
                    <Radio
                      value='auto'
                      className='data-[selected=true]:bg-accent/10 m-auto rounded-s-full p-2'>
                      <Radio.Content>
                        <Label>{t('auto')}</Label>
                      </Radio.Content>
                    </Radio>
                    <Radio
                      value='manual'
                      className='data-[selected=true]:bg-accent/10 m-auto rounded-e-full p-2'>
                      <Radio.Content>
                        <Label>{t('manual')}</Label>
                      </Radio.Content>
                    </Radio>
                  </RadioGroup>
                </div>

                {iconMode === 'auto' && (
                  <div className='flex items-center gap-3 rounded-lg bg-mist-50 p-3'>
                    {existingFaviconUrl ? (
                      <img
                        src={existingFaviconUrl}
                        alt=''
                        className='h-8 w-8 rounded-md object-contain'
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className='flex h-8 w-8 items-center justify-center rounded-md bg-mist-100'>
                        <Link2
                          size={16}
                          className='text-mist-400'
                        />
                      </div>
                    )}
                    <div className='min-w-0 flex-1'>
                      <div className='text-xs text-mist-600'>{t('autoFetchHint') || '将自动从网站获取图标'}</div>
                      {existingFaviconUrl && <div className='mt-0.5 truncate text-[10px] text-mist-400'>{existingFaviconUrl}</div>}
                    </div>
                  </div>
                )}

                {iconMode === 'manual' && (
                  <div className='flex flex-col space-y-3'>
                    <Description>{t('previewIconUrl')}</Description>
                    <Input
                      fullWidth
                      value={iconUrl}
                      type='url'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleIconUrlChange(e.target.value);
                        } else {
                          setIconUrl(e.target.value);
                        }
                      }}
                      onChange={(e) => setIconUrl(e.target.value)}
                    />
                    {iconPreview && (
                      <div className='flex items-center gap-3 rounded-lg bg-mist-50 p-3'>
                        <img
                          src={iconPreview}
                          alt=''
                          className='h-8 w-8 rounded-md object-contain'
                          ref={previewImgRef}
                          onError={() => {
                            setIconValid(false);
                            setIconPreview(null);
                          }}
                        />
                        <div className='min-w-0 flex-1'>
                          <div className='text-xs text-mist-600'>{t('preview')}</div>
                          <div className='mt-0.5 truncate text-[10px] text-mist-400'>{iconUrl}</div>
                        </div>
                        <Button
                          variant='ghost'
                          className='transition-colors hover:bg-red-300'
                          onPress={() => {
                            setIconUrl('');
                            setIconValid(null);
                            setIconPreview(null);
                          }}>
                          <Trash2
                            size={16}
                            className='stroke-red-500'
                          />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer className='gap-2 px-6 pb-6'>
              <Button
                variant='outline'
                onPress={() => {
                  onClose?.();
                }}>
                {t('cancel')}
              </Button>
              <Button
                color='primary'
                onPress={() => {
                  handleSave();
                }}
                isDisabled={!canSave}>
                {t('save')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default EditBookmarkModal;
