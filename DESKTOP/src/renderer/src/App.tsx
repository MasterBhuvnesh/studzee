import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TitleBar } from './components/TitleBar'
import { Updates } from './components/Updates'

import { AppSidebar } from "./components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider
} from "./components/ui/sidebar"

// Pages
import ApplicationsPage from './pages/ApplicationsPage'
import EmailLogsPage from './pages/EmailLogsPage'
import EmailPage from './pages/EmailPage'
import EmailTemplatesPage from './pages/EmailTemplatesPage'
import HomeScreen from './pages/HomeScreen'
import ImagesPage from './pages/ImagesPage'
import PDFsPage from './pages/PDFsPage'
import UploadImagePage from './pages/UploadImagePage'
import UploadPDFPage from './pages/UploadPDFPage'

function App(): React.JSX.Element {
  const update = false

  return (
    <HashRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: '40px' }}>
        <TitleBar title="Studzee" />

        {update && <Updates />}

        <main style={{ flex: 1, overflow: 'hidden' }}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div className="m-3 flex-1 rounded-2xl bg-gray-50 p-6 overflow-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/home-screen" replace />} />
                  <Route path="/home-screen" element={<HomeScreen />} />
                  <Route path="/notifications/applications" element={<ApplicationsPage />} />
                  <Route path="/notifications/email" element={<EmailPage />} />
                  <Route path="/notification-service/email-templates" element={<EmailTemplatesPage />} />
                  <Route path="/notification-service/email-logs" element={<EmailLogsPage />} />
                  <Route path="/backend-service/upload-pdf" element={<UploadPDFPage />} />
                  <Route path="/backend-service/upload-image" element={<UploadImagePage />} />
                  <Route path="/storage/images" element={<ImagesPage />} />
                  <Route path="/storage/pdfs" element={<PDFsPage />} />
                </Routes>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
