# Mobile responsive polish update

Changes in this update:
- Prevented page-wide horizontal overflow while preserving swipeable carousels.
- Made the Festival events & updates heading wrap on narrow screens.
- Added min-width safeguards to the festival, vendor directory, and memory gallery layouts.
- Made announcements a compact horizontal carousel on mobile and a two-column grid on wider screens.
- Tightened mobile spacing around the festival programme.
- Removed placeholder sample events and announcements from the festival section. It now loads published API data and shows empty/loading/error states instead of presenting sample timings as real events.

Before deployment:
1. Copy your private `.env.local` into the project folder locally (never commit it).
2. Run `npm install`, `npm run typecheck`, and `npm run build`.
3. Test on a narrow phone viewport and verify all carousels scroll inside their sections.
4. Add/publish real events and announcements from the admin dashboard.
