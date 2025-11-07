"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  CheckCircle2,
  Users,
  Clock,
  Star,
  ArrowRight,
  Shield,
  Home as HomeIcon,
  Paintbrush,
  Laptop,
  Zap,
  Menu,
  X
} from "lucide-react"
import * as Icons from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias")
      const data = await response.json()
      setCategorias(data.categorias.slice(0, 6)) // Mostrar apenas 6 categorias
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    }
  }

  const renderIcone = (nomeIcone?: string) => {
    if (!nomeIcone) return null
    const IconComponent = Icons[nomeIcone as keyof typeof Icons] as any
    return IconComponent ? <IconComponent size={32} /> : null
  }

  const comoFunciona = [
    {
      numero: 1,
      titulo: "Descreva o serviço",
      descricao: "Conte o que você precisa de forma simples e rápida",
      icon: Search
    },
    {
      numero: 2,
      titulo: "Receba propostas",
      descricao: "Profissionais qualificados entrarão em contato com você",
      icon: Users
    },
    {
      numero: 3,
      titulo: "Escolha o melhor",
      descricao: "Compare preços e avaliações para tomar sua decisão",
      icon: CheckCircle2
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Parmot</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#como-funciona" className="text-gray-600 hover:text-gray-900 transition-colors">
                Como funciona
              </Link>
              <Link href="#categorias" className="text-gray-600 hover:text-gray-900 transition-colors">
                Serviços
              </Link>
              <Link href="#profissionais" className="text-gray-600 hover:text-gray-900 transition-colors">
                Para profissionais
              </Link>
              <Link href="/login">
                <Button variant="outline">
                  Entrar
                </Button>
              </Link>
              <Link href="/cadastro/cliente">
                <Button>
                  Solicitar Serviço
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t">
              <Link
                href="#como-funciona"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Como funciona
              </Link>
              <Link
                href="#categorias"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Serviços
              </Link>
              <Link
                href="#profissionais"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Para profissionais
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Entrar
                </Button>
              </Link>
              <Link href="/cadastro/cliente" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">
                  Solicitar Serviço
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Conectamos você aos melhores profissionais
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Descreva o serviço que você precisa e receba propostas de profissionais qualificados na sua região
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cadastro/cliente">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Solicitar um Serviço
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                  Como Funciona
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t">
              <div>
                <div className="text-3xl font-bold text-primary-600">500+</div>
                <div className="text-sm text-gray-600 mt-1">Profissionais</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">2000+</div>
                <div className="text-sm text-gray-600 mt-1">Serviços realizados</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">4.8★</div>
                <div className="text-sm text-gray-600 mt-1">Avaliação média</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-gray-600">
              É simples e rápido encontrar o profissional ideal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {comoFunciona.map((passo) => (
              <Card key={passo.numero} className="relative border-2 hover:border-primary-200 transition-all">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {passo.numero}
                  </div>
                </div>
                <CardHeader className="pt-10 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <passo.icon size={32} className="text-primary-600" />
                  </div>
                  <CardTitle className="text-xl">{passo.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{passo.descricao}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Serviços mais procurados
            </h2>
            <p className="text-xl text-gray-600">
              Encontre profissionais para qualquer tipo de serviço
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categorias.map((categoria) => (
              <Link
                key={categoria.id}
                href="/cadastro/cliente"
              >
                <Card className="text-center hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 text-primary-600">
                      {renderIcone(categoria.icone)}
                    </div>
                    <p className="font-semibold text-sm">{categoria.nome}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/cadastro/cliente">
              <Button variant="outline" size="lg">
                Ver todas as categorias
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Para Profissionais */}
      <section id="profissionais" className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Você é um profissional?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Cadastre-se gratuitamente e receba solicitações de clientes na sua região.
                Aumente seu faturamento e faça seu negócio crescer!
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Cadastro gratuito</h3>
                    <p className="text-primary-100">Sem mensalidades, você só paga pelos contatos que liberar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Clientes qualificados</h3>
                    <p className="text-primary-100">Receba solicitações reais de pessoas procurando seus serviços</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Aumente seu faturamento</h3>
                    <p className="text-primary-100">Profissionais aumentam em média 3x seu faturamento</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/cadastro/profissional">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                    Cadastrar como profissional
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary-600">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Resposta rápida</p>
                      <p className="text-sm text-primary-100">Receba notificações em tempo real</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Pagamento flexível</p>
                      <p className="text-sm text-primary-100">Compre moedas conforme sua necessidade</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Star size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Construa sua reputação</p>
                      <p className="text-sm text-primary-100">Receba avaliações e ganhe destaque</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">Parmot</span>
              </div>
              <p className="text-sm text-gray-400">
                Conectando profissionais qualificados com pessoas que precisam de serviços.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Para Clientes</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cadastro/cliente" className="hover:text-white transition-colors">Solicitar serviço</Link></li>
                <li><Link href="#como-funciona" className="hover:text-white transition-colors">Como funciona</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Entrar</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Para Profissionais</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cadastro/profissional" className="hover:text-white transition-colors">Cadastrar-se</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Acessar painel</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Central de ajuda</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contato</Link></li>
                <li><Link href="/admin/login" className="hover:text-white transition-colors">Admin</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Parmot Serviços. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
