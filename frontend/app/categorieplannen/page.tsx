import { getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderDocuments } from "@/lib/data";
import { Session } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { redirect } from "next/navigation";

export default async function CategorieplannenPage() {
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
  let tenderDocumentMetadata = await fetchTenderDocuments("categorieplannen")

  return (
    <>
      {!session && redirect(`/login?next=/categorieplannen`)}
      {session && <AI initialAIState={{
        chatId: chatId,
        messages:
          //  chat?.messages ?? 
          [],
        tenderId: "categorieplannen",
        tenderDocumentMetadata
      }}>
        <Chat
          showEmptyScreen={true}
          emptyScreenHeader={"Chat met Categorieplannen"}
          emptyScreenBody={"U kunt hier chatten met de Categorieplannen."}
          tenderId={"categorieplannen"}
          id={chatId}
          session={session}
          genericExamples={true}
          // initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
        />
      </AI >}

    </>)
}