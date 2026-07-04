import { SignIn } from '@clerk/nextjs';

// Rendered per-request so a production build doesn't need Clerk context at build time.
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignIn />
    </div>
  );
}
