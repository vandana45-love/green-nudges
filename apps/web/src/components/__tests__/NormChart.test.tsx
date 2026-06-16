import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import NormChart from "../NormChart";

expect.extend(toHaveNoViolations);

describe("NormChart", () => {
  it("renders the comparison heading", () => {
    render(<NormChart userKg={400} />);
    expect(screen.getByText("How you compare")).toBeInTheDocument();
  });

  it("renders all three bar labels", () => {
    render(<NormChart userKg={400} />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Average users")).toBeInTheDocument();
    expect(screen.getByText("National average")).toBeInTheDocument();
  });

  it("displays user kg value", () => {
    render(<NormChart userKg={500} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it("uses default avgKg=710 and nationalKg=780", () => {
    render(<NormChart userKg={600} />);
    expect(screen.getByText(/710/)).toBeInTheDocument();
    expect(screen.getByText(/780/)).toBeInTheDocument();
  });

  it("renders three progressbars", () => {
    render(<NormChart userKg={400} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
  });

  it("progressbars have aria-valuenow attributes", () => {
    render(<NormChart userKg={400} />);
    const bars = screen.getAllByRole("progressbar");
    bars.forEach((bar) => {
      expect(bar).toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
    });
  });

  it("section has accessible label", () => {
    render(<NormChart userKg={400} />);
    expect(
      screen.getByRole("region", { name: /carbon footprint comparison/i })
    ).toBeInTheDocument();
  });

  it("renders footer note about data", () => {
    render(<NormChart userKg={400} />);
    expect(screen.getByText(/monthly kg co/i)).toBeInTheDocument();
  });

  it("passes automated accessibility checks", async () => {
    const { container } = render(
      <NormChart userKg={400} avgKg={710} nationalKg={780} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
