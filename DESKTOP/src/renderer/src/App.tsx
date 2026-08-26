import { ClerkProvider, SignIn, useAuth } from '@clerk/react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ClerkTokenBridge } from './components/auth/ClerkTokenBridge'
import Loading from './components/Loading'
import { TitleBar } from './components/TitleBar'
import { Updates } from './components/Updates'

import { AppSidebar } from './components/app-sidebar'
import { SidebarInset, SidebarProvider } from './components/ui/sidebar'

// Pages
import ApplicationsPage from './pages/ApplicationsPage'
import DocumentEditorPage from './pages/DocumentEditorPage'
import DocumentsPage from './pages/DocumentsPage'
import EmailLogsPage from './pages/EmailLogsPage'
import EmailPage from './pages/EmailPage'
import EmailTemplatesPage from './pages/EmailTemplatesPage'
import HomeScreen from './pages/HomeScreen'
import ImagesPage from './pages/ImagesPage'
import PDFsPage from './pages/PDFsPage'
import PushNotificationPage from './pages/PushNotificationPage'
import QuestsPage from './pages/QuestsPage'
import UploadImagePage from './pages/UploadImagePage'
import UploadPDFPage from './pages/UploadPDFPage'
import UsersPage from './pages/UsersPage'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ConsoleRoutes(): React.JSX.Element {
  const update = false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: '40px' }}>
      <TitleBar title="Studzee" />

      {update && <Updates />}

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <SidebarProvider style={{ height: '100%' }}>
          <AppSidebar />
          <SidebarInset className="overflow-hidden">
            <div className="m-3 flex-1 rounded-2xl bg-gray-50 p-6 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/home-screen" replace />} />
                <Route path="/home-screen" element={<HomeScreen />} />
                <Route path="/content/documents" element={<DocumentsPage />} />
                <Route path="/content/documents/new" element={<DocumentEditorPage />} />
                <Route path="/content/documents/:id/edit" element={<DocumentEditorPage />} />
                <Route path="/quests" element={<QuestsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/notifications/push" element={<PushNotificationPage />} />
                <Route path="/notifications/applications" element={<ApplicationsPage />} />
                <Route path="/notifications/email" element={<EmailPage />} />
                <Route
                  path="/notification-service/email-templates"
                  element={<EmailTemplatesPage />}
                />
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
  )
}

/**
 * With a publishable key present the console gates on a real Clerk session:
 * signed out users get the hosted style sign in card, signed in users reach
 * the console and every api call mints a fresh session token. Without a key
 * the console opens directly and runs on the manual bearer token.
 */
function Gate(): React.JSX.Element {
  const { isLoaded, isSignedIn } = useAuth()

  if (!CLERK_KEY) return <ConsoleRoutes />

  if (!isLoaded) return <Loading />

  if (!isSignedIn) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/" />
      </div>
    )
  }

  return <ConsoleRoutes />
}

function App(): React.JSX.Element {
  if (!CLERK_KEY) {
    return (
      <HashRouter>
        <Gate />
      </HashRouter>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <ClerkTokenBridge />
      <HashRouter>
        <Gate />
      </HashRouter>
    </ClerkProvider>
  )
}

export default App
