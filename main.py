from fastapi import FastAPI
from pydantic import BaseModel
import os
from openai import OpenAI
from fastapi.responses import JSONResponse

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="WITH Backend")

class ClassifyInput(BaseModel):
    text: str

class RespondInput(BaseModel):
    text: str
    state: str

@app.get("/")
def health():
    return {"status": "WITH online"}

@app.post("/classify")
def classify(data: ClassifyInput):
    prompt = f"""
Return ONLY one word:
elevated, normal, or critical.

Text:
{data.text}
"""
    r = client.responses.create(model="gpt-4.1-mini", input=prompt)
    state = r.output_text.strip().lower()
    if state not in ["elevated", "critical"]:
        state = "normal"
    return JSONResponse(
    content={"state": state},
    media_type="application/json; charset=utf-8"
)


@app.post("/respond")
def respond(data: RespondInput):
    prompt = f"""
You are WITH.

Rules:
- Speak like a human, not a script.
- Max 2 short sentences.
- Never say "relax" or "calm down".
- Do not give advice.
- Ask ONE question that avoids impulsive action.

User state: {data.state}
User text: {data.text}
"""
    r = client.responses.create(model="gpt-4.1-mini", input=prompt)
    return JSONResponse(
    content={"reply": r.output_text.strip()},
    media_type="application/json; charset=utf-8"
)
