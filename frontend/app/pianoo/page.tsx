import { getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderDocuments } from "@/lib/data";
import { Session } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { redirect } from "next/navigation";

export default async function Page() {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  // if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  // const chat = await getChat(chatId, session?.user.id)

  let tenderDocumentMetadata = await fetchTenderDocuments("pianoo")

  return (
    <>
      {!session && redirect(`/login?next=/pianoo`)}
      {session && <AI initialAIState={{
        chatId: chatId,
        messages:
          //  chat?.messages ??
          [],
        tenderId: "pianoo",
        tenderDocumentMetadata
      }}>
        <Chat
          showEmptyScreen={true}
          emptyScreenHeader={"Chat met PIANOo"}
          emptyScreenBody={"U kunt hier chatten met PIANOo."}
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