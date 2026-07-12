"""Command-line argument parsing for the timetable generator."""

import argparse


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--time-limit",
        type=int,
        default=600,
        help="Solver time limit in seconds (default: 600)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Number of parallel CP-SAT workers (default: 8)",
    )
    parser.add_argument(
        "--no-hints",
        action="store_true",
        help="Disable greedy warm-start hints (for debugging)",
    )
    parser.add_argument(
        "--input",
        default="FY.xlsx",
        help="Input Excel file (default: FY.xlsx)",
    )
    parser.add_argument(
        "--output",
        default="FY_TT.xlsx",
        help="Output Excel file (default: FY_TT.xlsx)",
    )
    parser.add_argument(
        "--max-iterations",
        type=int,
        default=5,
        help="Maximum iterative-repair passes (default: 5)",
    )
    parser.add_argument(
        "--lns-freeze-ratio",
        type=float,
        default=0.95,
        help="Fraction of scheduled sessions frozen during LNS passes "
        "(default: 0.95 → keep 95%%, relax 5%%)",
    )
    parser.add_argument(
        "--lns-start-pass",
        type=int,
        default=3,
        help="Which pass number to begin LNS neighbourhood relaxation "
        "(default: 3; passes 1-2 use the original full-freeze strategy)",
    )
    return parser
