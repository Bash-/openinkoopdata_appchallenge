import 'server-only';

import {
  BotCard,
  BotMessage,
  Purchase,
  Stock,
  SystemMessage,
  spinner
} from '@/components/stocks';
import { Document } from "@langchain/core/documents";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState
} from 'ai/rsc';
import OpenAI from 'openai';

import { saveChat } from '@/app/actions';
import { auth } from '@/auth';
import { Events } from '@/components/stocks/events';
import { SourcesMessage, UserMessage } from '@/components/stocks/message';
import { Stocks } from '@/components/stocks/stocks';
import { Chat } from '@/lib/types';
import {
  formatNumber,
  nanoid,
  runAsyncFnWithoutBlocking,
  sleep
} from '@/lib/utils';
import React from 'react';
import { rag } from '../chains/rag';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages.slice(0, -1),
        {
          id: nanoid(),
          role: 'function',
          name: 'showStockPurchase',
          content: JSON.stringify({
            symbol,
            price,
            defaultAmount: amount,
            status: 'completed'
          })
        },
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${amount * price
            }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string, tenderId: string | undefined, documentId: string | undefined) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode
  let docsNode: undefined | React.ReactNode

  runAsyncFnWithoutBlocking(async () => {

    if (!textStream) {
      textStream = createStreamableValue('')
      textNode = <BotMessage content={textStream.value} />
    }

    const history = aiState.get().messages.slice(-3) ?? [];
    console.log(tenderId, documentId, history)

    try {
      const chain = await rag([], tenderId, documentId)

      const response = chain.streamEvents(content, { version: "v1" })

      for await (const event of response) {
        const eventType = event.event;

        const parseAsJson = (chunk: string, docs: Document[] = []) => {
          return JSON.stringify({
            answer: `${chunk}`,
            docs
          })
        }

        if (eventType === "on_llm_stream") {
          textStream.update(event.data.chunk.text);

        } else if (eventType === "on_chain_end") {
          // only on final call
          if (event.name == 'RunnableSequence' && event?.tags?.length == 0) {
            const message = event.data.output.answer;
            const docs = event.data.output.docs

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: message,
                },
                {
                  id: nanoid(),
                  role: 'sources',
                  content: JSON.stringify(docs)
                }
              ]
            })
          }
        } else if (eventType === "on_llm_end") {
          const message = event.data.output.generations[0][0].text

          textStream.done()
        }
      }
    } catch (e) {
      console.error(e)
    }

  })

  return {
    id: nanoid(),
    display: textNode
  }

}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool' | 'sources'
  content: string
  id: string
  name?: string
  docs?: Document[]
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : message.role === "sources" ? (
          <SourcesMessage docs={JSON.parse(message.content)}></SourcesMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
