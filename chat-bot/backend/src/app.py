import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from query_engine import QueryEngine

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="CDP Support Agent API")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Define request and response models
class QueryRequest(BaseModel):
    query: str

class SearchResult(BaseModel):
    score: float
    chunk_text: str
    title: str
    url: str
    cdp: str

class QueryResponse(BaseModel):
    answer: str
    context: List[SearchResult]
    query_type: str

# Initialize the query engine
try:
    query_engine = QueryEngine()
    logger.info("Query engine initialized successfully")
except Exception as e:
    logger.error(f"Error initializing query engine: {str(e)}")
    raise

@app.get("/")
async def root():
    return {"message": "CDP Support Agent API is running"}

@app.post("/api/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    try:
        logger.info(f"Received query: {request.query}")
        result = query_engine.answer_question(request.query)
        logger.info(f"Query processed successfully, type: {result['query_type']}")
        return result
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Run with: uvicorn app:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)