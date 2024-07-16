import { getChat, getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderById } from "@/lib/data";
import { Session, Tender } from '@/lib/types';
import Link from "next/link";
import { notFound } from "next/navigation";
import { nanoid } from '@/lib/utils'

export default async function RijksvoorwaardenPage() {
  // const tender: Tender = await fetchTenderById('rijksdocumenten')
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  // if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  // const chat = await getChat(chatId, session?.user.id)

  // if we have a chat, but this user is not the one chatting, return not found
  // if (chat && (chat?.userId !== session?.user?.id)) {
  //   notFound()
  // }

  return (
    <>
      {!session && <p><Link href={`/login`}>Login to chat</Link></p>}
      {session && <AI initialAIState={{
        chatId: chatId,
        messages:
          //  chat?.messages ?? 
          [],
        tenderId: "rijksvoorwaarden",
        tenderDocumentMetadata: []
      }}>
        <Chat
          showEmptyScreen={true}
          emptyScreenHeader={"Chat met Rijksvoorwaarden"}
          emptyScreenBody={"U kunt hier chatten met de Rijksvoorwaarden."}
          tenderId={"rijksvoorwaarden"}
          id={chatId}
          session={session}
          // initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
          genericExamples={true}
        />
      </AI>}

    </>)
}