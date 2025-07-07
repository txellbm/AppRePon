import PantryPage from "@/components/pantry-page";

// `params` is asynchronous in Next.js app router. Await it before using any
// of its properties to avoid runtime errors.
export default async function Page({
  params,
}: {
  params: { listId: string };
}) {
  const { listId } = params;
  return <PantryPage listId={listId} />;
}
