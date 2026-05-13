import { Button, Tooltip } from '@heroui/react';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/store/useAppStore';

interface NavBarProps {
  onSettingsClick: () => void;
  onLogoClick: () => void;
}

function NavBar({ onSettingsClick, onLogoClick }: NavBarProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspace, tabDisplay, wsMeta, navbarIconSize } = useAppStore();

  const navbarItemSize = () => {
    return navbarIconSize.replace('nbi_', 'text-');
  };

  const { t } = useTranslation();

  return (
    <nav className='mb-10 flex items-center gap-1'>
      {/* Logo */}
      <Button
        onClick={onLogoClick}
        variant='ghost'>
        <img
          src='/logo.png'
          alt='Naviga'
          className='h-6 w-6 rounded-xl object-contain'
        />
      </Button>

      {/* Workspace Tabs - scrollable, no scrollbar */}
      <div className='no-scrollbar min-w-0 flex-1 overflow-x-auto'>
        <div className='flex w-max items-center gap-1'>
          {/* All tab */}
          <Tooltip delay={250}>
            <Button
              onClick={() => setCurrentWorkspace('all')}
              variant='ghost'
              className={`rounded-xl px-4 py-2 font-medium whitespace-nowrap transition-colors ${navbarItemSize()} ${
                currentWorkspace === 'all'
                  ? 'text-foreground bg-mist-200 dark:bg-mist-100'
                  : 'hover:text-foreground text-mist-500 hover:bg-mist-100'
              } `}>
              {tabDisplay === 'iconOnly'
                ? '⭐'
                : tabDisplay === 'textOnly'
                  ? t('allFavorites')
                  : '⭐ ' + t('allFavorites')}
            </Button>
            <Tooltip.Content showArrow>
              <Tooltip.Arrow />
              <p>{tabDisplay === 'iconOnly' && t('allFavorites')}</p>
            </Tooltip.Content>
          </Tooltip>

          {workspaces.map((ws: any) => {
            const meta = wsMeta[ws.id];
            const emoji = meta?.emoji || '📁';
            const text = meta?.text || ws.title;
            const isActive = currentWorkspace === ws.id;

            return (
              <Tooltip delay={250}>
                <Button
                  key={ws.id}
                  variant='ghost'
                  onClick={() => setCurrentWorkspace(ws.id)}
                  className={`rounded-xl px-4 py-2 font-medium whitespace-nowrap transition-colors ${navbarItemSize()} ${isActive ? 'text-foreground bg-mist-200 dark:bg-mist-800' : 'hover:text-foreground text-mist-500 hover:bg-mist-100'} `}>
                  {tabDisplay === 'iconOnly' ? emoji : tabDisplay === 'textOnly' ? text : `${emoji} ${text}`}
                </Button>
                <Tooltip.Content showArrow>
                  <Tooltip.Arrow />
                  <p>{tabDisplay === 'iconOnly' && text}</p>
                </Tooltip.Content>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className='flex shrink-0 items-center gap-2'>
        <Tooltip delay={250}>
          <Button
            isIconOnly
            onPress={onSettingsClick}
            className='rounded-xl'>
            <Settings size={20} />
          </Button>
          <Tooltip.Content showArrow>
            <Tooltip.Arrow />
            <p>设置</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </nav>
  );
}

export default NavBar;
