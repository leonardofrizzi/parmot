"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"

interface Estado {
  id: number
  sigla: string
  nome: string
}

interface Cidade {
  id: number
  nome: string
}

interface LocationSelectsProps {
  estado: string
  cidade: string
  onEstadoChange: (sigla: string) => void
  onCidadeChange: (nome: string) => void
  required?: boolean
}

export function LocationSelects({
  estado,
  cidade,
  onEstadoChange,
  onCidadeChange,
  required = true
}: LocationSelectsProps) {
  const [estados, setEstados] = useState<Estado[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)
  const previousEstado = useRef(estado)

  useEffect(() => {
    // Carregar estados da API do IBGE
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setEstados(data))
      .catch(err => console.error('Erro ao carregar estados:', err))
  }, [])

  useEffect(() => {
    // Carregar cidades quando um estado for selecionado
    if (estado) {
      setLoadingCidades(true)
      setCidades([])

      // Só limpa a cidade se o estado realmente mudou
      if (previousEstado.current !== estado) {
        onCidadeChange("")
        previousEstado.current = estado
      }

      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios?orderBy=nome`)
        .then(res => res.json())
        .then(data => {
          setCidades(data)
          setLoadingCidades(false)
        })
        .catch(err => {
          console.error('Erro ao carregar cidades:', err)
          setLoadingCidades(false)
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <select
          id="estado"
          name="estado"
          value={estado}
          onChange={(e) => onEstadoChange(e.target.value)}
          required={required}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Selecione o estado</option>
          {estados.map(estado => (
            <option key={estado.id} value={estado.sigla}>
              {estado.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cidade">Cidade</Label>
        <select
          id="cidade"
          name="cidade"
          value={cidade}
          onChange={(e) => onCidadeChange(e.target.value)}
          required={required}
          disabled={!estado || loadingCidades}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {loadingCidades ? "Carregando..." : !estado ? "Selecione o estado primeiro" : "Selecione a cidade"}
          </option>
          {cidades.map(cidade => (
            <option key={cidade.id} value={cidade.nome}>
              {cidade.nome}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
