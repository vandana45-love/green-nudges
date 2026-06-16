const mockGenerateContent = jest.fn();
const mockSendMessageStream = jest.fn();
const mockStartChat = jest.fn(() => ({ sendMessageStream: mockSendMessageStream }));
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
  startChat: mockStartChat,
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(() => ({ getGenerativeModel: mockGetGenerativeModel })),
}));

import { generateRecommendations, streamGeminiChat } from "../gemini";

const MOCK_SURVEY = {
  houseSizeM2: 80,
  occupants: 2,
  heatingType: "gas" as const,
  diet: "omnivore" as const,
  flightsPerYear: 2,
  flightType: "short" as const,
  transportMode: "car" as const,
  vehicleType: "ice" as const,
  energyKg: 1320,
  transportKg: 2439,
  foodKg: 2100,
  shoppingKg: 1000,
  baselineKg: 6859,
};

describe("generateRecommendations", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns parsed recommendations from Gemini", async () => {
    const recs = [
      { category: "transport", message: "Use train", savingsKg: 400 },
      { category: "food", message: "Eat less meat", savingsKg: 300 },
      { category: "energy", message: "Lower thermostat", savingsKg: 150 },
    ];
    mockGenerateContent.mockResolvedValue({ response: { text: () => JSON.stringify(recs) } });
    const result = await generateRecommendations(MOCK_SURVEY);
    expect(result).toHaveLength(3);
    expect(result[0].category).toBe("transport");
  });

  it("returns all recommendations from Gemini when API responds successfully", async () => {
    const recs = Array.from({ length: 3 }, (_, i) => ({
      category: "general",
      message: `Tip ${i}`,
      savingsKg: 100,
    }));
    mockGenerateContent.mockResolvedValue({ response: { text: () => JSON.stringify(recs) } });
    const result = await generateRecommendations(MOCK_SURVEY);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("category");
  });

  it("returns fallback recommendations when Gemini throws", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API error"));
    const result = await generateRecommendations(MOCK_SURVEY);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("category");
    expect(result[0]).toHaveProperty("message");
    expect(result[0]).toHaveProperty("savingsKg");
  });

  it("returns fallback when JSON parsing fails", async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => "not json" } });
    const result = await generateRecommendations(MOCK_SURVEY);
    expect(result.length).toBeGreaterThan(0);
  });

  it("extracts JSON array from response text with surrounding text", async () => {
    const recs = [{ category: "food", message: "Eat vegan", savingsKg: 200 }];
    mockGenerateContent.mockResolvedValue({
      response: { text: () => `Here are your recs: ${JSON.stringify(recs)} Hope this helps!` },
    });
    const result = await generateRecommendations(MOCK_SURVEY);
    expect(result.some((r: { category: string }) => r.category === "food")).toBe(true);
  });
});

describe("no API key", () => {
  it("streamGeminiChat yields not-configured message when KEY is absent", async () => {
    let streamFn: typeof streamGeminiChat;
    const original = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ streamGeminiChat: streamFn } = require("../gemini"));
    });
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = original;
    const chunks: string[] = [];
    for await (const chunk of streamFn!("Hi", [])) {
      chunks.push(chunk);
    }
    expect(chunks[0]).toMatch(/not configured/i);
  });

  it("generateRecommendations returns fallback when KEY is absent", async () => {
    let genRecsFn: typeof generateRecommendations;
    const original = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ generateRecommendations: genRecsFn } = require("../gemini"));
    });
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = original;
    const result = await genRecsFn!(MOCK_SURVEY);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("category");
  });
});

describe("streamGeminiChat", () => {
  afterEach(() => jest.clearAllMocks());

  it("yields text chunks from Gemini stream", async () => {
    const fakeStream = (async function* () {
      yield { text: () => "Hello " };
      yield { text: () => "" };
      yield { text: () => "world" };
    })();
    mockSendMessageStream.mockResolvedValue({ stream: fakeStream });

    const chunks: string[] = [];
    for await (const chunk of streamGeminiChat("Hi", [])) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(["Hello ", "world"]);
  });

  it("yields error message when Gemini throws", async () => {
    mockSendMessageStream.mockRejectedValue(new Error("Network error"));
    const chunks: string[] = [];
    for await (const chunk of streamGeminiChat("Hi", [])) {
      chunks.push(chunk);
    }
    expect(chunks[0]).toMatch(/error/i);
  });

  it("passes conversation history to Gemini", async () => {
    const fakeStream = (async function* () { yield { text: () => "ok" }; })();
    mockSendMessageStream.mockResolvedValue({ stream: fakeStream });
    const history = [{ role: "user", content: "Previous message" }];
    for await (const _ of streamGeminiChat("New message", history)) { /* drain */ }
    expect(mockStartChat).toHaveBeenCalledWith(
      expect.objectContaining({ history: expect.any(Array) })
    );
  });

  it("maps assistant history role to model for Gemini API", async () => {
    const fakeStream = (async function* () { yield { text: () => "ok" }; })();
    mockSendMessageStream.mockResolvedValue({ stream: fakeStream });
    const history = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    for await (const _ of streamGeminiChat("Follow up", history)) { /* drain */ }
    const calls = mockStartChat.mock.calls as unknown as Array<[{ history: Array<{ role: string }> }]>;
    expect(calls[0][0].history[1].role).toBe("model");
  });

  it("yields fallback message when a non-Error is thrown", async () => {
    mockSendMessageStream.mockRejectedValue("string error");
    const chunks: string[] = [];
    for await (const chunk of streamGeminiChat("Hi", [])) {
      chunks.push(chunk);
    }
    expect(chunks[0]).toMatch(/Could not connect to Gemini/i);
  });
});
