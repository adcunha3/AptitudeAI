import cohere
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Cohere client
API_KEY = os.getenv("CO_API_KEY")
co = cohere.Client(API_KEY)
# Example interview response

FIRST_QUESTION = "Tell me about yourself."

def evaluate_response(response):
    """Analyzes an interview response, provides feedback, an improved example, and a follow-up question."""
    
    prompt = f"""
    Evaluate the following interview response: "{response}".

    **1. Provide structured feedback** based on:
    - Clarity (Is it well-structured?)
    - Confidence (Does it sound self-assured?)
    - Relevance (Does it fully answer the question?)
    - Technical Depth (Does it show expertise?)

    End after generating the feedback. Do not generate additional content.**
    """
    
    cohere_response = co.generate(
        model="command-r-plus",
        prompt=prompt,
        max_tokens=300
    )

    return cohere_response.generations[0].text

def generate_example_response(response):
    """Generates a well-structured example response based on the user's answer."""
    
    prompt = f"""
    Improve the following interview response while keeping it professional, structured, and detailed.

    Original Response: "{response}"

    **Improved Example Response:**
    """

    cohere_response = co.generate(
        model="command-r-plus",
        prompt=prompt,
        max_tokens=200
    )
    
    return cohere_response.generations[0].text.strip()


def generate_follow_up_question(response):
    """Generates a follow-up question based on the user's response."""
    
    prompt = f"""
    Based on the following interview response, generate a relevant follow-up question to explore the candidate's skills further.

    Response: "{response}"

    Ensure the question is engaging and logical.

    End after generating the question. Do not generate additional content.

    """
    
    cohere_response = co.generate(
        model="command-r-plus",
        prompt=prompt,
        max_tokens=50
    )

    return cohere_response.generations[0].text.strip()

# # Example usage
# user_response = "My name is Adam and I and a software engineer. I have experience in full stack development and worked on multiple projects."
# feedback = evaluate_response(user_response)
# print(feedback)