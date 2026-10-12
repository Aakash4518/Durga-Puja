import VendorReviewClient from "./VendorReviewClient";
export default async function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VendorReviewClient vendorId={id} />;
}
