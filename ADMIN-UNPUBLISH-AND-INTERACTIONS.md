# Admin unpublish/delete workflow and button feedback

- Unpublishing a published stall, event, announcement, or media item moves it to `pending` / unpublished and hides it from public pages.
- Only non-published content can be permanently deleted from the admin manager.
- Deleting a pending media item attempts to remove the Cloudinary asset as well as its MongoDB record. Cloudinary credentials must be configured on the server.
- Buttons and links have hover, active press, focus-visible, and reduced-motion-aware feedback.

After extracting, copy your private `.env.local` into this project and run `npm install`, `npm run typecheck`, and `npm run build`.
