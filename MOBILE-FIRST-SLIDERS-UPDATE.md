# Mobile-first layout and horizontal sliders

Changes in this update:
- Public festival photo/video gallery uses a horizontal, swipeable slider instead of a tall grid.
- Vendor cards use a horizontal, swipeable slider, with desktop arrow controls.
- Festival event cards and archive year cards become horizontal carousels on small screens and retain grid layouts on larger screens.
- Homepage highlight cards scroll horizontally on mobile.
- Reduced vertical section padding and tightened the header/hero spacing on mobile.
- Preserved Cloudinary-only media upload, existing API routes, vendor review features, and MongoDB data.

To test locally, keep your existing private `.env.local`, then run `npm install`, `npm run typecheck`, `npm run build`, and `npm run dev`.
