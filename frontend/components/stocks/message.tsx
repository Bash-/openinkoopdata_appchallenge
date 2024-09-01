'use client'

import { IconExternalLink, IconTenderFlow, IconTenderFlowFancy, IconUser } from '@/components/ui/icons'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'
import { cn } from '@/lib/utils'
import { Document } from '@langchain/core/documents'
import { StreamableValue } from 'ai/rsc'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { MemoizedReactMarkdown } from '../markdown'
import { CodeBlock } from '../ui/codeblock'
import { spinner } from './spinner'
// Different types of message bubbles.

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
        <IconUser />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden pl-2">
        {children}
      </div>
    </div>
  )
}

export function SourcesMessage({
  sources
}: {
  sources: Document[]
}) {
  if (sources.length === 0) {
    return null
  }
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
      <div className="max-w-[600px] flex-initial p-2">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Brondocumenten:</p>
          <ul className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.metadata?.id}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {source.metadata?.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

import * as Collapsible from '@radix-ui/react-collapsible'
import { ArrowDownIcon, Cross1Icon } from '@radix-ui/react-icons'
import React from 'react'
import { Card } from '../ui/card'

const SourcesCollapsible = ({ sources, tenderDocumentMetadata }: any) => {
  const [open, setOpen] = React.useState(false);

  const groupedBySource = sources.reduce((acc: any, doc: Document) => {
    const source = doc.metadata.source;
    let sourceClean = source.replace('.pdf', '').replace('.docx', '');

    const pageNumber = doc.metadata.page_number;
    if (!acc[source]) {
      acc[source] = { 'pages': new Set(), 'tenderId': doc.metadata.tenderId };
    }

    // if (pageNumber && pageNumber !== 'null') {
    //   acc[source]['pages'].add(parseInt(pageNumber) + 1);
    // }
    if (pageNumber && pageNumber !== 'null') {
      acc[source]['pages'].add(parseInt(pageNumber));
    }

    if (tenderDocumentMetadata) {
      const match = tenderDocumentMetadata.find((doc: any) => (doc.documentnaam === sourceClean || doc.documentnaam === source));
      if (match && match.downloadurl) {
        if (match.downloadurl.includes('/papi')) {
          acc[source]['downloadurl'] = `https://www.tenderned.nl${match.downloadurl}`;
        } else {
          acc[source]['downloadurl'] = match.downloadurl;
        }
      }
    }

    return acc;
  }, {});

  return (

    (Object.keys(groupedBySource).length) === 0 ?
      // add warning button that no sources were used in the analysis
      <Card className="bg-yellow-100 text-yellow-800 px-5 py-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm">Let op, bovenstaand antwoord heeft geen bronnen gebruikt en is daarom puur gegenereerd door de AI. Mogelijk omdat er geen documenten beschikbaar zijn, of omdat het algoritme geen relevante documenten kon vinden bij uw vraag.
            Controleer hieronder op &#39;Selecteer subset van documenten&#39; om te controleren of er documenten beschikbaar zijn, of probeer opnieuw.
          </p>
        </div>
      </Card> :
      <Collapsible.Root className="CollapsibleRoot" open={open} onOpenChange={setOpen}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Collapsible.Trigger asChild>
            <button className="w-full flex items-center justify-between text-left text-blue-500 hover:text-blue-700 focus:outline-none">
              Bekijk bronnen ({Object.keys(groupedBySource).length}) {open ? <Cross1Icon /> : <ArrowDownIcon />}
            </button>
          </Collapsible.Trigger>
        </div>
        <Collapsible.Content>
          <table className="table-auto w-full mt-4 bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-300 text-white">
              <tr>
                <th className="px-4 text-gray-900 text-left py-2">Bron</th>
                <th className="px-4 text-gray-900 text-left py-2">Pagina</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedBySource).map(([source, { pages, downloadurl }]: any[], index) => (
                <tr key={source} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                  <td className="border px-4 py-2 text-gray-900 text-left flex">
                    <a href={downloadurl} target="_blank">{source} <IconExternalLink className='inline-block' /></a>
                  </td>
                  <td className="border px-4 py-2 text-gray-900 text-left">
                    {Array.from(pages).sort((a: any, b: any) => a - b).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Collapsible.Content>
      </Collapsible.Root>

  );
};


export function BotMessage({
  content,
  sources,
  tenderDocumentMetadata,
  className,
}: {
  content: string | StreamableValue<string>
  sources: string | StreamableValue<string>
  tenderDocumentMetadata?: any[]
  className?: string,
}) {
  const text = useStreamableText(content)
  const sourceOutput = useStreamableText(sources)

  return (
    <>
      <div className={cn('group relative flex items-start md:-ml-12', className)}>
        <div>
          <IconTenderFlowFancy />
        </div>
        {/* <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border text-primary-foreground shadow-sm"> */}
        {/* </div> */}
        <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
          <MemoizedReactMarkdown
            className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == '▍') {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">▍</span>
                    )
                  }

                  children[0] = (children[0] as string).replace('`▍`', '▍')
                }

                const match = /language-(\w+)/.exec(className || '')

                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }

                return (
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ''}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                )
              }
            }}
          >
            {text}
          </MemoizedReactMarkdown>
        </div>
      </div>
      {sourceOutput && (<div className={cn('group relative flex items-start md:-ml-12', className)}>
        <div className="flex size-[24px] shrink-0 select-none items-center justify-center mb-4">
        </div>
        <div className='ml-4 flex-1 space-y-2 overflow-hidden px-1'>
          <SourcesCollapsible sources={JSON.parse(sourceOutput)} tenderDocumentMetadata={tenderDocumentMetadata} />
        </div>
      </div>
      )}
    </>
  )
}

// import * as SwitchPrimitives from "@radix-ui/react-switch"

export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div
        className={cn(
          'flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border text-primary-foreground shadow-sm',
          !showAvatar && 'invisible'
        )}
      >
        <IconTenderFlow />
      </div>
      <div className="ml-4 flex-1 pl-2">{children}</div>
    </div>
  )
}


export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial p-2'}>{children}</div>
    </div>
  )
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border text-primary-foreground shadow-sm">
        <IconTenderFlow />
      </div>
      <div className="ml-4 h-[24px] flex flex-row items-center flex-1 space-y-2 overflow-hidden px-1">
        {spinner}
      </div>
    </div>
  )
}
