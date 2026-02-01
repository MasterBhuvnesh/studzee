import { useState, useEffect } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'

interface TitleBarProps {
  title?: string
}

export function TitleBar({ title = 'Studzee' }: TitleBarProps): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  // Window control handlers via IPC
  const handleMinimize = (): void => {
    window.electron.ipcRenderer.send('window-minimize')
  }

  const handleMaximize = (): void => {
    window.electron.ipcRenderer.send('window-maximize')
  }

  const handleClose = (): void => {
    window.electron.ipcRenderer.send('window-close')
  }

  useEffect(() => {
    // Listen for maximize state changes
    const unsubscribe = window.electron.ipcRenderer.on('window-maximized', (_, maximized) => {
      setIsMaximized(maximized as boolean)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div
      className="titlebar"
      style={
        {
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          backgroundColor: 'transparent'
        } as React.CSSProperties
      }
    >
      {/* App Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#333'
        }}
      >
        <span>{title}</span>
      </div>

      {/* Window Controls */}
      <div
        style={
          {
            display: 'flex',
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties
        }
      >
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          style={{
            width: '46px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Minus size={12} strokeWidth={1.5} />
        </button>

        {/* Maximize/Restore */}
        <button
          onClick={handleMaximize}
          style={{
            width: '46px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {isMaximized ? (
            <Copy size={10} strokeWidth={1.5} />
          ) : (
            <Square size={10} strokeWidth={1.5} />
          )}
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            width: '46px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#e81123')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
