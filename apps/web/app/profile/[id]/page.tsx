import { ProfileView } from '@/components/profile';

export default async function Profile({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);
  return <ProfileView userId={id} />;
}
