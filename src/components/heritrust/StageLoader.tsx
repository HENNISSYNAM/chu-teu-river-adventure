export function StageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
      <p className="font-display text-lg text-gold">Đang thắp đèn hội…</p>
    </div>
  );
}
