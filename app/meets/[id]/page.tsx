import MeetDetailScreen from "./MeetDetailScreen";

export default async function MeetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeetDetailScreen meetId={id} />;
}
