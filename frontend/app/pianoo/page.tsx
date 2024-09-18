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

export default async function PianooPage() {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  // if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  // const chat = await getChat(chatId, session?.user.id)

  let tenderDocumentMetadata = await fetchTenderDocuments("pianoo")

  const emptyScreenBody = (
    <>
      <div>{m.pianoo_emptyScreenBody_text1()}</div>
      <div>{m.pianoo_emptyScreenBody_text2()}</div>
      <br />
      <a className="text-blue-500 hover:underline">
        <Link href={`https://www.pianoo.nl/nl`} passHref>
          {m.pianoo_emptyScreenBody_linkText()}
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
          emptyScreenHeader={m.pianoo_emptyScreenHeader()}
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