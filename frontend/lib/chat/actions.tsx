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
import { AIMessage, HumanMessage } from "@langchain/core/messages";
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
  if (!textStream) {
    textStream = createStreamableValue('')
  }
  if (!sourcesStream) {
    sourcesStream = createStreamableValue('')
  }

  runAsyncFnWithoutBlocking(async () => {

    const history = aiState.get().messages.slice(-3) ?? [];
    console.log("++++++++++++HIstory++++++++++++")
    console.log(history)

    let historicalMessages = history.map((m) => {
      if (m.role == "user") return new HumanMessage({ content: m.content })
      if (m.role == "assistant" || m.role == "system") return new AIMessage({ content: m.content })
      return new AIMessage({ content: m.content })
    }
    )

    let chainCounter = 0;
    try {
      const chain = await rag([], tenderId, documentId)

      // TODO this seems to be not working, cannot pass an object here? Not sure how to pass chat_history then to RAG function and these message templates
      const response = chain.streamEvents({ question: content, chat_history: historicalMessages }, { version: "v1" })
      for await (const event of response) {
        // console.log(event)
        // console.log("==================")
        const eventType = event.event;

        if (eventType === "on_llm_stream" && chainCounter > 0) {
          textStream.update(event.data.chunk.text);

        } else if (eventType === "on_chain_end") {
          // only on final call
          if (event.name == 'RunnableSequence' && event?.tags?.length == 0 && chainCounter == 0) {
            chainCounter = chainCounter + 1
          }
          else if (event.name == 'RunnableSequence' && event?.tags?.length == 0 && chainCounter > 0) {
            const message = event.data.output.answer.content;
            const docs = event.data.output.sourceDocuments

            console.log(event.data.output)

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
    display: <BotMessage content={textStream.value} sources={sourcesStream.value} />,
  }

}


export type AIState = {
  chatId: string
  messages: Message[]
  tenderId: string | undefined
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
  initialAIState: { chatId: nanoid(), messages: [], tenderId: undefined},
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
      const { chatId, messages, tenderId } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        tenderId,
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
export type { Message };

