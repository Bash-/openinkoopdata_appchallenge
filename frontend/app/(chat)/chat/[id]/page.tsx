import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { getChat, getMissingKeys } from '@/app/actions'
import { auth } from '@/auth'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { fetchTenderById, fetchTenderDocuments } from '@/lib/data'
import { Session } from '@/lib/types'
import Link from 'next/link'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const session = await auth()

  if (!session?.user) {
    return {}
  }

  const chat = await getChat(params.id, session.user.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  if (!session?.user) {
    redirect(`/login?next=/chat/${params.id}`)
  }

  const userId = session.user.id as string
  const chat = await getChat(params.id, userId)

  if (!chat) {
    redirect('/')
  }

  if (chat?.userId !== session?.user?.id) {
    notFound()
  }

  let tenderDocumentMetadata
  let tender
  let emptyScreenBody
  if (chat.tenderId) {
    tenderDocumentMetadata = await fetchTenderDocuments(chat.tenderId)
    tender = await fetchTenderById(chat.tenderId)

    if (tender) {
      emptyScreenBody = (
        <>
          <div><strong>Aanbestedende dienst:</strong> {tender.aanbestedendedienstnaam}</div>
          <div><strong>Publicatiedatum:</strong> {tender.publicatiedatum?.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          <div><strong>Sluitingsdatum:</strong> {tender.sluitingsdatum?.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
          <div><strong>Opdrachtbeschrijving:</strong> {tender.opdrachtbeschrijving}</div>
          <div><strong>Publicatie ID:</strong> {tender.publicatieid}</div>

          {/* Link to Tenderned */}
          <a className="text-blue-500 hover:underline">
            <Link href={`https://www.tenderned.nl/tenderned-tap/aankondigingen/${tender.publicatieid}`} passHref>
              Bekijk op Tenderned
            </Link>
          </a>

        </>)

    }


  }

  return (
    <AI initialAIState={{
      chatId: chat.id,
      messages: chat.messages,
      tenderId: chat.tenderId,
      tenderDocumentMetadata: tenderDocumentMetadata
    }}>
      <Chat
        id={chat.id}
        session={session}
        showEmptyScreen={true}
        emptyScreenHeader={tender?.aanbestedingnaam}
        emptyScreenBody={emptyScreenBody}
        tenderId={chat.tenderId}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
