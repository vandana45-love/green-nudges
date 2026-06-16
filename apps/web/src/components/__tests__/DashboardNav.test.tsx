import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

const mockSignOut = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: jest.fn(() => ({
    user: null,
    signOut: mockSignOut,
  })),
}));

// next/link just renders an <a>
jest.mock("next/link", () => {
  const Link = ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  );
  Link.displayName = "Link";
  return Link;
});

import DashboardNav from "../DashboardNav";
import { useAuth } from "@/lib/auth";

const mockUseAuth = useAuth as jest.Mock;

describe("DashboardNav", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the brand name", () => {
    render(<DashboardNav />);
    expect(screen.getByText("Green Nudges")).toBeInTheDocument();
  });

  it("renders all 4 nav links", () => {
    render(<DashboardNav />);
    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /planner/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ai coach/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chat/i })).toBeInTheDocument();
  });

  it("nav links have correct hrefs", () => {
    render(<DashboardNav />);
    expect(screen.getByRole("link", { name: /overview/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /planner/i })).toHaveAttribute("href", "/dashboard/planner");
    expect(screen.getByRole("link", { name: /chat/i })).toHaveAttribute("href", "/dashboard/chat");
  });

  it("renders sign out button", () => {
    render(<DashboardNav />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls signOut and redirects to / on sign out click", async () => {
    mockSignOut.mockResolvedValue(undefined);
    render(<DashboardNav />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows user displayName and email when logged in", () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: "Alice Green", email: "alice@example.com", photoURL: null },
      signOut: mockSignOut,
    });
    render(<DashboardNav />);
    expect(screen.getByText("Alice Green")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("shows user avatar image when photoURL is set", () => {
    mockUseAuth.mockReturnValue({
      user: { displayName: "Alice", email: "alice@example.com", photoURL: "https://example.com/photo.jpg" },
      signOut: mockSignOut,
    });
    const { container } = render(<DashboardNav />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
  });

  it("does not show user section when not logged in", () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: mockSignOut });
    render(<DashboardNav />);
    expect(screen.queryByText(/alice/i)).not.toBeInTheDocument();
  });

  it("passes automated accessibility checks", async () => {
    const { container } = render(<DashboardNav />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
