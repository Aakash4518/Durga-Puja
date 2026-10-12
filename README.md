# Laxman Chhapra Mela — Cloudinary-only vendor directory and reviews

## Included changes
- Home-page vendor cards now load from MongoDB via `/api/stalls` instead of showing hard-coded demo cards.
- New stalls created in the admin manager default to `Published`; existing draft stalls must be edited and changed to `Published` to appear publicly.
- Vendor records support category, stall number, address/area, phone/mobile number, and a Cloudinary shop-image URL.
- Each public vendor card links to `/vendors/[id]`, a dedicated profile and review page.
- Food reviews rate taste, hygiene, politeness, value for money, portion size, and service speed.
- Shopping reviews rate product quality, variety, price fairness, politeness, value for money, and trustworthiness.
- Attraction reviews use safety, enjoyment, value, staff politeness, and cleanliness.
- Reviews are stored in MongoDB `vendorReviews` and shown with category averages.
- Media uploads use Cloudinary only for images and videos. Images are limited to 10 MB and videos to 100 MB.

## Setup
1. Extract the ZIP and open the project folder in VS Code.
2. Keep your existing `.env.local` private. Copy it into the extracted project folder if it is not already there. It must contain your working MongoDB and Cloudinary credentials.
3. In the project terminal run:
   ```powershell
   npm install
   npm run typecheck
   npm run build
   npm run dev
   ```
4. Sign in to `/admin`, open Stalls, and create/edit a vendor. Add the address, phone/mobile number, and the Cloudinary `secure_url` for the shop image. Ensure status is `Published`.
5. Refresh the home page. Published vendors should replace the old demo cards.
6. Open a vendor card, submit a test review, and verify that the review and averages appear.

## Important
- The ZIP intentionally excludes `.env.local`, `.next`, and `node_modules`.
- Shop images must first be uploaded to Cloudinary; paste the resulting secure URL into the vendor form.
- Existing stall records with status `draft` or `pending` will not appear on the public home page until changed to `published` in the admin dashboard.
- The code changes have not been built in this environment because npm dependency installation was unavailable offline. Run the checks above before deployment.

# Durga-Puja
