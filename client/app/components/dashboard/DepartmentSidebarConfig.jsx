const DashboardSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const ScheduleSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="9" y1="4" x2="9" y2="10"/>
    <line x1="15" y1="4" x2="15" y2="10"/>
  </svg>
)

const FacultySvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const RoomSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const DivisionSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M8 3H6a2 2 0 0 0-2 2v2"/>
    <line x1="2" y1="13" x2="22" y2="13"/>
    <line x1="12" y1="7" x2="12" y2="21"/>
  </svg>
)

const NotifySvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const ActivitiesSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M8 2v4M16 2v4M3 10h18"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
  </svg>
)

// Default configuration for current implementation
const defaultTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardSvg },
  { id: 'schedules', label: 'Schedules', icon: ScheduleSvg },
  { id: 'faculty', label: 'Faculty', icon: FacultySvg },
  { id: 'rooms', label: 'Rooms', icon: RoomSvg },
  { id: 'division', label: 'Division Schedule', icon: DivisionSvg },
  { id: 'activities', label: 'Activities', icon: ActivitiesSvg },
  { id: 'notify', label: 'Notify', icon: NotifySvg }
]

function getDepartmentTabs() {
  return defaultTabs
}

const departmentTabs = defaultTabs

export { getDepartmentTabs, departmentTabs }

export const createTabNavigator = (router) => (tab) => {
  const routes = {
    dashboard: `/firstyear/dashboard`,
    schedules: `/firstyear/schedules`,
    faculty: `/firstyear/faculty`,
    rooms: `/firstyear/rooms`,
    division: `/firstyear/division`,
    activities: `/firstyear/activities`,
    notify: `/firstyear/notify`
  }

  if (routes[tab]) {
    router.push(routes[tab])
  }
}
