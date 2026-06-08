from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent

app = FastAPI(title="InstaMART AI Agent API")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
  allow_methods=["*"], allow_headers=["*"])

class SearchRequest(BaseModel):
    query: str
    city: str = "Mumbai"

class SearchResponse(BaseModel):
    result: str
    products: list[dict] = []

@app.post("/search", response_model=SearchResponse)
async def search_products(req: SearchRequest):
    result = await run_agent(f"Search for '{req.query}' on InstaMART in {req.city}")
    return SearchResponse(result=result)

@app.get("/health")
async def health():
    return {"status": "ok"}