import { getChat, getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderById, fetchTenderDocuments } from "@/lib/data";
import { Session, Tender } from '@/lib/types';
import Link from "next/link";
import { notFound } from "next/navigation";
import { nanoid } from '@/lib/utils'

export default async function TenderDetailPage({
  params
}: {
  params: {
    id: string
  }
}) {
  const tender: Tender = await fetchTenderById(params?.id)
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  
  if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  const chat = await getChat(chatId, session?.user.id)

  // if we have a chat, but this user is not the one chatting, return not found
  if (chat && (chat?.userId !== session?.user?.id)) {
    notFound()
  }
  const tenderId = tender.publicatieid.toString()
  let tenderDocumentMetadata = await fetchTenderDocuments(tenderId)

  return (
    <>
      {!session && <p><Link href={`/login?next=/tenders/${tender.publicatieid}/`}>Login to chat</Link></p>}
      {session && <AI initialAIState={{ chatId: chatId, messages: chat?.messages ?? [], tenderId, tenderDocumentMetadata }}>
        <Chat
          showEmptyScreen={true}
          emptyScreenHeader={tender.aanbestedingnaam}
          emptyScreenBody={tender.opdrachtbeschrijving}
          tenderId={tenderId}
          id={chatId}
          session={session}
          initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
        />
      </AI>}

    </>)
}