import * as m from "@/paraglide/messages";
import { getChat, getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderById, fetchTenderDocuments } from "@/lib/data";
import { Session, Tender } from '@/lib/types';
import { nanoid } from '@/lib/utils';
import { Link } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";

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

  if (!tender) return notFound();
  const nid = nanoid()
  const chatId = `${nid}`
  const chat = await getChat(chatId, session?.user.id)

  // if we have a chat, but this user is not the one chatting, return not found
  if (chat && (chat?.userId !== session?.user?.id)) {
    notFound()
  }
  const tenderId = tender.publicatieid.toString()
  let tenderDocumentMetadata = await fetchTenderDocuments(tenderId)

  let emptyScreenBody = (
    <>
      <div><strong>{m.tender_aanbestedende_dienst()}:</strong> {tender.aanbestedendedienstnaam}</div>
      <div><strong>{m.tender_publicatiedatum()}:</strong> {tender.publicatiedatum?.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
      <div><strong>{m.tender_sluitingsdatum()}:</strong> {tender.sluitingsdatum?.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
      <div><strong>{m.tender_aanvang_opdracht()}:</strong> {tender.aanvangopdrachtdatum?.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
      <div><strong>{m.tender_opdrachtbeschrijving()}:</strong> {tender.opdrachtbeschrijving}</div>
      <div><strong>{m.tender_publicatie_id()}:</strong> {tender.publicatieid}</div>

      {/* Link to Tenderned */}
      <a className="text-blue-500 hover:underline">
        <Link href={`https://www.tenderned.nl/tenderned-tap/aankondigingen/${tender.publicatieid}`} passHref>
          {m.tender_checkon_tenderned_button()}
        </Link>
      </a>

    </>)

  return (
    <>
      {!session && redirect(`/login?next=/tenders/${tender.publicatieid}`)}
      {session && <AI initialAIState={{ chatId: chatId, messages: chat?.messages ?? [], tenderId, tenderDocumentMetadata }}>
        <Chat
          showEmptyScreen={true}
          emptyScreenHeader={tender.aanbestedingnaam}
          emptyScreenBody={emptyScreenBody}
          tenderId={tenderId}
          id={chatId}
          session={session}
          initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
        />
      </AI>}

    </>)
}