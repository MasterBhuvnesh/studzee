import { TitleBar } from './components/TitleBar'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar title="Studzee" />

      <main style={{ flex: 1, padding: '1rem' }}>
        <h1>Bhuvnesh Verma</h1>
        <div className="font-google text-xl ">Medium Text</div>

        <h1 className="font-google text-4xl font-bold">Bold Heading</h1>

        <p className="font-google font-normal">Regular body text</p>

        {/* Testing */}
        <button onClick={ipcHandle}>Send IPC</button>
      </main>
    </div>
  )
}

export default App
