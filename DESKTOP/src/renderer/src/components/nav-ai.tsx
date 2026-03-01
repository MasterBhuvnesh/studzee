import {
    type LucideIcon
} from "lucide-react"
import { Link } from "react-router-dom"

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@renderer/components/ui/sidebar"

export function NavAI({
  ai,
}: {
  ai: {
    name: string
    url: string
    icon: LucideIcon
  }
}) {


  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">

      <SidebarMenu>
          <SidebarMenuItem >
            <SidebarMenuButton asChild>
              <Link to={ai.url}>
                <ai.icon />
                <span>{ai.name}</span>
              </Link>
            </SidebarMenuButton>
         
          </SidebarMenuItem>
        
      </SidebarMenu>
    </SidebarGroup>
  )
}
