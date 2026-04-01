SYSTEM_PROMPT = """
You are an expert technical blog writer and educator. Your job is to take provided course notes or topic briefs and generate a comprehensive, deeply detailed technical blog in a strict JSON format.

You MUST return ONLY a valid JSON array containing exactly ONE object with the following keys:

{
  "title": "A compelling, SEO-friendly blog title for the topic",
  
  "content": [
    {
      "title": "SECTION TITLE IN CAPITALS",
      "content": [
        { "type": "text", "value": "Detailed paragraph explaining the concept in depth." },
        { "type": "list", "items": ["Point one", "Point two", "Point three"] },
        { "type": "table", "headers": ["Col1", "Col2", "Col3"], "rows": [["val1", "val2", "val3"]] },
        { "type": "code", "value": "# python code here\nprint('example')" },
        { "type": "formula", "value": "E = mc^2" }
      ]
    }
  ],

  "quiz": {
    "1": {
      "que": "Question text here?",
      "ans": "Correct answer",
      "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"]
    }
  },

  "facts": "5-7 interesting and important facts about the topic as a single string, each fact separated by a period.",

  "summary": "A clear and concise 4-6 sentence summary of the entire blog covering all major concepts.",

  "key_notes": {
    "1": "First key takeaway from the blog.",
    "2": "Second key takeaway from the blog.",
    "3": "Third key takeaway.",
    "4": "Fourth key takeaway.",
    "5": "Fifth key takeaway."
  },

  "imageUrl": null,
  "pdfUrl": []
}

CONTENT GENERATION RULES:

1. The "content" array must have AT LEAST 8-12 well-developed sections covering all aspects of the topic.
2. Each section must be thorough — use a mix of "text", "list", "table", "code", and "formula" types.
3. Every "text" block must be detailed — minimum 4-6 sentences per block, no shallow explanations.
4. Include working, realistic code examples wherever the topic involves programming.
5. Use "formula" blocks for any mathematical expressions — write them in LaTeX notation.
6. Use "table" blocks to compare concepts, algorithms, parameters, or methods side by side.
7. The "quiz" must have exactly 5 questions with 4 options each. The correct answer must always appear as the first option in the options array.
8. The "key_notes" must have exactly 5 entries.
9. The "facts" must contain 5-7 facts as one continuous string.
10. Cover the topic from basics to advanced — assume the reader is a beginner but make the content deep enough for intermediate learners.
11. Explain the WHY behind every concept, not just the WHAT.
12. Add real-world applications, analogies, and examples throughout.

STRICT RULES:
- Return ONLY the JSON array. No explanation, no markdown backticks, no preamble.
- All strings must be properly escaped so the JSON is valid.
- Do NOT add any keys other than the ones specified above.
- Base all content strictly on the provided context/notes.
- Do NOT write lead-in text such as: "Here is...", "Below is...", "Sure...", or any sentence before the JSON.
- Your first character must be '[' and your last character must be ']'.
- If you are about to output anything that is not valid JSON, stop and output a valid JSON array instead.
"""

BUCKET = "studzee-faiss-embedding-aps1-az1--x-s3"
PREFIX = "faiss"


import json
import datetime
import logging
import os
import boto3

from langchain_community.vectorstores import FAISS
from langchain_aws import BedrockEmbeddings, ChatBedrock
from langchain.agents import create_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import tool

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')

BUCKET = "studzee-faiss-store"
PREFIX = "faiss"
# BEDROCK_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
BEDROCK_EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
AWS_REGION = "us-east-1"


# ------------------ GLOBAL CACHE ------------------
vector_store = None
retriever = None


def _extract_text_content(content) -> str:
  """Normalize model output content into plain text."""
  if isinstance(content, str):
    return content

  if isinstance(content, list):
    chunks = []
    for item in content:
      if isinstance(item, str):
        chunks.append(item)
      elif isinstance(item, dict) and item.get("type") == "text":
        chunks.append(item.get("text", ""))
    return "\n".join(chunk for chunk in chunks if chunk)

  return str(content)


def _parse_json_response(raw_text: str):
  """Parse strict JSON output from the model, tolerating fenced code blocks."""
  cleaned = raw_text.strip()

  if cleaned.startswith("```"):
    lines = cleaned.splitlines()
    if len(lines) >= 3:
      cleaned = "\n".join(lines[1:-1]).strip()

  try:
    parsed = json.loads(cleaned)

    # Some model responses are valid JSON strings that contain serialized JSON.
    # Unwrap once more so callers receive a list/dict instead of escaped text.
    if isinstance(parsed, str):
      inner = parsed.strip()
      if inner.startswith("{") or inner.startswith("["):
        try:
          return json.loads(inner), True
        except json.JSONDecodeError:
          return parsed, True

    return parsed, True
  except json.JSONDecodeError:
    # Fallback: extract first JSON object/array from mixed text.
    decoder = json.JSONDecoder()
    for idx, ch in enumerate(cleaned):
      if ch not in "[{":
        continue
      try:
        parsed, _ = decoder.raw_decode(cleaned[idx:])
        if isinstance(parsed, str):
          inner = parsed.strip()
          if inner.startswith("{") or inner.startswith("["):
            try:
              return json.loads(inner), True
            except json.JSONDecodeError:
              pass
        return parsed, True
      except json.JSONDecodeError:
        continue

    logger.warning("Model returned invalid JSON. Returning raw text response.")
    return raw_text, False

# ------------------ LOAD VECTOR STORE ------------------
def load_vector_store():
    global vector_store, retriever

    if vector_store is not None:
        return vector_store

    os.makedirs("/tmp/faiss", exist_ok=True)

    s3.download_file(BUCKET, f"{PREFIX}/index.faiss", "/tmp/faiss/index.faiss")
    s3.download_file(BUCKET, f"{PREFIX}/index.pkl", "/tmp/faiss/index.pkl")

    embeddings = BedrockEmbeddings(
        model_id=BEDROCK_EMBEDDING_MODEL_ID,
        region_name=AWS_REGION
    )

    vector_store = FAISS.load_local(
        "/tmp/faiss",
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 5})

    return vector_store


# ------------------ TOOLS ------------------
@tool
def retrieve_context(query: str) -> str:
    """Search PDF documents and return relevant context for the query."""
    docs = retriever.invoke(query)
    return "\n\n---\n\n".join(d.page_content for d in docs)


search = DuckDuckGoSearchRun()

@tool
def web_search(query: str) -> str:
    """Search the web for latest information."""
    return search.invoke(query)


# ------------------ SYSTEM PROMPT ------------------
# SYSTEM_PROMPT 


# ------------------ LAMBDA HANDLER ------------------
def run(query ):

    load_vector_store()  # IMPORTANT

    bedrock_llm = ChatBedrock(
        model_id=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
        model_kwargs={
           "max_tokens": 50000,  
        "temperature": 0.5,
        "top_p": 0.9,
        }
    )

    agent = create_agent(
        model=bedrock_llm,
        tools=[retrieve_context, web_search],
        system_prompt=SYSTEM_PROMPT
    )

    user_query = query
    # user_query = query

    response = agent.invoke({
        "messages": [
            {"role": "user", "content": user_query}
        ]
    })

    assistant_content = _extract_text_content(response["messages"][-1].content)
    parsed_output, is_valid_json = _parse_json_response(assistant_content)

    return {
        "statusCode": 200,
      "body": parsed_output,
      "is_valid_json": is_valid_json,
      "raw_output": assistant_content
    }