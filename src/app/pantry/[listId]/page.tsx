import PantryPage from "@/components/pantry-page";

export default function Page({ params }: { params: { listId: string } }) {
  return <PantryPage listId={params.listId} />;
}
