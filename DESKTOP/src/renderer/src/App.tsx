function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <h1>Bhuvnesh Verma</h1>
      <div className="font-google text-xl ">Medium Text</div>

      <h1 className="font-google text-4xl font-bold">Bold Heading</h1>

      <p className="font-google font-normal">Regular body text</p>

      {/* Testing */}
      <button onClick={ipcHandle}>Send IPC</button>
    </>
  )
}

export default App
