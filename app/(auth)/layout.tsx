export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Campsite</h1>
          <p className="text-muted-foreground mt-1">Project management, simplified</p>
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
