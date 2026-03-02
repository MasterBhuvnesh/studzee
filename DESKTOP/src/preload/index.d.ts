import { ElectronAPI } from '@electron-toolkit/preload'

export { }

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: {
      fetchPDFs: () => Promise<{ success: boolean; data?: any; error?: string }>
    }
  }
}
