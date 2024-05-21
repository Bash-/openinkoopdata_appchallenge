import { getChat, getMissingKeys } from "@/app/actions";
import { auth } from "@/auth";
import { Chat } from "@/components/chat";
import { AI } from "@/lib/chat/actions";
import { fetchTenderById } from "@/lib/data";
import { Session, Tender } from '@/lib/types';
import Link from "next/link";
import { notFound } from "next/navigation";

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
  const chatId = `tender${params.id}`
  const chat = await getChat(chatId, session?.user.id)

  // if we have a chat, but this user is not the one chatting, return not found
  if (chat && (chat?.userId !== session?.user?.id)) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4">
      {!chat?.messages && <div className="mx-auto max-w-2xl px-4">
        <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
          <h1 className="text-lg font-semibold">
            {tender.aanbestedingnaam}
          </h1>
          <p className="leading-normal text-muted-foreground">
            {tender.opdrachtbeschrijving}
          </p>
        </div>
      </div>
      }

      {!session && <p><Link href={`/login?next=/tenders/${tender.publicatieid}/`}>Login to chat</Link></p>}
      {session && <AI initialAIState={{ chatId: chatId, messages: chat?.messages ?? [] }}>
        <Chat
          showEmptyScreen={false}
          tenderId={tender.publicatieid}
          id={chatId}
          session={session}
          initialMessages={chat?.messages ?? []}
          missingKeys={missingKeys}
        />
      </AI>}

    </div>)
}