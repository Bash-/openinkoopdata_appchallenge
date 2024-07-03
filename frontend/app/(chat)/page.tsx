import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '../actions'
import { EmptyScreen } from '@/components/empty-screen'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { IconArrowRight, IconMessage } from '@/components/ui/icons'

export const metadata = {
  title: 'Chat'
}

export default async function IndexPage() {
  const id = nanoid()
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
    >
      <div
        className={cn('pb-[200px] pt-4 md:pt-10')}
      >
        <div className='mx-auto mb-4'>
          <EmptyScreen />
        </div>
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 lg:mr-4 mb-4">
              <div className="bg-white shadow rounded-lg p-4">
                <h1 className="text-md font-semibold">
                  Ik overweeg zaken te doen met het Rijk
                </h1>
                <p className="leading-normal text-muted-foreground pb-4">
                  Kom meer te weten over categorieplannen, voorwaarden voor inkoop bij rijksopdrachten, de Rijksaanbestedingskalender en meer.
                </p>
                <Link
                  href="/rijksvoorwaarden"
                  className={cn(buttonVariants({ variant: 'outline' }))}
                >
                  <IconArrowRight className="mr-1" />
                  <span className="hidden ml-2 md:flex">Chat met Rijksvoorwaarden</span>
                </Link>
                <Link
                  href="/categorieplannen"
                  className={cn(buttonVariants({ variant: 'outline' }))}
                >
                  <IconArrowRight className="mr-1" />
                  <span className="hidden ml-2 md:flex">Chat met Categorieplannen</span>
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 mb-4">
              <div className="bg-white shadow rounded-lg p-4">
                <h1 className="text-md font-semibold">
                  Ik wil meedingen naar opdrachten van het Rijk
                </h1>
                <p className="leading-normal text-muted-foreground pb-4">
                  Lees meer over gepubliceerde aanbestedingen, maatschappelijk verantwoord ondernemen, voorwaarden voor inkoop bij rijksopdrachten en meer.
                </p>
                <Link
                  href="/tenders"
                  className={cn(buttonVariants({ variant: 'outline' }))}
                >
                  <IconArrowRight className="mr-1" />
                  <span className="hidden ml-2 md:flex">Zoek en chat met Tenders</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



  )
}
