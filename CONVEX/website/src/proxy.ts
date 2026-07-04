import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/blog(.*)',
  '/chat(.*)',
  '/quiz(.*)',
  '/path(.*)',
  '/author(.*)',
  '/notifications(.*)',
  '/settings(.*)',
]);

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// ponytail: no-op proxy until Clerk keys exist, so the marketing site boots pre-setup.
export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (!isProtectedRoute(req)) return;
      // Redirect signed-out visitors to sign-in instead of a bare 404.
      const { userId, redirectToSignIn } = await auth();
      if (!userId) return redirectToSignIn();
    })
  : function proxy() {};

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
