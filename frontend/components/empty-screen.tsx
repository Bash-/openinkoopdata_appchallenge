import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Explain technical concepts',
    message: `What is a "serverless function"?`
  },
  {
    heading: 'Summarize an article',
    message: 'Summarize the following article for a 2nd grader: \n'
  },
  {
    heading: 'Draft an email',
    message: `Draft an email to my boss about the following: \n`
  }
]

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welkom bij de TenderFlow chatbot!
        </h1>
        <p className="leading-normal text-muted-foreground">
          Dit is een open source chatbot dat vragen kan beantwoorden over aanbestedingen van het Rijk.
          Stel gerust een vraag of probeer een van de voorbeelden hieronder.
        </p>
        <p className="leading-normal text-muted-foreground">
          Het AI model is getraind op een dataset met actuele aanbestedingsdata van het Rijk,
          en kan vragen beantwoorden over onderwerpen zoals categorieplannen, inkoopstrategieën en tenderdocumenten.
        </p>
      </div>
    </div>
  )
}
