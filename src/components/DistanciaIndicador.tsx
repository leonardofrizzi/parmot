"use client"

import { useEffect, useState } from "react"
import { Navigation } from "lucide-react"
import { buscarCoordenadas, calcularDistanciaKm, formatarDistancia } from "@/lib/distancia"

interface DistanciaIndicadorProps {
  cidadeOrigem: string
  estadoOrigem: string
  cidadeDestino: string
  estadoDestino: string
  className?: string
  showIcon?: boolean
}

export default function DistanciaIndicador({
  cidadeOrigem,
  estadoOrigem,
  cidadeDestino,
  estadoDestino,
  className = "",
  showIcon = true
}: DistanciaIndicadorProps) {
  const [distancia, setDistancia] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calcularDistancia = async () => {
      // Se mesma cidade e estado, distância é praticamente 0
      if (
        cidadeOrigem?.toLowerCase() === cidadeDestino?.toLowerCase() &&
        estadoOrigem === estadoDestino
      ) {
        setDistancia(0)
        setLoading(false)
        return
      }

      try {
        const [coordsOrigem, coordsDestino] = await Promise.all([
          buscarCoordenadas(cidadeOrigem, estadoOrigem),
          buscarCoordenadas(cidadeDestino, estadoDestino)
        ])

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

    if (cidadeOrigem && estadoOrigem && cidadeDestino && estadoDestino) {
      calcularDistancia()
    } else {
      setLoading(false)
    }
  }, [cidadeOrigem, estadoOrigem, cidadeDestino, estadoDestino])

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
        {distancia === 0 ? "Mesma cidade" : formatarDistancia(distancia)}
      </span>
    </span>
  )
}
