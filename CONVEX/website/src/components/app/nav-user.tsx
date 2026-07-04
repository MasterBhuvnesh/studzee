'use client';

import Link from 'next/link';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function NavUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  if (!hasClerk) return null;

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 p-1.5">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-24 group-data-[collapsible=icon]:hidden" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Link
        href="/sign-in"
        className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-sidebar-accent"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
          ?
        </div>
        <span className="group-data-[collapsible=icon]:hidden">Sign in</span>
      </Link>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? '';
  const name = user.fullName ?? user.username ?? email;

  return (
    <div className="flex items-center gap-2 rounded-lg p-1.5">
      <UserButton />
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        {email && (
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => signOut({ redirectUrl: '/' })}
        aria-label="Sign out"
        title="Sign out"
        className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground group-data-[collapsible=icon]:hidden"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
