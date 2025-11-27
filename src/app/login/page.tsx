"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Login() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao fazer login")
        setLoading(false)
        return
      }

      // Salvar dados do usuário no localStorage
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      localStorage.setItem('tipoUsuario', data.tipo)

      // Se tem URL de redirect e é cliente, redirecionar para lá
      // Caso contrário, redirecionar para o dashboard
      if (redirectUrl && data.tipo === 'cliente') {
        window.location.href = redirectUrl
      } else {
        window.location.href = data.redirectTo
      }

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Login
          </CardTitle>
          <CardDescription className="text-center">
            Acesse sua conta para continuar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                placeholder="Sua senha"
                value={formData.senha}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {error && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-sm text-center text-gray-600">
              Não tem uma conta?{" "}
              <Link href="/cadastro/cliente" className="text-primary-600 hover:underline">
                Cadastre-se como cliente
              </Link>
              {" ou "}
              <Link href="/cadastro/profissional" className="text-primary-600 hover:underline">
                como profissional
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
