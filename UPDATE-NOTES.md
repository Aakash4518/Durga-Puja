# Vendor multi-photo update

- Admin can select multiple vendor/shop images in the Stalls form.
- Each selected image uploads to Cloudinary (maximum 10 MB per image).
- Editing a vendor appends new images to the existing gallery; existing photos are preserved.
- Vendor profile shows a left/right carousel with position counter and dot navigation when multiple photos exist.
- `shopImages` is stored as an array of Cloudinary URLs. `shopImageUrl` remains populated with the first image for backward compatibility with older vendor cards/records.
- Legacy vendors with only `shopImageUrl` continue to work.

Community contributors still use the existing contribution/media moderation workflow; direct vendor record editing remains admin-protected.
