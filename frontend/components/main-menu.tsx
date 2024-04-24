import * as React from 'react'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconPlus, IconShare } from '@/components/ui/icons'

export async function MainMenu() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h4 className="text-sm font-medium">Menu</h4>
      </div>
      <div className="mb-2 px-2">
        <Link
          href="/profile"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10'
          )}
        >
          <IconShare className="-translate-x-2 stroke-2" />
          Uw bedrijfsdocumenten
        </Link>
      </div>
    </div>
  )
}
