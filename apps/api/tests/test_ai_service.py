"""
Unit tests for the AI recommendation and chat service.
Gemini API calls are mocked to keep tests fast and offline.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ── generate_recommendations ──────────────────────────────────────────────────


class TestGenerateRecommendations:
    @pytest.mark.asyncio
    async def test_returns_three_recommendations_from_gemini(self):
        recs = [
            {"category": "transport", "message": "Use the train.", "savings_kg": 400},
            {"category": "food", "message": "Eat less beef.", "savings_kg": 300},
            {"category": "energy", "message": "Lower thermostat.", "savings_kg": 150},
        ]
        mock_response = MagicMock()
        mock_response.text = json.dumps(recs)

        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get_model.return_value = mock_model

            from services.ai_service import generate_recommendations

            result = await generate_recommendations(200, 100, 175, 67)

        assert len(result) == 3
        assert result[0]["category"] == "transport"

    @pytest.mark.asyncio
    async def test_returns_fallback_when_gemini_raises(self):
        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(
                side_effect=Exception("API error")
            )
            mock_get_model.return_value = mock_model

            from services.ai_service import generate_recommendations

            result = await generate_recommendations(200, 100, 175, 67)

        assert len(result) > 0
        assert all("category" in r for r in result)
        assert all("message" in r for r in result)
        assert all("savings_kg" in r for r in result)

    @pytest.mark.asyncio
    async def test_returns_fallback_on_invalid_json(self):
        mock_response = MagicMock()
        mock_response.text = "Sorry, I cannot help with that."

        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get_model.return_value = mock_model

            from services.ai_service import generate_recommendations

            result = await generate_recommendations(200, 100, 175, 67)

        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_extracts_json_array_from_surrounding_text(self):
        recs = [{"category": "food", "message": "Try veganism.", "savings_kg": 500}]
        mock_response = MagicMock()
        mock_response.text = (
            f"Here are your recommendations: {json.dumps(recs)} Hope that helps!"
        )

        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get_model.return_value = mock_model

            from services.ai_service import generate_recommendations

            result = await generate_recommendations(200, 100, 175, 67)

        assert result[0]["category"] == "food"

    @pytest.mark.asyncio
    async def test_caps_at_three_recommendations(self):
        recs = [
            {"category": "general", "message": f"Tip {i}", "savings_kg": 100}
            for i in range(6)
        ]
        mock_response = MagicMock()
        mock_response.text = json.dumps(recs)

        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_get_model.return_value = mock_model

            from services.ai_service import generate_recommendations

            result = await generate_recommendations(200, 100, 175, 67)

        assert len(result) <= 3


# ── stream_chat ───────────────────────────────────────────────────────────────


class TestStreamChat:
    @pytest.mark.asyncio
    async def test_yields_text_chunks_from_gemini(self):
        async def fake_stream():
            for text in ["Hello ", "world"]:
                chunk = MagicMock()
                chunk.text = text
                yield chunk

        mock_response = MagicMock()
        mock_response.__aiter__ = lambda self: fake_stream()

        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_chat = MagicMock()
            mock_chat.send_message_async = AsyncMock(return_value=mock_response)
            mock_model.start_chat.return_value = mock_chat
            mock_get_model.return_value = mock_model

            from services.ai_service import stream_chat

            chunks = [chunk async for chunk in stream_chat("Hi", [])]

        assert chunks == ["Hello ", "world"]

    @pytest.mark.asyncio
    async def test_passes_history_to_gemini_chat(self):
        async def fake_stream():
            chunk = MagicMock()
            chunk.text = "ok"
            yield chunk

        mock_response = MagicMock()
        mock_response.__aiter__ = lambda self: fake_stream()

        with patch("services.ai_service._get_model") as mock_get_model:
            mock_model = MagicMock()
            mock_chat = MagicMock()
            mock_chat.send_message_async = AsyncMock(return_value=mock_response)
            mock_model.start_chat.return_value = mock_chat
            mock_get_model.return_value = mock_model

            from services.ai_service import stream_chat

            history = [{"role": "user", "content": "Hello"}]
            _ = [chunk async for chunk in stream_chat("Follow-up", history)]

        mock_model.start_chat.assert_called_once()
        call_kwargs = mock_model.start_chat.call_args
        assert "history" in call_kwargs.kwargs or len(call_kwargs.args) > 0
