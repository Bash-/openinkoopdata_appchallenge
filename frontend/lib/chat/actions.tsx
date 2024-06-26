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
  createStreamableValue,
  getAIState,
  getMutableAIState
} from 'ai/rsc';
import OpenAI from 'openai';

import { saveChat } from '@/app/actions';
import { auth } from '@/auth';
import { Events } from '@/components/stocks/events';
import { UserMessage } from '@/components/stocks/message';
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
import { Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})
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
  let sourcesStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  runAsyncFnWithoutBlocking(async () => {
    if (!textStream) {
      textStream = createStreamableValue('')
    }
    if (!sourcesStream) {
      sourcesStream = createStreamableValue('')
    }
    if (!textNode) {
      textNode = <BotMessage content={textStream.value} sources={sourcesStream.value} />
    }

    const history = aiState.get().messages.slice(-3) ?? [];
    console.log(tenderId, documentId, history)
    try {
      const chain = await rag([], tenderId, documentId)

      const response = chain.streamEvents(content, { version: "v1" })
      for await (const event of response) {
        const eventType = event.event;

        if (eventType === "on_llm_stream") {
          textStream.update(event.data.chunk.text);

        } else if (eventType === "on_chain_end") {
          // only on final call
          if (event.name == 'RunnableSequence' && event?.tags?.length == 0) {
            const message = event.data.output.answer;
            const docs = event.data.output.context

            textStream.done()
            sourcesStream.done(JSON.stringify(docs))
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: message,
                  sources: JSON.stringify(docs)
                },
              ]
            })
          }
        } else if (eventType === "on_llm_end") {
          const message = event.data.output.generations[0][0].text
          console.log('llm end')
        }
      }
    } catch (e) {
      console.error(e)
    }

  })

  return {
    id: nanoid(),
    display: textNode,
  }

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
    // confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
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
  onSetAIState: async ({ state, done }) => {
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
    .map((message, index) => {
      return ({
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
          ) : (
            message.sources && <BotMessage content={message.content} sources={createStreamableValue(message.sources).value} />
          )
      })
    })
}
