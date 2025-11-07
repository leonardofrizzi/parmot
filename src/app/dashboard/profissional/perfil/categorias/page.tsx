"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Categoria } from "@/types/database"
import { ArrowLeft, Check } from "lucide-react"
import * as Icons from "lucide-react"

interface Profissional {
  id: string
  atende_online?: boolean
}

interface ProfissionalCategoria {
  categoria_id: string
}

export default function CategoriasProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([])
  const [atendeOnline, setAtendeOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      setAtendeOnline(user.atende_online || false)
      fetchCategorias(user.id)
    }
  }, [])

  const fetchCategorias = async (profissionalId: string) => {
    try {
      // Buscar todas as categorias
      const responseCategorias = await fetch('/api/categorias')
      const dataCategorias = await responseCategorias.json()

      if (responseCategorias.ok) {
        setCategorias(dataCategorias.categorias)
      }

      // Buscar categorias do profissional
      const responseProfCat = await fetch(`/api/profissional/categorias?profissional_id=${profissionalId}`)
      const dataProfCat = await responseProfCat.json()

      if (responseProfCat.ok) {
        setCategoriasSelecionadas(dataProfCat.categorias.map((c: ProfissionalCategoria) => c.categoria_id))
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      setError("Erro ao carregar categorias")
      setLoading(false)
    }
  }

  const handleToggleCategoria = (categoriaId: string) => {
    if (categoriasSelecionadas.includes(categoriaId)) {
      setCategoriasSelecionadas(categoriasSelecionadas.filter(id => id !== categoriaId))
    } else {
      setCategoriasSelecionadas([...categoriasSelecionadas, categoriaId])
    }
  }

  const handleSave = async () => {
    if (!profissional) {
      setError("Profissional não encontrado")
      return
    }

    if (categoriasSelecionadas.length === 0) {
      setError("Selecione pelo menos uma categoria")
      return
    }

    setError("")
    setSuccess("")
    setSaving(true)

    try {
      const response = await fetch('/api/profissional/categorias', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profissional_id: profissional.id,
          categorias: categoriasSelecionadas,
          atende_online: atendeOnline
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao salvar categorias")
        setSaving(false)
        return
      }

      // Atualizar localStorage
      const updatedUser = { ...profissional, atende_online: atendeOnline }
      localStorage.setItem('usuario', JSON.stringify(updatedUser))
      setProfissional(updatedUser)

      setSuccess("Categorias atualizadas com sucesso!")
      setSaving(false)

      // Voltar após 1.5s
      setTimeout(() => {
        router.push('/dashboard/profissional/perfil')
      }, 1500)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setSaving(false)
    }
  }

  const renderIcone = (nomeIcone?: string) => {
    if (!nomeIcone) return null
    const IconComponent = Icons[nomeIcone as keyof typeof Icons] as any
    return IconComponent ? <IconComponent size={24} /> : null
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Categorias</h1>
          <p className="text-gray-600">
            Selecione as categorias de serviços que você atende
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Atende Online */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="atende_online"
                checked={atendeOnline}
                onCheckedChange={(checked) => setAtendeOnline(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="atende_online"
                  className="text-base font-semibold cursor-pointer"
                >
                  Atendo clientes online (todo o Brasil)
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Para serviços que podem ser feitos remotamente (design, programação, consultoria, etc.)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Serviços</CardTitle>
            <CardDescription>
              Você receberá solicitações apenas das categorias selecionadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categorias.map((categoria) => (
                <div
                  key={categoria.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    categoriasSelecionadas.includes(categoria.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggleCategoria(categoria.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${
                      categoriasSelecionadas.includes(categoria.id)
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`}>
                      {renderIcone(categoria.icone)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{categoria.nome}</p>
                    </div>
                    {categoriasSelecionadas.includes(categoria.id) && (
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || categoriasSelecionadas.length === 0}
            className="flex-1"
          >
            {saving ? "Salvando..." : "Salvar Categorias"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>

        {categoriasSelecionadas.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">
            Selecione pelo menos uma categoria para continuar
          </p>
        )}
      </div>
    </div>
  )
}
