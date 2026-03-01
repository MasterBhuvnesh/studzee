import {
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
      url: "#",
      icon: NotebookIcon,
      isActive: true,
      items: [
        {
          title: "Applications",
          url: "#",
        },
        {
          title: "Email",
          url: "#",
        },
        
      ],
    },
    {
      title: "Notification Service",
      url: "#",
      icon: Mail,
      items: [
        {
          title: "Email Templates",
          url: "#",
        },
        {
          title: "Email logs",
          url: "#",
        },
        
      ],
    },
    {
      title: "Backend Service",
      url: "#",
      icon: CodeXml,
      items: [
        {
          title: "Upload PDF",
          url: "#",
        },
        {
          title: "Upload Image",
          url: "#",
        },

      ],
    },
  ],
  storage: [
    {
      name: "Images",
      url: "#",
      icon: Image,
    },
    {
      name: "PDFs",
      url: "#",
      icon: File,
    }
  ],
}