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

  const emptyScreenBody = (
    <>
      <div>
        {m.categorieplannen_emptyScreenBody_intro()}
      </div>
      <div>
        {m.categorieplannen_emptyScreenBody_chat_intro()}
        <ul className="pl-5">
          <li>- {m.categorieplannen_emptyScreenBody_category_bedrijfskleding()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_beveiliging_bedrijfshulpverlening()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_connectiviteit()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_consumptieve_dienstverlening()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_duurzame_inzetbaarheid()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_ict_werkomgeving_rijk()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_laboratorium()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_logistiek()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_vervoer_en_verblijf()}</li>
          <li>- {m.categorieplannen_emptyScreenBody_category_werkplekomgeving()}</li>
        </ul>
      </div>
      <br />
      <a className="text-blue-500 hover:underline">
        <Link href={`https://www.rijksoverheid.nl/onderwerpen/zakendoen-met-het-rijk/inkoopcategorieen`} passHref>
          {m.categorieplannen_emptyScreenBody_link_text()}
        </Link>
      </a>
    </>
  )

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
          emptyScreenBody={emptyScreenBody}
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