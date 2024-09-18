import * as m from "@/paraglide/messages.js"
import { auth } from '@/auth'
import { EmptyScreen } from '@/components/empty-screen'
import { buttonVariants } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'
import { Session } from '@/lib/types'
import { cn, nanoid } from '@/lib/utils'
import { Link } from "@/lib/i18n"
import { getMissingKeys } from '../actions'

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
                  {m.chat_indexPage_heading1()}
                </h1>
                <p className="leading-normal text-muted-foreground pb-4">
                  {m.chat_indexPage_subheading1()}
                </p>
                <Link
                  href="/rijksvoorwaarden"
                  className={cn(buttonVariants({ variant: 'outline' }), "mt-2", 'w-full', 'justify-between')}
                >
                  <span className="ml-2 mt-1 md:flex">{m.chat_indexPage_button_rijksvoorwaarden()}</span>
                  <IconArrowRight className="ml-2" />
                </Link>
                <Link
                  href="/categorieplannen"
                  className={cn(buttonVariants({ variant: 'outline' }), "mt-2", 'w-full', 'justify-between')}
                >
                  <span className="ml-2 md:flex">{m.chat_indexPage_button_categorieplannen()}</span>
                  <IconArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 mb-4">
              <div className="bg-white shadow rounded-lg p-4">
                <h1 className="text-md font-semibold">
                  {m.chat_indexPage_heading2()}
                </h1>
                <p className="leading-normal text-muted-foreground pb-4">
                  {m.chat_indexPage_subheading2()}
                </p>
                <Link
                  href="/tenders"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-2', 'w-full', 'justify-between')}
                >
                  <span className="ml-2 md:flex">{m.chat_indexPage_button_tenders()}</span>
                  <IconArrowRight className="ml-2" />
                </Link>
                <Link
                  href="/pianoo"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-2', 'w-full', 'justify-between')}
                >
                  <span className="ml-2 md:flex">{m.chat_indexPage_button_pianoo()}</span>
                  <IconArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



  )
}
