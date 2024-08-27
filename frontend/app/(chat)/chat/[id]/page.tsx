import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getChat, getMissingKeys } from '@/app/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import { fetchTenderDocuments } from '@/lib/data'

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
  if (chat.tenderId) {
    tenderDocumentMetadata = await fetchTenderDocuments(chat.tenderId)
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
        tenderId={chat.tenderId}
        initialMessages={chat.messages}
        missingKeys={missingKeys}
      />
    </AI>
  )
}
