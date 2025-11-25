import { HealthChecker } from "@/components/health-checker";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background selection:bg-primary/20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm">
                v1.0.0
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Web Health <span className="text-gradient">Checker</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive website analysis for markup validation, accessibility, performance, and more.
            </p>
          </div>

          <HealthChecker />
        </div>
      </div>
    </div>
  );
}
