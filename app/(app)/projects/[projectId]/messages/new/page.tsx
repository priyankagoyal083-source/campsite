import { CreateMessageForm } from "@/components/messages/create-message-form";

export default async function NewMessagePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">New message</h2>
      <CreateMessageForm projectId={projectId} />
    </div>
  );
}
