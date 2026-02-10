"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Users, FileText, DollarSign, LogOut, ChevronRight, ChevronLeft, Shield, Settings, UserCog, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export default function AdminSidebar() {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Users, label: "Profissionais", href: "/admin/profissionais" },
    { icon: Award, label: "Selos", href: "/admin/selos" },
    { icon: FileText, label: "Solicitações", href: "/admin/solicitacoes" },
    { icon: DollarSign, label: "Reembolsos", href: "/admin/reembolsos" },
    { icon: UserCog, label: "Usuários", href: "/admin/usuarios" },
    { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
  ]

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/admin/login')
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative",
          expanded ? "w-64" : "w-20"
        )}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10 shadow-sm"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          {expanded ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield size={18} className="text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (expanded) {
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-11",
                      !isActive && "hover:bg-gray-100"
                    )}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "w-full h-11",
                        !isActive && "hover:bg-gray-100"
                      )}
                    >
                      <Icon size={20} />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          {expanded ? (
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-3" />
              Sair
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-11 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
