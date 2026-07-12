import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TimetableGrid from "./TimetableGrid";

// Regression coverage for a real bug hit this session: the grid silently
// showed every cell as "-" because the Time field arrived mojibake-corrupted
// ("08:30â€“09:25" instead of "08:30–09:25"), so it never matched any
// timeSlots entry. These tests exercise the actual day/time matching logic,
// not just that the component renders.

const timeSlots = ["08:30-09:25", "09:25-10:20", "10:30-11:25"];

const schedule = [
  {
    Day: "Monday",
    Time: "08:30–09:25", // en dash, matching what the Python backend emits
    Faculty: "Dr. Test",
    Course: "Statistics",
    "Div/Batch": "A11",
    Type: "Tutorial",
    Room: "D011",
  },
];

describe("TimetableGrid", () => {
  it("renders Day as the row header and time slots as columns (transposed layout)", () => {
    render(<TimetableGrid schedule={[]} timeSlots={timeSlots} />);

    const headerRow = screen.getAllByRole("row")[0];
    expect(headerRow).toHaveTextContent("Day");
    expect(headerRow).toHaveTextContent("08:30-09:25");
    expect(headerRow).toHaveTextContent("09:25-10:20");

    // Each day appears as its own row, not a column.
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Saturday")).toBeInTheDocument();
  });

  it("populates a cell when a session's Time matches a real en-dash-separated slot", () => {
    render(<TimetableGrid schedule={schedule} timeSlots={timeSlots} />);

    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Dr. Test")).toBeInTheDocument();
    expect(screen.getByText("A11")).toBeInTheDocument();
  });

  it("shows a dash for slots with no session (does not silently blank out)", () => {
    render(<TimetableGrid schedule={schedule} timeSlots={timeSlots} />);

    const dashes = screen.getAllByText("-");
    // 6 days x 3 slots = 18 cells, minus the 1 populated one = 17 empty.
    expect(dashes.length).toBe(17);
  });

  it("does NOT populate any cell when Time is mojibake-corrupted (guards the actual bug)", () => {
    const corrupted = [{ ...schedule[0], Time: "08:30â€“09:25" }];
    render(<TimetableGrid schedule={corrupted} timeSlots={timeSlots} />);

    expect(screen.queryByText("Statistics")).not.toBeInTheDocument();
  });

  it("calls onSlotClick with the slot, day, and time when a populated cell is clicked", () => {
    const onSlotClick = vi.fn();
    render(
      <TimetableGrid schedule={schedule} timeSlots={timeSlots} onSlotClick={onSlotClick} />,
    );

    screen.getByText("Statistics").click();

    expect(onSlotClick).toHaveBeenCalledTimes(1);
    const [slot, day, time] = onSlotClick.mock.calls[0];
    expect(day).toBe("Monday");
    expect(slot.course).toBe("Statistics");
    expect(time).toBe("08:30-09:25");
  });
});
