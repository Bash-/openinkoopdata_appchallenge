import { getChat, getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderById, fetchTenderDocuments } from "@/lib/data";
import { Session, Tender } from '@/lib/types';
import Link from "next/link";
import { notFound } from "next/navigation";
import { nanoid } from '@/lib/utils'

export default async function Page() {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  // if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  // const chat = await getChat(chatId, session?.user.id)

  let tenderDocumentMetadata = await fetchTenderDocuments("rijksvoorwaarden")

  return (
    <>
      {!session && <p><Link href={`/login`}>Login to chat</Link></p>}
      {session && <AI initialAIState={{
        chatId: chatId,
        messages:
          //  chat?.messages ??
          [],
        tenderId: "rijksvoorwaarden",
        tenderDocumentMetadata
      }}>
        <Chat
          showEmptyScreen={true}
          emptyScreenHeader={"Chat met Pianoo"}
          emptyScreenBody={"U kunt hier chatten met Pianoo."}
          tenderId={"pianoo"}
          id={chatId}
          session={session}
          // initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
          genericExamples={true}
        />
      </AI>}

    </>)
}