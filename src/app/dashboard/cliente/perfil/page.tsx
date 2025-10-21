"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LocationSelects } from "@/components/LocationSelects"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  estado: string
}

export default function PerfilCliente() {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
  })

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setCliente(user)
      setFormData({
        nome: user.nome,
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
      const response = await fetch("/api/cliente/atualizar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: cliente?.id,
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
      localStorage.setItem('usuario', JSON.stringify(data.cliente))
      setCliente(data.cliente)
      setSuccess("Perfil atualizado com sucesso!")
      setEditMode(false)
      setLoading(false)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  if (!cliente) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e senha</p>
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

      <div className="max-w-2xl">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  disabled={!editMode}
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
                          nome: cliente.nome,
                          email: cliente.email,
                          telefone: cliente.telefone,
                          cidade: cliente.cidade || "",
                          estado: cliente.estado || "",
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
