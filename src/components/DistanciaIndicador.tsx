"use client"

import { useEffect, useState } from "react"
import { Navigation } from "lucide-react"
import { buscarCoordenadas, buscarCoordenadasPorCep, calcularDistanciaKm, formatarDistancia } from "@/lib/distancia"

interface DistanciaIndicadorProps {
  cidadeOrigem: string
  estadoOrigem: string
  cidadeDestino: string
  estadoDestino: string
  cepOrigem?: string
  cepDestino?: string
  className?: string
  showIcon?: boolean
}

export default function DistanciaIndicador({
  cidadeOrigem,
  estadoOrigem,
  cidadeDestino,
  estadoDestino,
  cepOrigem,
  cepDestino,
  className = "",
  showIcon = true
}: DistanciaIndicadorProps) {
  const [distancia, setDistancia] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calcularDistancia = async () => {
      try {
        let coordsOrigem = null
        let coordsDestino = null

        // Tentar buscar por CEP primeiro (mais preciso)
        if (cepOrigem) {
          coordsOrigem = await buscarCoordenadasPorCep(cepOrigem)
        }
        if (!coordsOrigem && cidadeOrigem && estadoOrigem) {
          coordsOrigem = await buscarCoordenadas(cidadeOrigem, estadoOrigem)
        }

        if (cepDestino) {
          coordsDestino = await buscarCoordenadasPorCep(cepDestino)
        }
        if (!coordsDestino && cidadeDestino && estadoDestino) {
          coordsDestino = await buscarCoordenadas(cidadeDestino, estadoDestino)
        }

        if (coordsOrigem && coordsDestino) {
          const dist = calcularDistanciaKm(
            coordsOrigem.lat,
            coordsOrigem.lng,
            coordsDestino.lat,
            coordsDestino.lng
          )
          setDistancia(dist)
        }
      } catch (err) {
        console.error('Erro ao calcular distância:', err)
      } finally {
        setLoading(false)
      }
    }

    // Precisa ter pelo menos cidade/estado OU cep para ambos
    const temOrigem = cepOrigem || (cidadeOrigem && estadoOrigem)
    const temDestino = cepDestino || (cidadeDestino && estadoDestino)

    if (temOrigem && temDestino) {
      calcularDistancia()
    } else {
      setLoading(false)
    }
  }, [cidadeOrigem, estadoOrigem, cidadeDestino, estadoDestino, cepOrigem, cepDestino])

  if (loading) {
    return (
      <span className={`flex items-center gap-1 text-gray-400 ${className}`}>
        {showIcon && <Navigation size={14} className="animate-pulse" />}
        <span className="text-sm">...</span>
      </span>
    )
  }

  if (distancia === null) {
    return null
  }

  // Cores baseadas na distância
  const getCorDistancia = (km: number) => {
    if (km < 5) return "text-green-600"
    if (km < 20) return "text-blue-600"
    if (km < 50) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <span className={`flex items-center gap-1 ${getCorDistancia(distancia)} ${className}`}>
      {showIcon && <Navigation size={14} />}
      <span className="text-sm font-medium">
        {formatarDistancia(distancia)}
      </span>
    </span>
  )
}
