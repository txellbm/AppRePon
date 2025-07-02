import PantryPage from "@/components/pantry-page";

interface PageProps {
  params: {
    listId: string;
  };
}

// Dynamic route handler must be async so `params` are available.
export default async function Page({ params }: PageProps) {
  return <PantryPage listId={params.listId} />;
}
