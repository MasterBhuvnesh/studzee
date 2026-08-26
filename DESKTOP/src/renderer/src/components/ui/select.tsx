import * as React from 'react'

import { cn } from '@renderer/lib/utils'

/**
 * Native select styled like the shared input. Radix Select would match the
 * other primitives more closely, but the console only needs simple single
 * picks today and the native element keeps the dependency surface flat.
 */
function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(
        'border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  )
}

export { Select }
