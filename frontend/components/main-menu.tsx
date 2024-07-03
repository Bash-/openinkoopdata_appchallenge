
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { IconMessage, IconShare } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { HomeIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'

export async function MainMenu() {
  const buttonClassname = 'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10 my-1'
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h4 className="text-sm font-medium">Menu</h4>
      </div>
      <div className="mb-2 px-2">
      <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            buttonClassname
          )}
        >
          <HomeIcon className="-translate-x-2 stroke-2" />
          Hoofdpagina
        </Link>
        <Link
          href="/rijksvoorwaarden"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            buttonClassname
          )}
        >
          <IconMessage className="-translate-x-2 stroke-2" />
          Chat met Rijksvoorwaarden
        </Link>
        <Link
          href="/categorieplannen"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            buttonClassname
          )}
        >
          <IconMessage className="-translate-x-2 stroke-2" />
          Chat met Categorieplannen
        </Link>
        <Link
          href="/tenders"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            buttonClassname
          )}
        >
          <MagnifyingGlassIcon className="-translate-x-2 stroke-2" />
          Zoek en chat met tenders
        </Link>
        <Link
          href="/profile"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            buttonClassname
          )}
        >
          <IconShare className="-translate-x-2 stroke-2" />
          Uw bedrijfsdocumenten
        </Link>
      </div>
    </div>
  )
}
