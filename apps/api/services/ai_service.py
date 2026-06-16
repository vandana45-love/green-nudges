import json
from openai import AsyncOpenAI
from config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = """You are a personal carbon coach for the Green Nudges platform.
You help users understand and reduce their carbon footprint.
Be concise, specific, and encouraging. Always quantify CO2 savings when possible.
Respond in plain text — no markdown headers."""


async def generate_recommendations(
    transport_kg: float,
    energy_kg: float,
    food_kg: float,
    shopping_kg: float,
    prev_transport_kg: float | None = None,
    prev_energy_kg: float | None = None,
) -> list[dict]:
    """Return 3 ranked recommendations as a list of {category, message, savings_kg}."""
    context = f"""
User monthly emissions:
- Transport: {transport_kg:.0f} kg CO2
- Energy: {energy_kg:.0f} kg CO2
- Food: {food_kg:.0f} kg CO2
- Shopping: {shopping_kg:.0f} kg CO2
Total: {transport_kg + energy_kg + food_kg + shopping_kg:.0f} kg CO2
"""
    if prev_transport_kg:
        delta = transport_kg - prev_transport_kg
        context += f"\nTransport changed by {delta:+.0f} kg vs last month."
    if prev_energy_kg:
        delta = energy_kg - prev_energy_kg
        context += f"\nEnergy changed by {delta:+.0f} kg vs last month."

    context += """
Return exactly 3 recommendations as a JSON array with keys:
  category (transport|energy|food|shopping), message (1-2 sentences), savings_kg (number).
Sort by highest savings_kg first. Output JSON only, no other text."""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": context},
        ],
        temperature=0.7,
        max_tokens=400,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    parsed = json.loads(raw)
    recs = parsed.get("recommendations", parsed) if isinstance(parsed, dict) else parsed
    if not isinstance(recs, list):
        recs = []
    return recs[:3]


async def stream_chat(message: str, history: list[dict]):
    """Yield token chunks for the chat assistant."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history[-10:]:  # keep last 10 turns for context
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=600,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
