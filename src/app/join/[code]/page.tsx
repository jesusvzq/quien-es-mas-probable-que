import { Game } from "@/components/Game";

export default function JoinPage({
  params,
}: {
  params: { code: string };
}) {
  return (
    <main className="min-h-[100dvh] bg-background">
      <Game initialJoinCode={params.code.toUpperCase()} />
    </main>
  );
}
