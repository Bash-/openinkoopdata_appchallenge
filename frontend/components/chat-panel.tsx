import * as React from 'react'

import { shareChat } from '@/app/actions'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import { FooterText } from '@/components/footer'
import { PromptForm } from '@/components/prompt-form'
import { Button } from '@/components/ui/button'
import { IconShare } from '@/components/ui/icons'
import type { AI } from '@/lib/chat/actions'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import { nanoid } from 'nanoid'
import { UserMessage } from './stocks/message'
import TenderDocumentListModal from './tender/TenderDocumentListModal'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
  tenderId: string | undefined
  documentId: string | undefined
  genericExamples?: boolean
}

export function ChatPanel({
  id,
  title,
  input,
  tenderId,
  documentId,
  genericExamples = false,
  setInput,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)

  const [selectedDocuments, setSelectedDocuments] = React.useState<string[]>([])

  const updateSelectedDocuments = React.useCallback((selectedDocuments: string[]) => {
    setSelectedDocuments(selectedDocuments)
  }, [])

  const normalExampleMessages = [
    {
      heading: 'Wat zijn de eisen van tender over het',
      subheading: 'Collectiebeheersysteem van Historisch Centrum Overijssel?',
      message: `Wat zijn de eisen van tender van Collectiebeheersysteem van Historisch Centrum Overijssel?`
    },
    {
      heading: 'Welke tenders zijn er nu beschikbaar',
      subheading: 'voor softwareleveranciers gespecialiseerd in AI?',
      message: 'Welke tenders zijn er beschikbaar voor softwareleveranciers gespecialiseerd in AI?'
    },
    {
      heading: 'Hoe relateert de tender "Onderhoud groenvoorziening"',
      subheading: 'van Gemeente Amstelveen zich tot het actieplan van het Rijk, "Inkopen met Impact?"',
      message: `Hoe relateert de tender "Onderhoud groenvoorziening" van Gemeente Amstelveen zich tot het actieplan "Inkopen met Impact?" van het Rijk?`
    },
    {
      heading: 'Wat zijn speerpunten van',
      subheading: `het categorieplan "Bedrijfskleding?"`,
      message: `Wat zijn speerpunten van het categorieplan "Bedrijfskleding" van de Rijksoverheid?`
    }
  ]

  const tenderExampleMessages = [
    {
      heading: "ISO 27001",
      subheading: "Moet ik gecertificeerd zijn om in aanmerking te komen voor deze tender?",
      message: "Moet ik ISO 27001 gecertificeerd zijn om in aanmerking te komen voor deze tender?"
    },
    {
      heading: "Rijkscategorieën",
      subheading: "Welke rijkscategorieën zijn relevant voor deze tender?",
      message: "Welke rijkscategorieën zoals duurzaamheid, of circulariteit zijn relevant voor deze tender?"
    }
  ]

  const documentExampleMessages = [
    {
      heading: "Vat dit document samen",
      subheading: 'en geef in bullet points alle duurzaamheidskwalificaties aan',
      message: "Vat dit document samen en geef in bullet points alle duurzaamheidskwalificaties aan"
    }
  ]


  let exampleMessages = []
  if (genericExamples) {
    exampleMessages = [
      {
        heading: 'Wat is ...',
        subheading: 'de strekking van de documenten?',
        message: `Wat is de strekking van de documenten?`
      },
      {
        heading: 'Waar moet ik op letten ...',
        subheading: 'als leverancier in de ICT sector?',
        message: `Waar moet ik op letten als leverancier in de ICT sector?`
      }
    ]

  }
  else {
    exampleMessages = (!tenderId && !documentId) ? normalExampleMessages : documentId ? documentExampleMessages : tenderExampleMessages
  }


  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
          {messages.length === 0 &&
            exampleMessages.map((example, index) => (
              <div
                key={example.heading}
                className={`cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${index > 1 && 'hidden md:block'
                  }`}
                onClick={async () => {
                  setMessages(currentMessages => [
                    ...currentMessages,
                    {
                      id: nanoid(),
                      display: <UserMessage>{example.message}</UserMessage>
                    }
                  ])

                  console.log('beforesubmit', selectedDocuments)
                  const responseMessage = await submitUserMessage(
                    example.message,
                    tenderId,
                    selectedDocuments
                  )

                  setMessages(currentMessages => [
                    ...currentMessages,
                    responseMessage
                  ])
                }}
              >
                <div className="text-sm font-semibold">{example.heading}</div>
                <div className="text-sm text-zinc-600">
                  {example.subheading}
                </div>
              </div>
            ))}
        </div>

        {messages?.length >= 2 ? (
          <div className="flex h-12 items-center justify-center">
            <div className="flex space-x-2">
              {id && title ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <IconShare className="mr-2" />
                    Share
                  </Button>
                  <ChatShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    onCopy={() => setShareDialogOpen(false)}
                    shareChat={shareChat}
                    chat={{
                      id,
                      title,
                      messages: aiState.messages
                    }}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null}
        
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          {tenderId && (
            <TenderDocumentListModal
              tenderId={tenderId}
              documents={aiState?.tenderDocumentMetadata}
              onSelectionChange={updateSelectedDocuments}
            />
          )}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Antwoorden op basis van brondata gegenereerd met OpenAI's gpt-4o-2024-08-06 taalmodel.
          <br />
          Controleer altijd de gegeven antwoorden en brondocumenten om de juistheid te verifiëren.
        </div>
          <PromptForm input={input} setInput={setInput} documentIds={selectedDocuments} tenderId={tenderId} />
          <FooterText className="hidden sm:block" />
        </div>        
      </div>
    </div>
  )
}
