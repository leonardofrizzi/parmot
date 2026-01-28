import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SkeletonStatsGridProps {
  count?: number
  variant?: "default" | "compact"
}

export function SkeletonStatsGrid({ count = 4, variant = "default" }: SkeletonStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            {variant === "default" ? (
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
            ) : (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
