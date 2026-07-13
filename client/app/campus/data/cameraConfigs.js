/**
 * Per-building and per-room camera position + lookAt overrides.
 * Only x, y, z need to change — CameraController handles the rest.
 *
 * POSITION = where the camera sits
 * LOOKAT   = what the camera looks at
 */

// ─────────────────────────────────────────────────────────────
//  BUILDINGS
// ─────────────────────────────────────────────────────────────
export const BUILDING_CAMERAS = {

  building_A: {
    position: { x: 60.63,    y: 50,   z: -5 },
    lookAt:   { x: -110.63,    y: -10,   z: -74.31 },
  },

  building_D: {
    position: { x: 1.0,    y: 10,   z: -45 },
    lookAt:   { x: 45.8,    y: 10,   z: -115.0 },
  },

  building_E: {
    position: { x: -79.67,  y: 40,   z: -50 },
    lookAt:   { x: -2.67,  y: -10,   z: -96.91 },
  },

  building_H: {
    position: { x: -19.13,  y: 20,   z: -183 },
    lookAt:   { x: -19.13,  y: -10,    z: 153.52 },
  },

  building_workshop: {
    position: { x: -1,   y: 0.0,   z: -145 },
    lookAt:   { x: -39.3,   y: 8,    z: -150.11 },
  },

  building_design: {
    position: { x: -71.77,  y: 0.0,   z: 5 },
    lookAt:   { x: -31.77,  y: 8,    z: -25.68 },
  },

  building_auditorium: {
    position: { x: 10,  y: 15,   z: -3 },
    lookAt:   { x: 80.116,  y: -15,    z: -36.237 },
  },
}

// ─────────────────────────────────────────────────────────────
//  ROOMS
// ─────────────────────────────────────────────────────────────
export const ROOM_CAMERAS = {

  // A Wing
  'room_A101':     { position: { x: 60.63,    y: 50,   z: -5 },lookAt:   { x: -110.63,    y: -10,   z: -74.31 }, },
  'room_A102':    { position: { x: 60.63,    y: 50,   z: -5 },lookAt:   { x: -110.63,    y: -10,   z: -74.31 }, },
  'room_A201':     { position: { x: 60.63,    y: 50,   z: -5 },lookAt:   { x: -110.63,    y: -10,   z: -74.31 }, },
  'room_A_faculty':{ position: { x: 60.63,    y: 50,   z: -5 },lookAt:   { x: -110.63,    y: -10,   z: -74.31 }, },

  // D Wing
  'd_room_101':     { position: { x: 55,    y: 8,   z: 135 },   lookAt: { x: 35.8,    y: 4,  z: 115.0 } },
  'd_room_102':     { position: { x: 15,    y: 8,   z: 135 },   lookAt: { x: 35.8,    y: 4,  z: 115.0 } },
  'd_room_201':     { position: { x: 55,    y: 18,  z: 135 },   lookAt: { x: 35.8,    y: 14, z: 115.0 } },

  // E Wing
  'e_room_101':     { position: { x: -20,   y: 8,   z: -66 },   lookAt: { x: -39.67,  y: 4,  z: -86.91 } },
  'e_room_lab1':    { position: { x: -60,   y: 8,   z: -66 },   lookAt: { x: -39.67,  y: 4,  z: -86.91 } },

  // H Wing
  'h_room_101':     { position: { x: 0,     y: 8,   z: -133 },  lookAt: { x: -19.13,  y: 4,  z: -153.52 } },
  'h_room_201':     { position: { x: 0,     y: 18,  z: -133 },  lookAt: { x: -19.13,  y: 14, z: -153.52 } },

  // F Wing Workshop
  'workshop_main':  { position: { x: -9,    y: 10,  z: -125 },  lookAt: { x: -39.3,   y: 5,  z: -150.11 } },
  'workshop_lab':   { position: { x: -65,   y: 10,  z: -130 },  lookAt: { x: -39.3,   y: 5,  z: -150.11 } },

  // Design Dept
  'design_studio1': { position: { x: -22,   y: 8,   z: 6 },     lookAt: { x: -41.77,  y: 4,  z: -13.68 } },
  'design_studio2': { position: { x: -62,   y: 8,   z: 6 },     lookAt: { x: -41.77,  y: 4,  z: -13.68 } },
  'design_gallery': { position: { x: -41.77, y: 12, z: 16 },    lookAt: { x: -41.77,  y: 4,  z: -13.68 } },

  // Auditorium
  'auditorium_main':    { position: { x: 60,     y: 8,  z: -16 },  lookAt: { x: 40.116, y: 3, z: -36.237 } },
  'auditorium_stage':   { position: { x: 40.116, y: 6,  z: -56 },  lookAt: { x: 40.116, y: 3, z: -6 } },
  'auditorium_balcony': { position: { x: 40.116, y: 22, z: -26 },  lookAt: { x: 40.116, y: 3, z: -36.237 } },
}
