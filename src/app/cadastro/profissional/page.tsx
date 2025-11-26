"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationSelects } from "@/components/LocationSelects"
import { Upload, FileText, X, Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"

type TipoProfissional = "autonomo" | "empresa"
type Etapa = "email" | "verificacao" | "dados"

export default function CadastroProfissional() {
  const [etapa, setEtapa] = useState<Etapa>("email")
  const [tipo, setTipo] = useState<TipoProfissional>("autonomo")
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpfCnpj: "",
    razaoSocial: "",
    cidade: "",
    estado: "",
    senha: "",
    confirmarSenha: "",
  })
  const [codigoVerificacao, setCodigoVerificacao] = useState("")
  const [documento, setDocumento] = useState<File | null>(null)
  const [aceiteTermos, setAceiteTermos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [tempoReenvio, setTempoReenvio] = useState(0)

  // Enviar código de verificação
  const enviarCodigo = async () => {
    if (!formData.email) {
      setError("Digite seu email")
      return
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          tipo: "cadastro"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao enviar código")
        setLoading(false)
        return
      }

      // Iniciar contador de reenvio (60 segundos)
      setTempoReenvio(60)
      const interval = setInterval(() => {
        setTempoReenvio(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setEtapa("verificacao")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Verificar código
  const verificarCodigo = async () => {
    if (!codigoVerificacao || codigoVerificacao.length !== 6) {
      setError("Digite o código de 6 dígitos")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          codigo: codigoVerificacao,
          tipo: "cadastro"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Código inválido")
        setLoading(false)
        return
      }

      setEtapa("dados")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validar termos
    if (!aceiteTermos) {
      setError("Você precisa aceitar os termos de uso")
      setLoading(false)
      return
    }

    // Validar senhas
    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (formData.senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setLoading(false)
      return
    }

    // Validar documento (obrigatório)
    if (!documento) {
      setError("O documento de identificação é obrigatório")
      setLoading(false)
      return
    }

    try {
      // Primeiro, cadastrar o profissional
      const formDataToSend = new FormData()
      formDataToSend.append("tipo", tipo)
      formDataToSend.append("nome", formData.nome)
      if (formData.razaoSocial) formDataToSend.append("razaoSocial", formData.razaoSocial)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("telefone", formData.telefone)
      formDataToSend.append("cpfCnpj", formData.cpfCnpj)
      formDataToSend.append("cidade", formData.cidade)
      formDataToSend.append("estado", formData.estado)
      formDataToSend.append("senha", formData.senha)
      formDataToSend.append("email_verificado", "true") // Email já foi verificado
      if (documento) formDataToSend.append("documento", documento)

      const response = await fetch("/api/cadastro/profissional", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao cadastrar")
        setLoading(false)
        return
      }

      setSuccess(true)
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 5MB")
        return
      }
      // Validar tipo
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
      if (!allowedTypes.includes(file.type)) {
        setError("Apenas arquivos PDF, JPG ou PNG são permitidos")
        return
      }
      setDocumento(file)
      setError("")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Renderizar etapa de email
  const renderEtapaEmail = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Cadastro de Profissional
        </CardTitle>
        <CardDescription className="text-center">
          Primeiro, vamos verificar seu email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
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
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        <Button
          type="button"
          className="w-full"
          onClick={enviarCodigo}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Enviar código de verificação
            </>
          )}
        </Button>
        <div className="text-sm text-center text-gray-600">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary-600 hover:underline">
            Fazer login
          </Link>
        </div>
        <div className="text-sm text-center text-gray-600">
          É cliente?{" "}
          <Link href="/cadastro/cliente" className="text-primary-600 hover:underline">
            Cadastre-se aqui
          </Link>
        </div>
      </CardFooter>
    </Card>
  )

  // Renderizar etapa de verificação
  const renderEtapaVerificacao = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Verificar Email
        </CardTitle>
        <CardDescription className="text-center">
          Enviamos um código de 6 dígitos para <strong>{formData.email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código de verificação</Label>
          <Input
            id="codigo"
            type="text"
            placeholder="000000"
            value={codigoVerificacao}
            onChange={(e) => setCodigoVerificacao(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
        </div>
        <p className="text-xs text-gray-500 text-center">
          O código expira em 15 minutos
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        <Button
          type="button"
          className="w-full"
          onClick={verificarCodigo}
          disabled={loading || codigoVerificacao.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verificar código
            </>
          )}
        </Button>
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEtapa("email")
              setCodigoVerificacao("")
              setError("")
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={enviarCodigo}
            disabled={tempoReenvio > 0 || loading}
          >
            {tempoReenvio > 0 ? `Reenviar em ${tempoReenvio}s` : "Reenviar código"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  // Renderizar etapa de dados
  const renderEtapaDados = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Email Verificado!
        </CardTitle>
        <CardDescription className="text-center">
          Complete seu cadastro para começar a receber solicitações
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {formData.email}
            </p>
          </div>

          {/* Seletor de tipo */}
          <div className="space-y-2">
            <Label>Tipo de cadastro</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={tipo === "autonomo" ? "default" : "outline"}
                onClick={() => setTipo("autonomo")}
                className="w-full"
              >
                Autônomo
              </Button>
              <Button
                type="button"
                variant={tipo === "empresa" ? "default" : "outline"}
                onClick={() => setTipo("empresa")}
                className="w-full"
              >
                Empresa
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">
              {tipo === "autonomo" ? "Nome completo" : "Nome do responsável"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder={tipo === "autonomo" ? "Seu nome completo" : "Nome do responsável"}
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          {tipo === "empresa" && (
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social <span className="text-red-500">*</span></Label>
              <Input
                id="razaoSocial"
                name="razaoSocial"
                type="text"
                placeholder="Nome da empresa"
                value={formData.razaoSocial}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone/WhatsApp <span className="text-red-500">*</span></Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">
              {tipo === "autonomo" ? "CPF" : "CNPJ"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpfCnpj"
              name="cpfCnpj"
              type="text"
              placeholder={tipo === "autonomo" ? "000.000.000-00" : "00.000.000/0000-00"}
              value={formData.cpfCnpj}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo de Upload de Documento */}
          <div className="space-y-2">
            <Label htmlFor="documento">
              Documento de Identificação <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              {tipo === "autonomo"
                ? "RG, CNH ou Certificado MEI"
                : "Contrato Social ou Cartão CNPJ"}
            </p>

            {!documento ? (
              <label
                htmlFor="documento"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para enviar</span> ou arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 5MB)</p>
                </div>
                <input
                  id="documento"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{documento.name}</p>
                    <p className="text-xs text-gray-500">
                      {(documento.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumento(null)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <LocationSelects
            estado={formData.estado}
            cidade={formData.cidade}
            onEstadoChange={(sigla) => setFormData(prev => ({ ...prev, estado: sigla }))}
            onCidadeChange={(nome) => setFormData(prev => ({ ...prev, cidade: nome }))}
          />

          <div className="space-y-2">
            <Label htmlFor="senha">Senha <span className="text-red-500">*</span></Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar senha <span className="text-red-500">*</span></Label>
            <Input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              placeholder="Confirme sua senha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
            />
          </div>

          {/* Termos de Uso */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="aceiteTermos"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="aceiteTermos" className="text-sm text-gray-600">
              Li e concordo com os{" "}
              <Link href="/termos" className="text-primary-600 hover:underline" target="_blank">
                Termos de Uso
              </Link>
              . A Parmot atua como intermediária e não se responsabiliza por eventuais problemas entre as partes.
              <span className="text-red-500"> *</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
              Cadastro realizado com sucesso! Redirecionando...
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || success}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : "Criar conta"}
          </Button>
          <div className="text-sm text-center text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary-600 hover:underline">
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      {etapa === "email" && renderEtapaEmail()}
      {etapa === "verificacao" && renderEtapaVerificacao()}
      {etapa === "dados" && renderEtapaDados()}
    </div>
  )
}
