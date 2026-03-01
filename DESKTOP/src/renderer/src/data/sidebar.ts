import {
  Brain,
  CodeXml,
  File,
  Image,
  Mail,
  NotebookIcon
} from "lucide-react"

export const data = {

  navMain: [
    {
      title: "Notifications",
      url: "/notifications/applications",
      icon: NotebookIcon,
      isActive: true,
      items: [
        {
          title: "Applications",
          url: "/notifications/applications",
        },
        {
          title: "Email",
          url: "/notifications/email",
        },
        
      ],
    },
    {
      title: "Notification Service",
      url: "/notification-service/email-templates",
      icon: Mail,
      items: [
        {
          title: "Email Templates",
          url: "/notification-service/email-templates",
        },
        {
          title: "Email logs",
          url: "/notification-service/email-logs",
        },
        
      ],
    },
    {
      title: "Backend Service",
      url: "/backend-service/upload-pdf",
      icon: CodeXml,
      items: [
        {
          title: "Upload PDF",
          url: "/backend-service/upload-pdf",
        },
        {
          title: "Upload Image",
          url: "/backend-service/upload-image",
        },

      ],
    },
  ],
  storage: [
    {
      name: "Images",
      url: "/storage/images",
      icon: Image,
    },
    {
      name: "PDFs",
      url: "/storage/pdfs",
      icon: File,
    }
  ],
  ai: {
    name: "AI",
    url: "/home-screen",
    icon: Brain,
  }
}