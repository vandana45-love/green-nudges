import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import CategoryCard from "../CategoryCard";

expect.extend(toHaveNoViolations);

// Recharts uses ResizeObserver which doesn't exist in jsdom — mock the chart components
jest.mock("recharts", () => ({
  AreaChart: ({ children }: any) => <svg data-testid="area-chart">{children}</svg>,
  Area: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Tooltip: () => null,
  defs: () => null,
  linearGradient: () => null,
  stop: () => null,
}));

const SPARK = [{ v: 70 }, { v: 65 }, { v: 80 }, { v: 60 }];

describe("CategoryCard", () => {
  it("renders label", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} colorClass="" />);
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("renders kg value", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} colorClass="" />);
    expect(screen.getByText("350")).toBeInTheDocument();
  });

  it("renders kg CO₂ unit text", () => {
    render(<CategoryCard icon="⚡" label="Energy" kg={200} colorClass="" />);
    expect(screen.getByText(/kg CO/)).toBeInTheDocument();
  });

  it("shows upward trend indicator", () => {
    render(<CategoryCard icon="🍽️" label="Food" kg={175} trend={10} colorClass="" />);
    expect(screen.getByText(/↑.*10%/)).toBeInTheDocument();
  });

  it("shows downward trend indicator", () => {
    render(<CategoryCard icon="🛍️" label="Shopping" kg={80} trend={-5} colorClass="" />);
    expect(screen.getByText(/↓.*5%/)).toBeInTheDocument();
  });

  it("hides trend section when trend is null", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} trend={null} colorClass="" />);
    expect(screen.queryByText(/this month/)).not.toBeInTheDocument();
  });

  it("renders sparkline region when sparkData provided", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} sparkData={SPARK} colorClass="" />);
    expect(screen.getByRole("img", { name: /transport emission trend/i })).toBeInTheDocument();
  });

  it("hides sparkline when sparkData is empty", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} sparkData={[]} colorClass="" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders as article element", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} colorClass="" />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("passes automated accessibility checks", async () => {
    const { container } = render(
      <CategoryCard icon="🚗" label="Transport" kg={350} trend={-5} sparkData={SPARK} colorClass="" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
