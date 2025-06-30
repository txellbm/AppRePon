import PantryPage from "@/components/pantry-page";

// Making this an async function clarifies to Next.js that it's a Server Component
// and handles params correctly, fixing the build error.
export default async function SharedListPage({ params }: { params: { listId: string } }) {
  return <PantryPage listId={params.listId} />;
}
