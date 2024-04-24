import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '../actions'
import { MagnifyingGlassIcon, UploadIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Profiel'
}

export default async function IndexPage() {
  const id = nanoid()
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      <h1 className="text-lg font-semibold"> Uw documenten </h1>
      <p className="leading-normal text-muted-foreground">
        Hier kunt u uw bedrijfsdocumenten uploaden en beheren.
        Deze zullen worden gebruikt om persoonlijke vragen te beantwoorden in de chat functie en worden gebruikt voor periodieke aanbevelingen.
      </p>
      <br></br>
      <p className="leading-normal text-muted-foreground">
        Uw documenten worden niet gedeeld met derden, wel worden ze samen naar de OpenAI API gestuurd om vragen te beantwoorden.
        Let daarom op dat u geen gevoelige informatie uploadt.
      </p>
      <br></br>

      <h2 className="text-md font-semibold">Upload uw documenten</h2>
      <div className="w-full flex items-center">
          <Button className="ml-2 mt-5"><MagnifyingGlassIcon/>  Kies document</Button>
        <div className="flex-grow">
          <label
            className="mb-3 mt-5 block text-xs font-medium text-zinc-400"
            htmlFor="email"
          >
            Bestandsnaam
          </label>
          <div className="relative">
            <input
              className="peer block w-full rounded-md border bg-zinc-50 px-2 py-[9px] text-sm outline-none placeholder:text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
              id="filename"
              type="name"
              name="filename"
              placeholder="Voer de bestandsnaam in"
              required
            />
          </div>
        </div>
      </div>
    </div>
  )
}
