import cohere
import os

# Initialize Cohere client

API_KEY = "vmrGwSEmWGVyFmIfG5cvRXfKCwShdFzCLEzNEueA"  # Replace with your real key
co = cohere.Client(API_KEY)
# Example interview response
def evaluate_response(response):
    """Analyzes interview responses with structured feedback."""
    
    prompt = f"""
    Evaluate the following interview response: "{response}".

    **1. Provide structured feedback** based on:
    - Clarity (Is it well-structured?)
    - Confidence (Does it sound self-assured?)
    - Relevance (Does it fully answer the question?)
    - Technical Depth (Does it show expertise?)

    **2. Generate a complete and well-structured example response** that fully improves on the given answer. 
    Ensure the example response is clear, detailed, and **fully written** before stopping.

    **End the response properly after generating the example. Do not leave it incomplete.**
    """
    
    cohere_response = co.generate(
        model="command-r-plus",
        prompt=prompt,
        max_tokens=250
    )

    return cohere_response.generations[0].text

# Example usage
user_response = "My name is Adam and I and a software engineer. I have experience in AI and worked on multiple machine learning projects."
feedback = evaluate_response(user_response)
print(feedback)