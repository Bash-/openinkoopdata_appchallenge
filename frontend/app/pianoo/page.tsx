import { getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderDocuments } from "@/lib/data";
import { Session } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  // if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  // const chat = await getChat(chatId, session?.user.id)

  let tenderDocumentMetadata = await fetchTenderDocuments("pianoo")

  const emptyScreenBody = (
    <>
      <div>U kunt hier chatten met de gehele inhoud van de site van PIANOo Expertisecentrum Aanbesteden. </div>
      <div>Stel hieronder een vraag, bijvoorbeeld over Maatschappelijk Verantwoord Inkopen, over de Aanbestedingswet, of ieder ander onderwerp dat uw interesse heeft.</div>
      <br />
      <a className="text-blue-500 hover:underline">
        <Link href={`https://www.pianoo.nl/nl`} passHref>
          Klink hier om de site van PIANOo te bekijken
        </Link>
      </a>
    </>)
    
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
          emptyScreenHeader={"Chat over de inhoud van de site van PIANOo Expertisecentrum Aanbesteden"}
          emptyScreenBody={emptyScreenBody}
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