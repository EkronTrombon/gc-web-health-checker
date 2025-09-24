import { HealthChecker } from "@/components/health-checker";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted dark:from-background dark:to-card">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Web Health Checker
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive website analysis for markup validation, accessibility, performance, and more
            </p>
          </div>

          <HealthChecker />
        </div>
      </div>
    </div>
  );
}
