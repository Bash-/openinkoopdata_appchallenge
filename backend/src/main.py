import os

from chain import get_chain
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from handler import send_message
from langchain.callbacks import AsyncIteratorCallbackHandler
from pydantic_models import OpenAIRequest

app = FastAPI()

_ = load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


@app.post("/chat/completions")
async def reply(req: OpenAIRequest) -> StreamingResponse:
    if req.stream:
        callback = AsyncIteratorCallbackHandler()
        chain = get_chain(model_callback=callback)

        history = req.messages[:-1]
        message = req.messages[-1]

        return StreamingResponse(
            send_message(
                chain,
                query=message.content,
                callback=callback,
            ),
            media_type="text/event-stream",
        )
