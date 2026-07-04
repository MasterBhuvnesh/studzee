import { PricingTable } from '@clerk/nextjs';

const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing &amp; Plan</h1>
        <p className="text-sm text-muted-foreground">
          Choose the plan that fits your learning. Changes take effect immediately.
        </p>
      </div>

      {hasClerk ? (
        <PricingTable />
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Clerk Billing isn&apos;t configured yet.</p>
          <p className="mt-2">
            Add your Clerk keys to <code>.env.local</code>, enable{' '}
            <strong>Billing</strong> in the Clerk dashboard, and create the plans{' '}
            <code>explorer</code> / <code>learner</code> / <code>pro</code> with the
            features <code>ai_summary</code>, <code>ai_quiz</code>, and{' '}
            <code>ai_chat</code>. This page will then show the plan switcher.
          </p>
        </div>
      )}
    </div>
  );
}
