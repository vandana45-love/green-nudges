import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

const mockSignInWithGoogle = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signOut: jest.fn(),
    getToken: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

import SignInPage from "../sign-in/page";

describe("SignInPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the welcome heading", () => {
    render(<SignInPage />);
    expect(screen.getByText("Welcome to Green Nudges")).toBeInTheDocument();
  });

  it("renders the Google sign-in button", () => {
    render(<SignInPage />);
    const btn = screen.getByRole("button", { name: /continue with google/i });
    expect(btn).toBeInTheDocument();
  });

  it("button is visible and enabled", () => {
    render(<SignInPage />);
    const btn = screen.getByRole("button", { name: /continue with google/i });
    expect(btn).not.toBeDisabled();
  });

  it("renders subtitle about carbon tracking", () => {
    render(<SignInPage />);
    expect(screen.getByText(/track your carbon footprint with ai/i)).toBeInTheDocument();
  });

  it("calls signInWithGoogle on button click", async () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);
    render(<SignInPage />);
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1));
  });

  it("shows powered by Google text", () => {
    render(<SignInPage />);
    expect(screen.getByText(/powered by google/i)).toBeInTheDocument();
  });

  it("passes automated accessibility checks", async () => {
    const { container } = render(<SignInPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
