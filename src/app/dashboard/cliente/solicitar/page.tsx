"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Categoria, Subcategoria } from "@/types/database"
import { ChevronRight, ChevronLeft, Check, CheckCircle2, Clock } from "lucide-react"
import { IconRenderer } from "@/components/IconRenderer"

export default function SolicitarServico() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [categorias, setCategorias] = useState<(Categoria & { subcategorias: Subcategoria[] })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    categoria_id: "",
    subcategoria_id: "",
    titulo: "",
    descricao: "",
    modalidade: "presencial" as "presencial" | "online" | "ambos",
  })

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias")
      const data = await response.json()
      setCategorias(data.categorias)
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    }
  }

  const categoriaSelecionada = categorias.find(c => c.id === formData.categoria_id)
  const subcategoriaSelecionada = categoriaSelecionada?.subcategorias.find(s => s.id === formData.subcategoria_id)

  const handleSubmit = async () => {
    setError("")
    setLoading(true)

    const usuarioData = localStorage.getItem('usuario')
    if (!usuarioData) {
      router.push('/login')
      return
    }

    const usuario = JSON.parse(usuarioData)

    try {
      const response = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: usuario.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar solicitação")
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Serviço</h1>
          <p className="text-gray-600">Descreva o serviço que você precisa em 3 passos simples</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors
                  ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step > s ? <Check size={20} /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 mx-2 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}


        {/* Step 1: Selecionar Categoria */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">1. Selecione a categoria do serviço</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categorias.map((categoria) => (
                <Card
                  key={categoria.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.categoria_id === categoria.id
                      ? 'border-primary-600 border-2 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setFormData({ ...formData, categoria_id: categoria.id, subcategoria_id: "" })
                  }}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`mb-2 ${formData.categoria_id === categoria.id ? 'text-primary-600' : 'text-gray-600'}`}>
                      <IconRenderer name={categoria.icone} size={24} />
                    </div>
                    <p className="text-sm font-medium">{categoria.nome}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.categoria_id}
              >
                Próximo <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Selecionar Subcategoria */}
        {step === 2 && categoriaSelecionada && (
          <div>
            <h2 className="text-xl font-semibold mb-4">2. Qual serviço específico você precisa?</h2>
            <p className="text-gray-600 mb-4">Categoria: <span className="font-medium">{categoriaSelecionada.nome}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoriaSelecionada.subcategorias.map((subcategoria) => (
                <Card
                  key={subcategoria.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.subcategoria_id === subcategoria.id
                      ? 'border-primary-600 border-2 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setFormData({ ...formData, subcategoria_id: subcategoria.id })
                  }}
                >
                  <CardContent className="p-4">
                    <p className="font-medium mb-1">{subcategoria.nome}</p>
                    {subcategoria.descricao && (
                      <p className="text-sm text-gray-600">{subcategoria.descricao}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft size={16} className="mr-2" /> Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.subcategoria_id}
              >
                Próximo <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Descrever o Serviço */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">3. Descreva o que você precisa</h2>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Serviço selecionado:</span> {categoriaSelecionada?.nome} → {subcategoriaSelecionada?.nome}
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da solicitação</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Preciso de aulas de inglês para iniciantes"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500">{formData.titulo.length}/100</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição detalhada</Label>
                  <textarea
                    id="descricao"
                    className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-600"
                    placeholder="Descreva em detalhes o serviço que você precisa, incluindo prazo, localização e qualquer outra informação importante..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">{formData.descricao.length}/500</p>
                </div>

                <div className="space-y-2">
                  <Label>Modalidade do serviço</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "presencial", label: "Presencial", desc: "Na sua localidade" },
                      { value: "online", label: "Online", desc: "Via internet" },
                      { value: "ambos", label: "Ambos", desc: "Presencial ou online" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setFormData({ ...formData, modalidade: option.value as typeof formData.modalidade })}
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                          formData.modalidade === option.value
                            ? "border-primary-600 bg-primary-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft size={16} className="mr-2" /> Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.titulo || !formData.descricao || loading || success}
              >
                {loading ? "Criando..." : "Criar Solicitação"}
              </Button>
            </div>
          </div>
        )}

        {/* Dialog de Sucesso */}
        <Dialog open={success} onOpenChange={(open) => {
          if (!open) {
            router.push('/dashboard/cliente/solicitacoes')
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <DialogTitle className="text-center text-2xl">Solicitação Enviada com Sucesso!</DialogTitle>
              <DialogDescription asChild>
                <div className="text-sm text-muted-foreground text-center space-y-3 pt-4">
                  <p className="text-base">
                    Obrigado por utilizar nossos serviços! Sua solicitação já está disponível para os profissionais da sua região.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-start gap-2">
                      <Clock className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Próximos passos:</p>
                        <p>
                          Profissionais interessados entrarão em contato com você em breve.
                          Você pode acompanhar as respostas na aba <strong>Minhas Solicitações</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => router.push('/dashboard/cliente/solicitacoes')}
                className="w-full"
              >
                Ver Minhas Solicitações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
