import os
import time

from dotenv import load_dotenv
from google import genai


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not configured")


client = genai.Client(
    api_key=GEMINI_API_KEY
)


GEMINI_MODEL = "gemini-3.5-flash-lite"

def generate_answer(
    question: str,
    context: str
) -> str:

    prompt = f"""
You are a document question-answering assistant.

Answer the user's question using ONLY the information
provided in the context below.

If the answer cannot be found in the context,
say:

"I couldn't find the answer in the uploaded documents."

Do not make up information.

Context:
----------------
{context}
----------------

User Question:
{question}

Answer clearly and concisely.
"""

    max_retries = 3

    for attempt in range(max_retries):

        try:

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )

            return response.text

        except Exception as e:

            error_message = str(e)

            # Retry only temporary service availability errors
            if "503" not in error_message and "UNAVAILABLE" not in error_message:
                raise

            if attempt == max_retries - 1:
                raise Exception(
                    "Gemini service is currently unavailable. "
                    "Please try again later."
                )

            wait_time = 2 ** attempt

            print(
                f"Gemini unavailable. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)