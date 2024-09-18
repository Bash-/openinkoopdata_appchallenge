import * as m from "@/paraglide/messages";
import { getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderDocuments } from "@/lib/data";
import { Session } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { Link } from "@/lib/i18n";
import { redirect } from "next/navigation";

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
  let tenderDocumentMetadata = await fetchTenderDocuments("rijksvoorwaarden")

  const emptyScreenBody = (
    <>
      <div>{m.rijksvoorwaarden_emptyScreenBody_description_1()}</div>
      <div>{m.rijksvoorwaarden_emptyScreenBody_description_2()}</div>
      <br />
      <a className="text-blue-500 hover:underline">
        <Link href={`https://www.rijksoverheid.nl/onderwerpen/zakendoen-met-het-rijk/voorwaarden-voor-rijksopdrachten`} passHref>
          {m.rijksvoorwaarden_emptyScreenBody_link_text()}
        </Link>
      </a>
    </>)


  return (
    <>
      {!session && redirect(`/login?next=/rijksvoorwaarden`)}
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
          emptyScreenHeader={m.rijksvoorwaarden_emptyScreenHeader()}
          emptyScreenBody={emptyScreenBody}
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