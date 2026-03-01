import * as React from "react"

import { NavMain } from "@renderer/components/nav-main"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail
} from "@renderer/components/ui/sidebar"
import { data } from "@renderer/data/sidebar"
import { NavAI } from "./nav-ai"
import { NavStorage } from "./nav-storage"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="none" {...props}>
      
      <SidebarContent>
<NavAI ai={data.ai} />        
        <NavMain items={data.navMain} />
        <NavStorage storage={data.storage} />
      </SidebarContent>
      <SidebarFooter>
        
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
