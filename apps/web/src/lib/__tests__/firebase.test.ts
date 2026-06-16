jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({ name: "[DEFAULT]" })),
  getApps: jest.fn(() => []),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({ type: "firestore" })),
}));

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import app, { auth, db } from "../firebase";

describe("firebase initialisation", () => {
  it("exports a default app", () => {
    expect(app).toBeDefined();
  });

  it("exports auth", () => {
    expect(auth).toBeDefined();
  });

  it("exports db", () => {
    expect(db).toBeDefined();
  });

  it("calls initializeApp exactly once when no prior app exists", () => {
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it("calls getAuth with the initialised app", () => {
    expect(getAuth).toHaveBeenCalledWith(app);
  });

  it("calls getFirestore with the initialised app", () => {
    expect(getFirestore).toHaveBeenCalledWith(app);
  });

  it("reuses existing app when getApps returns one", () => {
    jest.resetModules();
    const fakeApp = { name: "[DEFAULT]" };
    jest.doMock("firebase/app", () => ({
      initializeApp: jest.fn(),
      getApps: jest.fn(() => [fakeApp]),
    }));
    jest.doMock("firebase/auth", () => ({ getAuth: jest.fn(() => ({})) }));
    jest.doMock("firebase/firestore", () => ({ getFirestore: jest.fn(() => ({})) }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { initializeApp: init2 } = require("firebase/app");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../firebase");
    expect(init2).not.toHaveBeenCalled();
  });
});
