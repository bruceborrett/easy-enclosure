import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import App from "./App";

vi.mock("./Renderer", () => ({ Renderer: () => <div>Renderer</div> }));
vi.mock("./ParamForm", () => ({ ParamsForm: () => <div>ParamsForm</div> }));
vi.mock("./Tools", () => ({ Tools: () => <div>Tools</div> }));
vi.mock("./Funding", () => ({ Funding: () => <div>Funding</div> }));
vi.mock("./LoadingIndicator", () => ({
  LoadingIndicator: () => <div>LoadingIndicator</div>,
}));

describe("App", () => {
  test("renders core UI modules", () => {
    render(<App />);

    expect(screen.getByText("Renderer")).toBeInTheDocument();
    expect(screen.getByText("ParamsForm")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Funding")).toBeInTheDocument();
    expect(screen.getByText("LoadingIndicator")).toBeInTheDocument();
  });

  test("renders version when provided", () => {
    vi.stubEnv("VITE_APP_VERSION", "9.9.9");

    render(<App />);

    expect(screen.getByText("v9.9.9")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });
});
