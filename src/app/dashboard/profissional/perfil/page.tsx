"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationSelects } from "@/components/LocationSelects"

interface Profissional {
  id: string
  tipo: string
  nome: string
  razao_social?: string
  email: string
  telefone: string
  cpf_cnpj: string
  cidade: string
  estado: string
  saldo_moedas: number
}

export default function PerfilProfissional() {
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    nome: "",
    razao_social: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
  })

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      setFormData({
        nome: user.nome,
        razao_social: user.razao_social || "",
        email: user.email,
        telefone: user.telefone,
        cidade: user.cidade || "",
        estado: user.estado || "",
      })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/profissional/atualizar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: profissional?.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao atualizar perfil")
        setLoading(false)
        return
      }

      // Atualizar localStorage
      localStorage.setItem('usuario', JSON.stringify(data.profissional))
      setProfissional(data.profissional)
      setSuccess("Perfil atualizado com sucesso!")
      setEditMode(false)
      setLoading(false)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  if (!profissional) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
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

      <div className="max-w-2xl space-y-6">
        {/* Categorias de Atuação */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Atuação</CardTitle>
            <CardDescription>Defina quais tipos de serviço você atende</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Você só receberá solicitações das categorias que selecionar
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/dashboard/profissional/perfil/categorias'}
            >
              Gerenciar Categorias
            </Button>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Cadastro</Label>
                <Input
                  value={profissional.tipo === 'autonomo' ? 'Autônomo' : 'Empresa'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">
                  {profissional.tipo === 'autonomo' ? 'Nome Completo' : 'Nome do Responsável'}
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>

              {profissional.tipo === 'empresa' && (
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    name="razao_social"
                    type="text"
                    value={formData.razao_social}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{profissional.tipo === 'autonomo' ? 'CPF' : 'CNPJ'}</Label>
                <Input
                  value={profissional.cpf_cnpj}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>

              {editMode ? (
                <LocationSelects
                  estado={formData.estado}
                  cidade={formData.cidade}
                  onEstadoChange={(sigla) => setFormData(prev => ({ ...prev, estado: sigla }))}
                  onCidadeChange={(nome) => setFormData(prev => ({ ...prev, cidade: nome }))}
                />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={formData.estado || "Não informado"}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade || "Não informado"}
                      disabled
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                {!editMode ? (
                  <Button
                    onClick={() => {
                      setEditMode(true)
                      setError("")
                      setSuccess("")
                    }}
                    className="w-full"
                  >
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false)
                        setError("")
                        setSuccess("")
                        setFormData({
                          nome: profissional.nome,
                          razao_social: profissional.razao_social || "",
                          email: profissional.email,
                          telefone: profissional.telefone,
                          cidade: profissional.cidade || "",
                          estado: profissional.estado || "",
                        })
                      }}
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
