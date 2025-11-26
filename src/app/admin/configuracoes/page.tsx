"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Coins, Users, RefreshCw, Save, AlertCircle, CheckCircle2 } from "lucide-react"

interface Configuracoes {
  custo_contato_normal: number
  custo_contato_exclusivo: number
  max_profissionais_por_solicitacao: number
  percentual_reembolso: number
  dias_para_reembolso: number
}

export default function AdminConfiguracoes() {
  const [config, setConfig] = useState<Configuracoes>({
    custo_contato_normal: 15,
    custo_contato_exclusivo: 50,
    max_profissionais_por_solicitacao: 4,
    percentual_reembolso: 30,
    dias_para_reembolso: 7
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const fetchConfiguracoes = async () => {
    try {
      const response = await fetch('/api/admin/configuracoes')
      const data = await response.json()

      if (response.ok) {
        setConfig(data)
      }
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      const response = await fetch('/api/admin/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao salvar configurações')
        setSaving(false)
        return
      }

      setSuccess('Configurações salvas com sucesso!')
      setTimeout(() => setSuccess(""), 3000)
      setSaving(false)
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Configuracoes, value: string) => {
    const numValue = parseInt(value) || 0
    setConfig(prev => ({ ...prev, [field]: numValue }))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-9 w-64 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="text-primary-600" />
            Configurações do Sistema
          </h1>
          <p className="text-gray-600">Configure os valores de moedas, limites e reembolsos</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Custos de Moedas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="text-orange-500" size={20} />
                Custo de Moedas por Desbloqueio
              </CardTitle>
              <CardDescription>
                Defina quantas moedas o profissional precisa gastar para desbloquear o contato de um cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="custo_normal">Contato Padrão (moedas)</Label>
                  <Input
                    id="custo_normal"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.custo_contato_normal}
                    onChange={(e) => handleChange('custo_contato_normal', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Até {config.max_profissionais_por_solicitacao} profissionais podem desbloquear o mesmo pedido
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo_exclusivo">Contato Exclusivo (moedas)</Label>
                  <Input
                    id="custo_exclusivo"
                    type="number"
                    min="1"
                    max="1000"
                    value={config.custo_contato_exclusivo}
                    onChange={(e) => handleChange('custo_contato_exclusivo', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Apenas este profissional terá acesso ao contato
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limite de Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-blue-500" size={20} />
                Limite de Profissionais
              </CardTitle>
              <CardDescription>
                Quantos profissionais podem desbloquear o mesmo pedido (contato padrão)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="max_profissionais">Máximo de profissionais por pedido</Label>
                <Input
                  id="max_profissionais"
                  type="number"
                  min="1"
                  max="20"
                  value={config.max_profissionais_por_solicitacao}
                  onChange={(e) => handleChange('max_profissionais_por_solicitacao', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reembolso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="text-green-500" size={20} />
                Sistema de Reembolso
              </CardTitle>
              <CardDescription>
                Configure o percentual de reembolso quando o profissional não fecha negócio com o cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="percentual_reembolso">Percentual de reembolso (%)</Label>
                  <Input
                    id="percentual_reembolso"
                    type="number"
                    min="0"
                    max="100"
                    value={config.percentual_reembolso}
                    onChange={(e) => handleChange('percentual_reembolso', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Profissional recebe {config.percentual_reembolso}% das moedas de volta se não fechar negócio
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dias_reembolso">Dias para solicitar reembolso</Label>
                  <Input
                    id="dias_reembolso"
                    type="number"
                    min="1"
                    max="30"
                    value={config.dias_para_reembolso}
                    onChange={(e) => handleChange('dias_para_reembolso', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Profissional pode solicitar reembolso em até {config.dias_para_reembolso} dias após desbloqueio
                  </p>
                </div>
              </div>

              {/* Exemplo de cálculo */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Exemplo de cálculo:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contato padrão: {config.custo_contato_normal} moedas → Reembolso de {Math.round(config.custo_contato_normal * config.percentual_reembolso / 100)} moedas</li>
                  <li>• Contato exclusivo: {config.custo_contato_exclusivo} moedas → Reembolso de {Math.round(config.custo_contato_exclusivo * config.percentual_reembolso / 100)} moedas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="min-w-[200px]">
              {saving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
