import * as Icons from 'lucide-react'

interface IconRendererProps {
  name?: string
  size?: number
  className?: string
}

export function IconRenderer({ name, size = 20, className }: IconRendererProps) {
  if (!name) return null

  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<{
    size?: number
    className?: string
  }>

  if (!IconComponent) return null

  return <IconComponent size={size} className={className} />
}
