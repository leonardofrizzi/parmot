"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  CheckCircle2,
  Users,
  MessageSquare,
  ArrowRight,
  Menu,
  X,
  BookOpen,
  GraduationCap,
  Shield,
  Star,
  Clock
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const comoFunciona = [
    {
      numero: 1,
      titulo: "Descreva o que precisa",
      descricao: "Conte detalhes sobre a aula ou serviço que você está buscando",
      icon: Search
    },
    {
      numero: 2,
      titulo: "Receba propostas",
      descricao: "Profissionais interessados entrarão em contato com você",
      icon: Users
    },
    {
      numero: 3,
      titulo: "Converse e contrate",
      descricao: "Negocie diretamente e escolha o profissional ideal para você",
      icon: MessageSquare
    }
  ]

  const diferenciais = [
    {
      icon: GraduationCap,
      titulo: "Profissionais Verificados",
      descricao: "Todos passam por verificação antes de acessar a plataforma"
    },
    {
      icon: Shield,
      titulo: "Segurança",
      descricao: "Seus dados protegidos e comunicação segura"
    },
    {
      icon: Star,
      titulo: "Avaliações",
      descricao: "Veja a reputação de cada profissional"
    },
    {
      icon: Clock,
      titulo: "Praticidade",
      descricao: "Receba propostas sem precisar sair de casa"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Parmot</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="#como-funciona" className="text-gray-600 hover:text-gray-900 transition-colors">
                Como funciona
              </Link>
              <Link href="#profissionais" className="text-gray-600 hover:text-gray-900 transition-colors">
                Para profissionais
              </Link>
              <Link href="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/cadastro/cliente">
                <Button>Solicitar Serviço</Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

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
                href="#profissionais"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Para profissionais
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link href="/cadastro/cliente" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Solicitar Serviço</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen size={16} />
              Plataforma de Educação
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Encontre o professor particular ideal para você
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Descreva o que você precisa e receba propostas de profissionais qualificados. Simples, rápido e prático.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cadastro/cliente">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Solicitar Serviço
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                  Como Funciona
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-600">
              Encontrar um profissional nunca foi tão fácil
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

      {/* Diferenciais */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Por que usar a Parmot
            </h2>
            <p className="text-xl text-gray-600">
              Uma plataforma pensada para conectar você ao profissional certo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {diferenciais.map((item) => (
              <div key={item.titulo} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon size={32} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.titulo}</h3>
                <p className="text-gray-600 text-sm">{item.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para Profissionais */}
      <section id="profissionais" className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Você é professor?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Cadastre-se e receba solicitações de alunos. Você escolhe quais contatos quer liberar.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Cadastro gratuito</h3>
                    <p className="text-primary-100">Sem mensalidades, pague apenas pelos contatos que liberar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Solicitações reais</h3>
                    <p className="text-primary-100">Receba pedidos de alunos que precisam do seu serviço</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">Você no controle</h3>
                    <p className="text-primary-100">Negocie valores e horários diretamente com o aluno</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/cadastro/profissional">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8">
                    Cadastrar como professor
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
                      <p className="font-semibold">Flexibilidade</p>
                      <p className="text-sm text-primary-100">Você define seus horários</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Star size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Reputação</p>
                      <p className="text-sm text-primary-100">Receba avaliações dos alunos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Mais alunos</p>
                      <p className="text-sm text-primary-100">Aumente sua base de clientes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Descreva o que você precisa e receba propostas de profissionais
          </p>
          <Link href="/cadastro/cliente">
            <Button size="lg" className="text-lg px-12 py-6">
              Solicitar Serviço
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">Parmot</span>
              </div>
              <p className="text-sm text-gray-400">
                Conectando alunos a professores qualificados.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Para Alunos</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cadastro/cliente" className="hover:text-white transition-colors">Solicitar serviço</Link></li>
                <li><Link href="#como-funciona" className="hover:text-white transition-colors">Como funciona</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Para Professores</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cadastro/profissional" className="hover:text-white transition-colors">Cadastrar-se</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Acessar painel</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/termos" className="hover:text-white transition-colors">Termos de uso</Link></li>
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
