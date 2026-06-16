"""AI recommendation and chat service backed by Google Gemini 2.0 Flash."""
import json
import logging
import re
from typing import AsyncIterator

import google.generativeai as genai

from config import settings

logger = logging.getLogger(__name__)

if not settings.gemini_api_key:
    logger.warning("GEMINI_API_KEY not configured — AI features will return fallback responses")
else:
    genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are a personal carbon coach for the Green Nudges platform.
Help users understand and reduce their carbon footprint.
Be concise, specific, and encouraging. Quantify CO2 savings when possible.
Respond in plain text — no markdown headers."""


def _get_model():
    return genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
    )


async def generate_recommendations(
    transport_kg: float,
    energy_kg: float,
    food_kg: float,
    shopping_kg: float,
) -> list[dict[str, object]]:
    prompt = f"""
User monthly emissions:
- Transport: {transport_kg:.0f} kg CO2
- Energy: {energy_kg:.0f} kg CO2
- Food: {food_kg:.0f} kg CO2
- Shopping: {shopping_kg:.0f} kg CO2
Total: {transport_kg + energy_kg + food_kg + shopping_kg:.0f} kg CO2

Return exactly 3 recommendations as a JSON array (no other text):
[{{"category": "transport|energy|food|shopping", "message": "...", "savings_kg": 0}}]
Sort by highest savings_kg first."""

    model = _get_model()
    response = await model.generate_content_async(prompt)
    text = response.text.strip()
    match = re.search(r"\[[\s\S]*\]", text)
    if match:
        try:
            return json.loads(match.group())[:3]
        except json.JSONDecodeError:
            pass
    return [
        {"category": "transport", "message": "Switch one weekly car trip to public transport.", "savings_kg": 200},
        {"category": "food", "message": "Try 2 plant-based days per week.", "savings_kg": 300},
        {"category": "energy", "message": "Lower thermostat by 1°C and switch to LEDs.", "savings_kg": 150},
    ]


async def stream_chat(message: str, history: list[dict[str, str]]) -> AsyncIterator[str]:
    model = _get_model()
    chat = model.start_chat(
        history=[
            {
                "role": h["role"] if h["role"] == "user" else "model",
                "parts": [h["content"]],
            }
            for h in history[-10:]
        ]
    )
    response = await chat.send_message_async(message, stream=True)
    async for chunk in response:
        if chunk.text:
            yield chunk.text
