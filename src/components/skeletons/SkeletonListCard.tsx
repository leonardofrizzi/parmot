import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SkeletonListCardProps {
  variant?: "solicitacao" | "atendimento" | "simple"
}

export function SkeletonListCard({ variant = "solicitacao" }: SkeletonListCardProps) {
  if (variant === "atendimento") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "simple") {
    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-5 w-5" />
          <div className="flex-1">
            <Skeleton className="h-5 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  )
}
