import { TitleBar } from './components/TitleBar'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar title="Studzee" />

      <main style={{ flex: 1, padding: '1rem' }}>
        <div className="font-google text-base ">Studzee Admin Dashboard</div>

        {/* Testing */}
        <button onClick={ipcHandle}>Send IPC</button>
      </main>
    </div>
  )
}

export default App
