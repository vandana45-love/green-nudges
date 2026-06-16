import { calculateCarbon } from "../carbon";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "TIMESTAMP"),
}));

jest.mock("../firebase", () => ({ db: {} }));

import { getSurvey, saveSurvey, getRecommendations, saveRecommendations } from "../firestore";
import * as firestoreModule from "firebase/firestore";

const MOCK_SURVEY = {
  houseSizeM2: 80,
  occupants: 2,
  heatingType: "gas",
  diet: "omnivore",
  flightsPerYear: 2,
  flightType: "short",
  transportMode: "car",
  vehicleType: "ice",
  ...calculateCarbon({ houseSizeM2: 80, occupants: 2, heatingType: "gas", diet: "omnivore", flightsPerYear: 2, flightType: "short", transportMode: "car", vehicleType: "ice" }),
};

describe("firestore helpers", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getSurvey", () => {
    it("returns null when document does not exist", async () => {
      (firestoreModule.getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
      const result = await getSurvey("uid-123");
      expect(result).toBeNull();
    });

    it("returns survey data when document exists", async () => {
      (firestoreModule.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => MOCK_SURVEY,
      });
      const result = await getSurvey("uid-123");
      expect(result).toMatchObject({ diet: "omnivore" });
    });
  });

  describe("saveSurvey", () => {
    it("calls setDoc and returns calculated breakdown", async () => {
      (firestoreModule.setDoc as jest.Mock).mockResolvedValue(undefined);
      const input = { houseSizeM2: 80, occupants: 2, heatingType: "gas", diet: "vegan", flightsPerYear: 0, flightType: "short", transportMode: "bicycle", vehicleType: "none" };
      const result = await saveSurvey("uid-123", input);
      expect(firestoreModule.setDoc).toHaveBeenCalledTimes(1);
      expect(result.baselineKg).toBeGreaterThan(0);
      expect(result.foodKg).toBe(1300); // vegan
    });
  });

  describe("getRecommendations", () => {
    it("returns empty array when no recommendations doc", async () => {
      (firestoreModule.getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
      const result = await getRecommendations("uid-123");
      expect(result).toEqual([]);
    });

    it("returns items array from document", async () => {
      const items = [{ category: "transport", message: "Walk more", savingsKg: 200 }];
      (firestoreModule.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ items }),
      });
      const result = await getRecommendations("uid-123");
      expect(result).toEqual(items);
    });
  });

  describe("saveRecommendations", () => {
    it("calls setDoc with items array", async () => {
      (firestoreModule.setDoc as jest.Mock).mockResolvedValue(undefined);
      const items = [{ category: "food", message: "Eat less beef", savingsKg: 300 }];
      await saveRecommendations("uid-123", items);
      expect(firestoreModule.setDoc).toHaveBeenCalledTimes(1);
      const callArg = (firestoreModule.setDoc as jest.Mock).mock.calls[0][1];
      expect(callArg.items).toEqual(items);
    });
  });
});
