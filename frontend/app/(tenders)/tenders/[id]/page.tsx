import { getChat, getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import TenderDocuments from "@/components/tender/TenderDocuments";
import { AI } from "@/lib/chat/actions";
import { fetchTenderById } from "@/lib/data";
import { Session, Tender } from '@/lib/types';
import Link from "next/link";
import { notFound } from "next/navigation";

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

  console.log(tender)


  if (!tender) return notFound();
  const chatId = `tender:${params.id}`
  const chat = await getChat(chatId, session?.user.id)

  // if we have a chat, but this user is not the one chatting, return not found
  if (chat && (chat?.userId !== session?.user?.id)) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4">
      <h2>Tender info</h2>
      <p>{tender.summary}</p>
      <h2>Documenten</h2>
      <TenderDocuments tender={tender} />

      {!session && <p><Link href={`/login?next=/tenders/${tender.publicatie_id}/`}>Login to chat</Link></p>}
      {session && <AI initialAIState={{ chatId: chatId, messages: chat?.messages ?? [] }}>
        <Chat
          tenderId={tender.publicatie_id}
          id={chatId}
          session={session}
          initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
        />
      </AI>}

    </div>)
}