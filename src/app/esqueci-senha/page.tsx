"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react"

type Etapa = "email" | "codigo" | "nova-senha" | "sucesso"

export default function EsqueciSenha() {
  const [etapa, setEtapa] = useState<Etapa>("email")
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Enviar código de recuperação
  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tipo: "recuperacao" }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao enviar código")
        setLoading(false)
        return
      }

      // Iniciar countdown de 60 segundos
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setEtapa("codigo")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Validar código
  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, tipo: "recuperacao" }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Código inválido")
        setLoading(false)
        return
      }

      setEtapa("nova-senha")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Trocar senha
  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (novaSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      return
    }

    // Validar senha forte (maiúscula + caractere especial)
    const temMaiuscula = /[A-Z]/.test(novaSenha)
    const temEspecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(novaSenha)
    if (!temMaiuscula || !temEspecial) {
      setError("A senha deve conter pelo menos uma letra maiúscula e um caractere especial (!@#$%...)")
      return
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaSenha }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao trocar senha")
        setLoading(false)
        return
      }

      setEtapa("sucesso")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Reenviar código
  const handleReenviarCodigo = async () => {
    if (countdown > 0) return

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tipo: "recuperacao" }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao reenviar código")
        setLoading(false)
        return
      }

      // Reiniciar countdown
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        {/* Etapa 1: Email */}
        {etapa === "email" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Esqueci minha senha
              </CardTitle>
              <CardDescription className="text-center">
                Digite seu e-mail para receber um código de recuperação
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleEnviarCodigo}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {error && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar código"
                  )}
                </Button>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar para o login
                </Link>
              </CardFooter>
            </form>
          </>
        )}

        {/* Etapa 2: Código */}
        {etapa === "codigo" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Digite o código
              </CardTitle>
              <CardDescription className="text-center">
                Enviamos um código de 6 dígitos para <strong>{email}</strong>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleValidarCodigo}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de verificação</Label>
                  <Input
                    id="codigo"
                    type="text"
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-500">
                      Reenviar código em {countdown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReenviarCodigo}
                      className="text-sm text-primary-600 hover:underline"
                      disabled={loading}
                    >
                      Reenviar código
                    </button>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {error && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || codigo.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Validar código"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setEtapa("email")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Usar outro e-mail
                </button>
              </CardFooter>
            </form>
          </>
        )}

        {/* Etapa 3: Nova Senha */}
        {etapa === "nova-senha" && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Nova senha
              </CardTitle>
              <CardDescription className="text-center">
                Digite sua nova senha
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleTrocarSenha}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova senha</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="novaSenha"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite novamente"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {error && (
                  <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar nova senha"
                  )}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {/* Etapa 4: Sucesso */}
        {etapa === "sucesso" && (
          <>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Senha alterada!
              </CardTitle>
              <CardDescription className="text-center">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
              </CardDescription>
            </CardHeader>

            <CardFooter className="flex flex-col space-y-4">
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  Ir para o login
                </Button>
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
