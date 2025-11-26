"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { MapPin, AlertCircle } from "lucide-react"

// Importação dinâmica para evitar erros de SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
)

interface MapaLocalizacaoProps {
  cidade: string
  estado: string
  className?: string
}

// Coordenadas centrais dos estados para fallback
const coordenadasEstados: Record<string, { lat: number; lng: number }> = {
  "AC": { lat: -9.0238, lng: -70.812 },
  "AL": { lat: -9.5713, lng: -36.782 },
  "AP": { lat: 1.4102, lng: -51.77 },
  "AM": { lat: -3.4168, lng: -65.8561 },
  "BA": { lat: -12.5797, lng: -41.7007 },
  "CE": { lat: -5.4984, lng: -39.3206 },
  "DF": { lat: -15.7998, lng: -47.8645 },
  "ES": { lat: -19.1834, lng: -40.3089 },
  "GO": { lat: -15.827, lng: -49.8362 },
  "MA": { lat: -4.9609, lng: -45.2744 },
  "MT": { lat: -12.6819, lng: -56.9211 },
  "MS": { lat: -20.7722, lng: -54.7852 },
  "MG": { lat: -18.5122, lng: -44.555 },
  "PA": { lat: -3.4168, lng: -52.2166 },
  "PB": { lat: -7.2399, lng: -36.782 },
  "PR": { lat: -25.4297, lng: -49.2711 },
  "PE": { lat: -8.8137, lng: -36.9541 },
  "PI": { lat: -7.7183, lng: -42.7289 },
  "RJ": { lat: -22.9068, lng: -43.1729 },
  "RN": { lat: -5.4026, lng: -36.9541 },
  "RS": { lat: -30.0346, lng: -51.2177 },
  "RO": { lat: -10.8254, lng: -63.3445 },
  "RR": { lat: 2.7376, lng: -62.0751 },
  "SC": { lat: -27.5954, lng: -48.548 },
  "SP": { lat: -23.5505, lng: -46.6333 },
  "SE": { lat: -10.5741, lng: -37.3857 },
  "TO": { lat: -10.1753, lng: -48.2982 },
}

export default function MapaLocalizacao({ cidade, estado, className = "" }: MapaLocalizacaoProps) {
  const [mounted, setMounted] = useState(false)
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Buscar coordenadas via API de geocodificação
  useEffect(() => {
    const buscarCoordenadas = async () => {
      if (!cidade || !estado) {
        // Usar fallback do estado ou Brasil central
        setCoordenadas(coordenadasEstados[estado] || { lat: -14.235, lng: -51.9253 })
        setLoading(false)
        return
      }

      try {
        // Usar API Nominatim (OpenStreetMap) para geocodificação
        const query = encodeURIComponent(`${cidade}, ${estado}, Brasil`)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
          {
            headers: {
              'User-Agent': 'ParmotServicos/1.0'
            }
          }
        )

        const data = await response.json()

        if (data && data.length > 0) {
          setCoordenadas({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          })
        } else {
          // Fallback para coordenadas do estado
          setCoordenadas(coordenadasEstados[estado] || { lat: -14.235, lng: -51.9253 })
        }
      } catch (err) {
        console.error('Erro ao buscar coordenadas:', err)
        // Fallback para coordenadas do estado
        setCoordenadas(coordenadasEstados[estado] || { lat: -14.235, lng: -51.9253 })
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    buscarCoordenadas()
  }, [cidade, estado])

  if (!mounted || loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <div className="flex flex-col items-center text-gray-500">
          <MapPin className="w-8 h-8 mb-2 animate-pulse" />
          <span className="text-sm">Carregando mapa...</span>
        </div>
      </div>
    )
  }

  if (!coordenadas) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: 200 }}>
        <div className="flex flex-col items-center text-gray-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Localização não disponível</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ minHeight: 200 }}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={[coordenadas.lat, coordenadas.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%", minHeight: 200 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Círculo para mostrar região aproximada (não localização exata) */}
        <Circle
          center={[coordenadas.lat, coordenadas.lng]}
          radius={2000}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.2,
          }}
        />
      </MapContainer>
    </div>
  )
}
