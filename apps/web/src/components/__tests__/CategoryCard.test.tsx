import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import CategoryCard from "../CategoryCard";

expect.extend(toHaveNoViolations);

jest.mock("recharts", () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <svg data-testid="area-chart">{children}</svg>,
  Area: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ formatter, labelFormatter }: {
    formatter?: (v: number) => [string, string];
    labelFormatter?: () => string;
  }) => {
    const val = formatter ? formatter(100) : null;
    const label = labelFormatter ? labelFormatter() : null;
    return (
      <div data-testid="tooltip">
        {val && <span>{val[0]}</span>}
        {label !== null && <span>{label}</span>}
      </div>
    );
  },
  defs: () => null,
  linearGradient: () => null,
  stop: () => null,
}));

const SPARK = [{ v: 70 }, { v: 65 }, { v: 80 }, { v: 60 }];

describe("CategoryCard", () => {
  it("renders label", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} />);
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("renders kg value", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} />);
    expect(screen.getByText("350")).toBeInTheDocument();
  });

  it("renders kg CO₂ unit text", () => {
    render(<CategoryCard icon="⚡" label="Energy" kg={200} />);
    expect(screen.getByText(/kg CO/)).toBeInTheDocument();
  });

  it("shows upward trend indicator", () => {
    render(<CategoryCard icon="🍽️" label="Food" kg={175} trend={10} />);
    expect(screen.getByText(/↑.*10%/)).toBeInTheDocument();
  });

  it("shows downward trend indicator", () => {
    render(<CategoryCard icon="🛍️" label="Shopping" kg={80} trend={-5} />);
    expect(screen.getByText(/↓.*5%/)).toBeInTheDocument();
  });

  it("hides trend section when trend is null", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} trend={null} />);
    expect(screen.queryByText(/this month/)).not.toBeInTheDocument();
  });

  it("renders sparkline region when sparkData provided", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} sparkData={SPARK} />);
    expect(screen.getByRole("img", { name: /transport emission trend/i })).toBeInTheDocument();
  });

  it("hides sparkline when sparkData is empty", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} sparkData={[]} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("tooltip formatter returns kg-formatted value", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} sparkData={SPARK} />);
    expect(screen.getByText("100 kg")).toBeInTheDocument();
  });

  it("renders as article element", () => {
    render(<CategoryCard icon="🚗" label="Transport" kg={350} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("passes automated accessibility checks", async () => {
    const { container } = render(
      <CategoryCard icon="🚗" label="Transport" kg={350} trend={-5} sparkData={SPARK} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
