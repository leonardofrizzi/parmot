import imageCompression from 'browser-image-compression'

/**
 * Comprime uma imagem mantendo qualidade legível para documentos
 * Uma foto de 5MB vira ~300-500KB
 */
export async function compressImage(file: File): Promise<File> {
  // Se não for imagem, retorna o arquivo original (ex: PDF)
  if (!file.type.startsWith('image/')) {
    return file
  }

  const options = {
    maxSizeMB: 1,           // Tamanho máximo: 1MB
    maxWidthOrHeight: 1600, // Largura/altura máxima - suficiente pra ler documentos
    useWebWorker: true,     // Usar web worker (não trava a tela)
    fileType: 'image/jpeg' as const,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    console.log(`Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
    return compressedFile
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error)
    return file // Retorna original se falhar
  }
}
