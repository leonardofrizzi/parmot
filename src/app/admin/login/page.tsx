"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Mail } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    senha: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      // Salvar admin no localStorage
      localStorage.setItem('admin', JSON.stringify(data.admin))

      // Redirecionar para dashboard admin
      router.push('/admin/dashboard')

    } catch (err) {
      console.error('Erro ao fazer login:', err)
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
            <Shield size={32} className="text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Painel Admin</CardTitle>
          <CardDescription className="text-gray-400">
            Acesso restrito a administradores
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@parmot.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="flex items-center gap-2">
                <Lock size={16} />
                Senha
              </Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                placeholder="••••••••"
                value={formData.senha}
                onChange={handleChange}
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>Credenciais padrão:</p>
              <p className="font-mono text-xs mt-1">
                admin@parmot.com / admin123
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
