import { redirect } from 'next/navigation';

const SHARED_LIST_ID = 'nuestra-despensa-compartida';

export default function Home() {
  redirect(`/pantry/${SHARED_LIST_ID}`);
  return null;
}
