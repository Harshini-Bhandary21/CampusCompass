"""Course-name -> lab-room mapping data, plus the CT track -> room mapping."""

COURSE_LAB_MAP: dict[str, str] = {
    "engineering physics": "Engineering Physics Lab",
    "foundation of computing": "Foundation of Computing Lab",
    "science of nature (son-chem)": "Science of Nature (SON-Chem) Lab",
    "applied mechanics": "Applied Mechanics Lab",
    "design thinking": "Design Thinking Lab",
    "electronics and electrical": "Electronics and Electrical Engineering Lab",
    "communication skills english": "English For Communication",
    "english for communication": "English For Communication",
    "linux fundamentals": "Linux Fundamentals Lab",
    "physics": "Engineering Physics Lab",
    "son(chem)": "Science of Nature (SON-Chem) Lab",
    "computer aided chemical": "Science of Nature (SON-Chem) Lab",
    "cace": "Science of Nature (SON-Chem) Lab",
    "surveying": "Applied Mechanics Lab",
    "s&g": "Applied Mechanics Lab",
}

COURSE_LAB_ABBREV_EXACT: dict[str, str] = {
    "am": "Applied Mechanics Lab",
    "dt": "Design Thinking Lab",
    "dee": "Electronics and Electrical Engineering Lab",
    "ieee,dee": "Electronics and Electrical Engineering Lab",
    "ieee, dee": "Electronics and Electrical Engineering Lab",
    "isa": "Electronics and Electrical Engineering Lab",
    "lsa": "Linux Fundamentals Lab",
    "linux": "Linux Fundamentals Lab",
    "foc": "Foundation of Computing Lab",
    "ep": "Engineering Physics Lab",
    "son": "Science of Nature (SON-Chem) Lab",
}

# ── CT-5: CT Track → Lab room mapping ────────────────────────────────────────
#
# Maps CT track keywords (matched against the batch/entity label, case-insensitive)
# to lists of preferred lab room names.  The matching is done with a simple
# substring check so "AI11", "AI_DIV2", etc. all hit the "ai" key.
#
# HOW TO EXTEND:
#   Add a new key (lowercase keyword) and a list of room name strings.
#   The names must exactly match entries in the Rooms sheet.
#   Example:
#       "cybersecurity": ["Cyber Lab 1", "Cyber Lab 2"],
#
# If no key matches the session label, _ct_rooms_for() falls back to
# self.all_lab_rooms (all 26 lab rooms) — preserving existing behaviour.
#
CT_ROOM_MAPPING: dict[str, list[str]] = {
    "ai": [],  # e.g. ["AI Lab 1", "AI Lab 2"]
    "iot": [],  # e.g. ["IoT Lab"]
    "robo": [],  # e.g. ["Robotics Lab"]
    "robot": [],  # alias for "robo"
    "cc": [],  # Cloud Computing
    "cloud": [],  # alias for "cc"
    "ev": [],  # Electric Vehicles
    "drone": [],  # Drone lab
    "ar": [],  # AR / VR
    "vr": [],  # alias for "ar"
    "bct": [],  # Blockchain Technology
    "pe": [],  # Power Electronics
    "zeb": [],  # Zero Energy Buildings
    "aece": [],  # AECE track
}
# NOTE: All lists above are intentionally empty until real room names are
# populated.  An empty list triggers the fallback to self.all_lab_rooms,
# so the scheduler works correctly out-of-the-box with no Excel changes.
