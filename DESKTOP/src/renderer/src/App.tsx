// import { Header } from './components/Header';
import { TitleBar } from './components/TitleBar';
import { Updates } from './components/Updates';


//  -------------------
import { AppSidebar } from "./components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider
} from "./components/ui/sidebar";
// -----------
function App(): React.JSX.Element {

  // IPC Communication
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  // Update will be implemented in the future for now its false
  const update = false;


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: '40px' }}>
      <TitleBar title="Studzee" />

      {update && <Updates />}

      <main style={{ flex: 1, overflow: 'hidden' }}>
        {/* <Header /> */}
<Page />
        {/* Testing */}
        {/* <button onClick={ipcHandle}>Send IPC</button> */}
      </main>
    </div>
  )
}

export default App




 function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="m-3 flex-1 rounded-2xl bg-gray-50 p-6 overflow-auto">
          {/* Content goes here */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
