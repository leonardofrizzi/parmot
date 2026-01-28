import { Skeleton } from "@/components/ui/skeleton"

interface SkeletonPageHeaderProps {
  showButton?: boolean
  buttonWidth?: string
}

export function SkeletonPageHeader({ showButton = false, buttonWidth = "w-40" }: SkeletonPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      {showButton && <Skeleton className={`h-10 ${buttonWidth}`} />}
    </div>
  )
}
