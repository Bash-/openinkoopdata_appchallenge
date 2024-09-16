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
        Inkopen met impact is dé standaard voor duurzaam, sociaal en innovatief inkopen bij het Rijk.
        In de categorieplannen staat welke inkoopdoelen en -acties er zijn voor de verschillende categorieën.
        Bedrijven kunnen zich met categorieplannen voorbereiden op aanbestedingen.
      </div>
      <div >
        U kunt hieronder chatten met de verschillende Categorieplannen. Stel bijvoorbeeld een vraag over een van de volgende categorieën:
        <ul className="pl-5">
          <li>- Bedrijfskleding</li>
          <li>- Beveiliging & Bedrijfshulpverlening</li>
          <li>- Connectiviteit</li>
          <li>- Consumptieve Dienstverlening</li>
          <li>- Duurzame Inzetbaarheid</li>
          <li>- ICT Werkomgeving Rijk</li>
          <li>- Laboratorium</li>
          <li>- Logistiek</li>
          <li>- Vervoer en Verblijf</li>
          <li>- Werkplekomgeving</li>
        </ul>
      </div>
      <br />
      <a className="text-blue-500 hover:underline">
        <Link href={`https://www.rijksoverheid.nl/onderwerpen/zakendoen-met-het-rijk/inkoopcategorieen`} passHref>
          Klik hier om alle Inkoopcategorieën en Categorieplannen op Rijksoverheid.nl te bekijken
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