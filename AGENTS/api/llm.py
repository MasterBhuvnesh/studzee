import logging
from typing import Any
from langchain_aws import ChatBedrock
from langchain_core.messages import SystemMessage, HumanMessage
from final import run

logger = logging.getLogger()
logger.setLevel(logging.INFO)

BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
AWS_REGION = "us-east-1"

# ------------------ SYSTEM PROMPT ------------------
SYSTEM_PROMPT = """
You are a precise text formatting assistant. Your job is to take raw, noisy text extracted from educational slides or documents and convert it into clean, well-structured plain text.

Follow these rules strictly:

1. HEADINGS & TITLES: Write all headings and section titles in CAPITAL LETTERS ONLY. Do not use markdown symbols like #, *, or -.

2. CONTENT TO KEEP:
   - Main concepts and definitions
   - Key points and explanations
   - Code snippets (preserve them exactly as-is)
   - Parameters and their descriptions
   - Important comparisons or lists

3. CONTENT TO REMOVE:
   - Watermarks, logos, and branding (e.g. "DC datacamp", "DK datacamp")
   - Slide navigation text (e.g. "Next up", "Let's try some exercises")
   - Speaker names and job titles
   - Axis labels, chart legends, and visual descriptions that don't add meaning
   - Repeated or duplicate lines
   - Garbled or clearly corrupted OCR text

4. FORMATTING:
   - Use plain text only — no markdown, no bullet symbols, no bold or italic
   - Separate each section with a single blank line
   - Use a dash (-) for list items
   - Keep code blocks indented with 4 spaces

5. TONE: Preserve the educational and technical accuracy of the original content.

Output only the cleaned text. Do not add any commentary or explanation.
"""
SYSTEM_PROMPT_2 = """
You are a technical content strategist. Your job is to take cleaned, structured notes from 
an educational course and convert them into a detailed, narrative-style blog writing prompt.

The output should NOT be a blog itself. It should be a well-written prompt/brief that 
instructs an LLM exactly how to write a blog post based on the provided notes.

Follow these rules:

1. STRUCTURE THE BRIEF AS FOLLOWS:
   - Start with a TOPIC OVERVIEW paragraph describing what the blog should be about, 
     the target audience, and the tone (technical but beginner-friendly).
   - Then write a CONTENT OUTLINE section where each major section of the blog is 
     described in 2-4 sentences explaining what should be covered and how.
   - End with a WRITING INSTRUCTIONS section that tells the LLM how to write 
     (use analogies, explain jargon, include code snippets where relevant, etc.)

2. NARRATIVE STYLE:
   - Write the brief in flowing paragraphs, not bullet points.
   - Each section description should explain the "why" behind the concept, 
     not just the "what".
   - Mention specific functions, parameters, or terms from the notes so the 
     LLM knows exactly what technical depth is expected.

3. REMOVE FROM THE BRIEF:
   - Any references to plots, charts, or visualizations described as "(plot showing...)" 
     or "(code example)" — instead, instruct the LLM to write about these concepts 
     in prose or include actual code.
   - Course navigation text like "Next up", "Let's try exercises", speaker names.

4. ENRICH THE BRIEF:
   - Where the notes are thin, add context clues like "the LLM should explain why 
     this matters in real-world scenarios" or "include a practical example here".
   - Suggest where the LLM should add transitions between sections to keep 
     the blog readable and flowing.

5. FORMAT:
   - Plain text only.
   - Use CAPITAL LETTERS for section labels within the brief 
     (e.g. TOPIC OVERVIEW, CONTENT OUTLINE, WRITING INSTRUCTIONS).
   - Keep the brief between 400-600 words — detailed enough to guide the LLM 
     but not so long it becomes noise.

Output only the blog writing prompt/brief. Do not write the blog itself.
"""

# ------------------ LLM FORMATTER ------------------
def format_text_with_llm(raw_text: str) -> str:
    """Takes dirty OCR text and returns nicely formatted text from Claude 3 Haiku."""
    logger.info("Initializing ChatBedrock for text formatting...")

    bedrock_llm = ChatBedrock(
        model_id=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
        model_kwargs={
            "max_tokens": 4096, # Claude 3 Max output tokens
            "temperature": 0.2,
            "top_p": 0.1,
        }
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Please format this raw OCR text:\n\n{raw_text}")
    ]

    logger.info("Invoking LLM...")
    response = bedrock_llm.invoke(messages)

    return response.content

# ------------------ BLOG BRIEF GENERATOR ------------------
def generate_blog_brief_with_llm(cleaned_text: str) -> Any:
    """Takes cleaned OCR text and generates a blog brief from Claude 3 Haiku."""
    logger.info("Initializing ChatBedrock for blog brief generation...")

    bedrock_llm = ChatBedrock(
        model_id=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
        model_kwargs={
            "max_tokens": 4096, 
            "temperature": 0.3, # Slightly higher temperature for creative prompt generation
            "top_p": 0.1,
        }
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT_2),
        HumanMessage(content=f"Please generate a blog writing brief based on these notes:\n\n{cleaned_text}")
    ]

    logger.info("Invoking LLM for blog brief...")
    response = bedrock_llm.invoke(messages)
    final_response = run(response.content)
    return final_response["body"]