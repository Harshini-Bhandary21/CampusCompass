import { create } from 'zustand'

const useCampusStore = create((set, get) => ({

  // ── Data ──────────────────────────────────────
  buildings:   [],
  rooms:       [],
  faculty:     [],
  navGraph:    null,

  // ── Selection ─────────────────────────────────
  selectedBuilding:   null,
  selectedRoom:       null,
  selectedFaculty:    null,

  // ── id-based camera keys ──────────────────────
  // CameraController uses these for config lookup
  selectedBuildingId: null,
  selectedRoomId:     null,

  // ── Search ────────────────────────────────────
  searchQuery:   '',
  searchResults: [],

  // ── Navigation ────────────────────────────────
  navOrigin:      null,
  navDestination: null,
  navPath:        [],
  isNavigating:   false,

  // ── Camera ────────────────────────────────────
  cameraTarget:      null,
  cameraMode:        'OVERVIEW',   // OVERVIEW | BUILDING | ROOM

  // ── Search position memory ────────────────────
  // Remembers where the camera was before a search was opened
  savedCameraState:  null,   // { cameraMode, cameraTarget, selectedBuildingId, selectedRoomId }
  isSearchActive:    false,

  // ── UI ────────────────────────────────────────
  showInfoPanel: false,

  // ── Control / Follow ──────────────────────────
  controlMode:      'ORBIT',
  isFollowingRoute: false,
  isFollowPaused:   false,
  followProgress:   0,
  followSpeed:      1.0,

  // ── Actions ───────────────────────────────────
  // ── Panel exclusivity ─────────────────────────
  isSearchDropOpen: false,
  isNavPanelOpen:   false,

  setSearchDropOpen: (val) => set(state => ({
    isSearchDropOpen: val,
    isNavPanelOpen:   val ? false : state.isNavPanelOpen,
  })),

  setNavPanelOpen: (val) => set(state => ({
    isNavPanelOpen:   val,
    isSearchDropOpen: val ? false : state.isSearchDropOpen,
  })),

  loadData: (buildings, rooms, faculty, navGraph) =>
    set({ buildings, rooms, faculty, navGraph }),

  selectBuilding: (building) => set({
    selectedBuilding:   building,
    selectedBuildingId: building?.id ?? null,   // ← camera config key
    selectedRoom:       null,
    selectedRoomId:     null,
    selectedFaculty:    null,
    showInfoPanel:      true,
    cameraMode:         'BUILDING',
    cameraTarget:       building?.position ?? null,
  }),

  selectRoom: (room) => set({
    selectedRoom:   room,
    selectedRoomId: room?.id ?? null,           // ← camera config key
    showInfoPanel:  true,
    cameraMode:     'ROOM',
    cameraTarget:   room?.position ?? null,
  }),

  selectFaculty: (f) => set({ selectedFaculty: f }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),

  // ── Search open/close — remembers position ────
  openSearch: () => {
    const { cameraMode, cameraTarget, selectedBuildingId, selectedRoomId } = get()
    set({
      isSearchActive: true,
      savedCameraState: { cameraMode, cameraTarget, selectedBuildingId, selectedRoomId },
    })
  },

  closeSearch: () => {
    const { savedCameraState } = get()
    if (savedCameraState) {
      // Return to the previous position
      set({
        isSearchActive:    false,
        cameraMode:        savedCameraState.cameraMode,
        cameraTarget:      savedCameraState.cameraTarget,
        selectedBuildingId: savedCameraState.selectedBuildingId,
        selectedRoomId:    savedCameraState.selectedRoomId,
        savedCameraState:  null,
      })
    } else {
      set({ isSearchActive: false })
    }
  },

  // Search result click — go to that building/room, save position
  selectSearchResult: (result) => {
    // result = { type: 'building'|'room', data: {...} }
    if (result.type === 'building') {
      set({
        selectedBuilding:   result.data,
        selectedBuildingId: result.data?.id ?? null,
        selectedRoom:       null,
        selectedRoomId:     null,
        showInfoPanel:      true,
        cameraMode:         'BUILDING',
        cameraTarget:       result.data?.position ?? null,
        isSearchActive:     false,
        savedCameraState:   null,
      })
    } else if (result.type === 'room') {
      set({
        selectedRoom:       result.data,
        selectedRoomId:     result.data?.id ?? null,
        showInfoPanel:      true,
        cameraMode:         'ROOM',
        cameraTarget:       result.data?.position ?? null,
        isSearchActive:     false,
        savedCameraState:   null,
      })
    }
  },

  setNavOrigin:      (id) => set({ navOrigin: id }),
  setNavDestination: (id) => set({ navDestination: id }),

  setNavPath: (path) => set({
    navPath:        path,
    isNavigating:   path.length > 0,
    followProgress: 0,
  }),

  clearNav: () => set({
    navPath:          [],
    isNavigating:     false,
    navOrigin:        null,
    navDestination:   null,
    isFollowingRoute: false,
    followProgress:   0,
  }),

  closePanel: () => set({
    showInfoPanel:      false,
    selectedBuilding:   null,
    selectedRoom:       null,
    selectedFaculty:    null,
  }),

  setControlMode: (mode) => set({
    controlMode:      mode,
    isFollowingRoute: false,
  }),

  toggleFollowRoute: () => {
    const { isFollowingRoute, navPath } = get()
    if (navPath.length < 2) return
    if (!isFollowingRoute) {
      set({ isFollowingRoute: true, isFollowPaused: false, followProgress: 0 })
    } else {
      set({ isFollowingRoute: false, isFollowPaused: false })
    }
  },

  pauseFollowRoute: () => {
    const { isFollowPaused } = get()
    set({ isFollowPaused: !isFollowPaused })
  },

  restartFollowRoute: () => set({
    followProgress:   0,
    isFollowingRoute: true,
    isFollowPaused:   false,
  }),

  setFollowProgress: (p) => set({ followProgress: p }),
  setFollowSpeed:    (speed) => set({ followSpeed: speed }),
}))

export default useCampusStore
