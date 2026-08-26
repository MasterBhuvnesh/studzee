import { BookOpen, Brain, File, Image, Mail, NotebookIcon, Target } from 'lucide-react'

export const data = {
  navMain: [
    {
      title: 'Content',
      url: '/content/documents',
      icon: BookOpen,
      isActive: true,
      items: [
        {
          title: 'Documents',
          url: '/content/documents'
        },
        {
          title: 'Upload PDF',
          url: '/backend-service/upload-pdf'
        },
        {
          title: 'Upload Image',
          url: '/backend-service/upload-image'
        }
      ]
    },
    {
      title: 'Engagement',
      url: '/quests',
      icon: Target,
      items: [
        {
          title: 'Quests',
          url: '/quests'
        },
        {
          title: 'Push notification',
          url: '/notifications/push'
        },
        {
          title: 'Users',
          url: '/users'
        }
      ]
    },
    {
      title: 'Notifications',
      url: '/notifications/applications',
      icon: NotebookIcon,
      items: [
        {
          title: 'Applications',
          url: '/notifications/applications'
        },
        {
          title: 'Email',
          url: '/notifications/email'
        }
      ]
    },
    {
      title: 'Notification Service',
      url: '/notification-service/email-templates',
      icon: Mail,
      items: [
        {
          title: 'Email Templates',
          url: '/notification-service/email-templates'
        },
        {
          title: 'Email logs',
          url: '/notification-service/email-logs'
        }
      ]
    }
  ],
  storage: [
    {
      name: 'Images',
      url: '/storage/images',
      icon: Image
    },
    {
      name: 'PDFs',
      url: '/storage/pdfs',
      icon: File
    }
  ],
  ai: {
    name: 'AI',
    url: '/home-screen',
    icon: Brain
  }
}
