"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, FileText, User, LogOut, ChevronRight, ChevronLeft, Plus, Moon, Search, Coins, ClipboardCheck, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarProps {
  tipo: "cliente" | "profissional"
}

export default function Sidebar({ tipo }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const menuItemsCliente = [
    { icon: Home, label: "Início", href: "/dashboard/cliente" },
    { icon: Plus, label: "Solicitar Serviço", href: "/dashboard/cliente/solicitar" },
    { icon: FileText, label: "Minhas Solicitações", href: "/dashboard/cliente/solicitacoes" },
    { icon: User, label: "Meu Perfil", href: "/dashboard/cliente/perfil" },
  ]

  const menuItemsProfissional = [
    { icon: Home, label: "Início", href: "/dashboard/profissional" },
    { icon: Search, label: "Buscar Serviços", href: "/dashboard/profissional/solicitacoes" },
    { icon: ClipboardCheck, label: "Meus Atendimentos", href: "/dashboard/profissional/atendimentos" },
    { icon: Coins, label: "Comprar Moedas", href: "/dashboard/profissional/moedas" },
    { icon: DollarSign, label: "Reembolsos", href: "/dashboard/profissional/reembolsos" },
    { icon: User, label: "Meu Perfil", href: "/dashboard/profissional/perfil" },
  ]

  const menuItems = tipo === "cliente" ? menuItemsCliente : menuItemsProfissional

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('tipoUsuario')
    router.push('/login')
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative",
          expanded ? "w-64" : "w-20"
        )}
      >
        {/* Botão de expandir/retrair - ABSOLUTE */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10 shadow-sm"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          {expanded ? (
            <h1 className="text-xl font-bold text-primary-600">Parmot</h1>
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">
              P
            </div>
          )}
        </div>

        {/* Menu Items */}
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

        {/* Dark Mode & Logout */}
        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          {/* Dark Mode */}
          {expanded ? (
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-gray-100"
            >
              <Moon size={20} className="mr-3" />
              Modo Escuro
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-11 hover:bg-gray-100"
                >
                  <Moon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Modo Escuro</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Logout */}
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
