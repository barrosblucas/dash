import ActionForm from '@/components/admin/management-actions/ActionForm';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActionForm actionId={id} />;
}
