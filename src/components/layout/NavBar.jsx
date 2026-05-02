import { useAppStore } from '../../store/useAppStore'
import { Button, Tooltip } from "@nextui-org/react";
import { Settings, Plus } from 'lucide-react'

function NavBar({ onSettingsClick, onAddBookmark, onLogoClick }) {
  const { workspaces, currentWorkspace, setCurrentWorkspace, tabDisplay, wsMeta } = useAppStore()
  
  return (
    <nav className="flex items-center gap-4 mb-10">
      {/* Logo */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <img src="/logo.png?v=20260503" alt="Naviga" className="w-9 h-9 rounded-xl object-contain" />
        <span className="font-semibold text-lg text-foreground">aviga</span>
      </button>
      
      {/* Workspace Tabs - scrollable, no scrollbar */}
      <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 w-max">
          {/* All tab */}
          <button
            onClick={() => setCurrentWorkspace('all')}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap
              ${currentWorkspace === 'all' 
                ? 'bg-default-200 dark:bg-default-100 text-foreground' 
                : 'text-default-500 hover:text-foreground hover:bg-default-100'
              }
            `}
          >
            ⭐ 收藏
          </button>
          
          {workspaces.map((ws) => {
            const meta = wsMeta[ws.id]
            const emoji = meta?.emoji || '📁'
            const text = meta?.text || ws.title
            const isActive = currentWorkspace === ws.id
            
            // 根据显示模式决定标签内容
            let label = text
            if (tabDisplay !== 'textOnly') {
              label = `${emoji} ${text}`
            }
            if (tabDisplay === 'iconOnly') {
              label = emoji
            }
            
            return (
              <button
                key={ws.id}
                onClick={() => setCurrentWorkspace(ws.id)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive 
                    ? 'bg-default-200 dark:bg-default-100 text-foreground' 
                    : 'text-default-500 hover:text-foreground hover:bg-default-100'
                  }
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Tooltip content="添加书签">
          <Button
            isIconOnly
            variant="light"
            onPress={onAddBookmark}
            className="rounded-xl"
          >
            <Plus size={20} />
          </Button>
        </Tooltip>
        <Tooltip content="设置">
          <Button
            isIconOnly
            variant="light"
            onPress={onSettingsClick}
            className="rounded-xl"
          >
            <Settings size={20} />
          </Button>
        </Tooltip>
      </div>
    </nav>
  )
}

export default NavBar
