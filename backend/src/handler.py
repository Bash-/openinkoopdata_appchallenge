# https://gist.github.com/ninely/88485b2e265d852d3feb8bd115065b1a?permalink_comment_id=4601367
import asyncio
import json
import os
from typing import AsyncIterable, Awaitable

from dotenv import load_dotenv
from fastapi import FastAPI
from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.schema import HumanMessage
from langchain_core.runnables import RunnableLambda, RunnableParallel


async def send_message(chain: RunnableParallel, query: str, callback: AsyncIteratorCallbackHandler) -> AsyncIterable[str]:
    async def wrap_done(fn: Awaitable, event: asyncio.Event):
        """Wrap an awaitable with a event to signal when it's done or an exception is raised."""
        try:
            await fn
        except Exception as e:
            # TODO: handle exception
            print(f"Caught exception: {e}")
        finally:
            # Signal the aiter to stop.
            event.set()

    # Begin a task that runs in the background.
    task = asyncio.create_task(
        wrap_done(chain.ainvoke(query), callback.done),
    )


    make_content = lambda x: json.dumps({"choices": [{"delta": {"content": x}}]})
    async for token in callback.aiter():
        # Use server-sent-events to stream the response
        # yield f"data: {token}\n\n"
        yield f'data: {make_content(token)}\n\n'

    await task
