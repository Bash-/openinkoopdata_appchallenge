'use client'

import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { Message } from '@/lib/chat/actions'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { Session } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAIState, useUIState } from 'ai/rsc'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
  tenderId?: string | undefined
  documentId?: string | undefined
  showEmptyScreen?: boolean;
  emptyScreenHeader?: string;
  emptyScreenBody?: string;
  genericExamples?: boolean
}

export function Chat({ id, tenderId, documentId, className, session, missingKeys, showEmptyScreen = true, emptyScreenHeader, emptyScreenBody, genericExamples }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages] = useUIState()
  const [aiState] = useAIState()

  const [_, setNewChatId] = useLocalStorage('newChatId', id)

  const isTenderChat = path.includes('/tender')
  const isDocumentChat = path.includes('/document')

  // useEffect(() => {
  //   if (session?.user) {
  //     if (!path.includes('chat') && messages.length === 1 && !isTenderChat && !isDocumentChat) {
  //       window.history.replaceState({}, '', `/chat/${id}`)
  //     }
  //     if (!path.includes('/tender') && messages.length === 1 && !isDocumentChat) {
  //       window.history.replaceState({}, `/tenders/${id}`)
  //     }
  //   }
  // }, [id, path, session?.user, messages])

  // TODO, maybe remove this, see if it affects the chat saving, this was uncommented initally by Vercel
  // useEffect(() => {
  //   const messagesLength = aiState.messages?.length
  //   // console.log("aistate messages", aiState.messages)
  //   // if (messagesLength === 2) {
  //   //   // add delay of 1 second to allow the chat to be saved
  //   //   setTimeout(() => {
  //   //     router.refresh()
  //   //   }, 1000)
  //   // }
  // }, [aiState.messages, router])

  useEffect(() => {
    setNewChatId(id)
  })

  useEffect(() => {
    missingKeys.map(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <div
        className={cn('pb-[200px] pt-4 md:pt-10', className)}
        ref={messagesRef}
      >
        {messages.length ? (
          <ChatList messages={messages} isShared={false} session={session} />
        ) : (showEmptyScreen ?
          <EmptyScreen emptyScreenHeader={emptyScreenHeader} emptyScreenBody={emptyScreenBody} /> : null
        )}
        <div className="h-px w-full" ref={visibilityRef} />
      </div>
      <ChatPanel
        tenderId={tenderId}
        documentId={documentId}
        id={id}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        genericExamples={genericExamples}
      />
    </div>
  )
}
