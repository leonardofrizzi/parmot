// Coordenadas centrais das cidades/estados brasileiros
// Usaremos geocodificação para cidades específicas quando possível

export const coordenadasEstados: Record<string, { lat: number; lng: number }> = {
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

// Fórmula de Haversine para calcular distância entre duas coordenadas
export function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Cache de geocodificação para evitar chamadas repetidas
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {}

// Buscar coordenadas pelo CEP usando ViaCEP + Nominatim
export async function buscarCoordenadasPorCep(
  cep: string
): Promise<{ lat: number; lng: number } | null> {
  const cepLimpo = cep?.replace(/\D/g, '')
  if (!cepLimpo || cepLimpo.length !== 8) return null

  const cacheKey = `cep-${cepLimpo}`
  if (geocodeCache[cacheKey] !== undefined) {
    return geocodeCache[cacheKey]
  }

  try {
    // Primeiro buscar dados do CEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const viaCepData = await viaCepResponse.json()

    if (viaCepData.erro) {
      geocodeCache[cacheKey] = null
      return null
    }

    // Montar query com logradouro + bairro + cidade + estado para maior precisão
    const partes = []
    if (viaCepData.logradouro) partes.push(viaCepData.logradouro)
    if (viaCepData.bairro) partes.push(viaCepData.bairro)
    if (viaCepData.localidade) partes.push(viaCepData.localidade)
    if (viaCepData.uf) partes.push(viaCepData.uf)
    partes.push('Brasil')

    const query = encodeURIComponent(partes.join(', '))
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`,
      {
        headers: {
          'User-Agent': 'ParmotServicos/1.0'
        }
      }
    )

    const nominatimData = await nominatimResponse.json()

    if (nominatimData && nominatimData.length > 0) {
      const coords = {
        lat: parseFloat(nominatimData[0].lat),
        lng: parseFloat(nominatimData[0].lon)
      }
      geocodeCache[cacheKey] = coords
      return coords
    }

    // Fallback: tentar só com cidade + estado
    if (viaCepData.localidade && viaCepData.uf) {
      const coords = await buscarCoordenadas(viaCepData.localidade, viaCepData.uf)
      geocodeCache[cacheKey] = coords
      return coords
    }

    geocodeCache[cacheKey] = null
    return null
  } catch (err) {
    console.error('Erro ao buscar coordenadas por CEP:', err)
    geocodeCache[cacheKey] = null
    return null
  }
}

export async function buscarCoordenadas(
  cidade: string,
  estado: string
): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `${cidade}-${estado}`.toLowerCase()

  if (geocodeCache[cacheKey] !== undefined) {
    return geocodeCache[cacheKey]
  }

  // Fallback se não tiver cidade
  if (!cidade || !estado) {
    const fallback = coordenadasEstados[estado] || null
    geocodeCache[cacheKey] = fallback
    return fallback
  }

  try {
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
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
      geocodeCache[cacheKey] = coords
      return coords
    }
  } catch (err) {
    console.error('Erro ao buscar coordenadas:', err)
  }

  // Fallback para coordenadas do estado
  const fallback = coordenadasEstados[estado] || null
  geocodeCache[cacheKey] = fallback
  return fallback
}

// Formatar distância para exibição
export function formatarDistancia(km: number): string {
  if (km < 1) {
    return 'Menos de 1 km'
  } else if (km < 10) {
    return `${km.toFixed(1)} km`
  } else {
    return `${Math.round(km)} km`
  }
}
