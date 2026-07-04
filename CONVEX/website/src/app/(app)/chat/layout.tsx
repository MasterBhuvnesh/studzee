'use client';

import { useState } from 'react';
import { ChatHistory } from '@/components/app/chat-history';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* Desktop history panel */}
      <aside className="hidden w-64 shrink-0 border-r border-border pr-4 md:block">
        <ChatHistory />
      </aside>

      <div className="flex h-full min-h-0 flex-1 flex-col">
        {/* Mobile history trigger */}
        <div className="mb-2 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Chat history">
                <PanelLeft className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Chat history</SheetTitle>
              <ChatHistory onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {children}
      </div>
    </div>
  );
}
