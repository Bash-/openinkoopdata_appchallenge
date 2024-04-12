from fastapi import FastAPI
from fastapi import APIRouter

router = APIRouter()

app = FastAPI()

@app.post("/chat")
def chat(request_body: dict):
    message = request_body.get("message")
    return {"message": f"Chat with LLM model: {message}"}
