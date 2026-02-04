import { jsPDF } from 'jspdf'

interface DadosComprovante {
  nome: string
  cpf_cnpj: string
  email: string
  tipo: string
  termos_aceitos_em: string
  termos_versao: string
  termos_ip: string
}

export function gerarComprovantePDF(dados: DadosComprovante) {
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Cores
  const corPrimaria = [37, 99, 235] as [number, number, number] // blue-600
  const corTexto = [55, 65, 81] as [number, number, number] // gray-700
  const corCinza = [107, 114, 128] as [number, number, number] // gray-500

  let y = 20

  // Cabeçalho com logo
  doc.setFillColor(...corPrimaria)
  doc.rect(0, 0, pageWidth, 35, 'F')

  // Logo: quadrado arredondado branco com ícone
  const logoX = pageWidth / 2 - 35
  const logoY = 8
  const logoSize = 18

  // Quadrado branco arredondado (fundo do ícone)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'F')

  // Desenhar ícone de capelo (graduation cap) simplificado
  doc.setFillColor(...corPrimaria)
  // Base do capelo (losango/diamante)
  const capX = logoX + logoSize / 2
  const capY = logoY + 10
  doc.triangle(capX - 7, capY, capX, capY - 5, capX + 7, capY, 'F')
  // Topo do capelo (retângulo pequeno)
  doc.rect(capX - 2, capY - 7, 4, 3, 'F')
  // Borla (linha + círculo)
  doc.setDrawColor(...corPrimaria)
  doc.setLineWidth(0.8)
  doc.line(capX + 5, capY - 2, capX + 7, capY + 4)
  doc.circle(capX + 7, capY + 5, 1, 'F')

  // Texto "Parmot" ao lado do ícone
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Parmot', logoX + logoSize + 5, logoY + 13)

  y = 46

  // Título do documento
  doc.setTextColor(...corPrimaria)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROVANTE DE ACEITE DOS TERMOS DE USO', pageWidth / 2, y, { align: 'center' })

  y += 8

  // Linha divisória
  doc.setDrawColor(...corPrimaria)
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)

  y += 10

  // Informações do profissional
  doc.setTextColor(...corTexto)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DO PROFISSIONAL', 20, y)

  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const addCampo = (label: string, valor: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...corCinza)
    doc.text(`${label}:`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...corTexto)
    doc.text(valor || 'N/A', 60, y)
    y += 5
  }

  addCampo('Nome', dados.nome)
  addCampo('CPF/CNPJ', dados.cpf_cnpj)
  addCampo('E-mail', dados.email)
  addCampo('Tipo', dados.tipo === 'autonomo' ? 'Autônomo' : 'Empresa')

  y += 4

  // Box de informações do aceite
  doc.setFillColor(240, 249, 255) // blue-50
  doc.setDrawColor(...corPrimaria)
  doc.roundedRect(20, y, pageWidth - 40, 38, 3, 3, 'FD')

  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...corPrimaria)
  doc.setFontSize(10)
  doc.text('REGISTRO DO ACEITE', pageWidth / 2, y, { align: 'center' })

  y += 8

  doc.setFontSize(9)
  doc.setTextColor(...corTexto)
  doc.setFont('helvetica', 'normal')

  const dataAceite = new Date(dados.termos_aceitos_em)
  const dataFormatada = dataAceite.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // Formatar IP para exibição
  const ipExibicao = dados.termos_ip === '::1' || dados.termos_ip === '127.0.0.1'
    ? 'localhost (desenvolvimento)'
    : dados.termos_ip

  doc.text(`Data e Hora: ${dataFormatada}`, 30, y)
  y += 5
  doc.text(`Versão dos Termos: ${dados.termos_versao}`, 30, y)
  y += 5
  doc.text(`Endereço IP: ${ipExibicao}`, 30, y)

  y += 18

  // Código de verificação
  const codigoVerificacao = gerarCodigoVerificacao(dados)

  doc.setFillColor(243, 244, 246) // gray-100
  doc.roundedRect(20, y, pageWidth - 40, 14, 3, 3, 'F')

  y += 9
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...corCinza)
  doc.text(`Código de Verificação: ${codigoVerificacao}`, pageWidth / 2, y, { align: 'center' })

  y += 12

  // Declaração
  doc.setTextColor(...corTexto)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DECLARAÇÃO', 20, y)

  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const declaracao = `Declaro que li, compreendi e aceito integralmente os Termos de Uso da plataforma Parmot, versão ${dados.termos_versao}. Estou ciente de que a Parmot atua como intermediária entre profissionais e clientes, não se responsabilizando por negociações, acordos, qualidade dos serviços prestados ou eventuais problemas decorrentes da relação entre as partes.`

  const linhasDeclaracao = doc.splitTextToSize(declaracao, pageWidth - 40)
  doc.text(linhasDeclaracao, 20, y)

  y += linhasDeclaracao.length * 3.5 + 6

  // Compromisso
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('COMPROMISSO DO PROFISSIONAL', 20, y)

  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const compromisso = `Comprometo-me a seguir as diretrizes da plataforma, manter comunicação respeitosa e profissional com os clientes, e respeitar todas as regras estabelecidas nos Termos de Uso. Reconheço que o descumprimento dessas regras pode resultar em suspensão ou banimento permanente da plataforma.`

  const linhasCompromisso = doc.splitTextToSize(compromisso, pageWidth - 40)
  doc.text(linhasCompromisso, 20, y)

  y += linhasCompromisso.length * 3.5 + 8

  // Assinatura digital
  doc.setDrawColor(...corCinza)
  doc.setLineWidth(0.3)
  doc.line(20, y, 85, y)

  y += 4
  doc.setFontSize(7)
  doc.setTextColor(...corCinza)
  doc.text('Aceite eletrônico registrado automaticamente', 20, y)
  doc.text(`em ${dataFormatada}`, 20, y + 3)

  // Rodapé (fixo no final da página)
  const footerY = pageHeight - 10

  doc.setDrawColor(229, 231, 235)
  doc.line(20, footerY - 6, pageWidth - 20, footerY - 6)

  doc.setFontSize(6)
  doc.setTextColor(...corCinza)
  doc.text('Este documento foi gerado eletronicamente e possui validade jurídica conforme Lei nº 14.063/2020 e MP 2.200-2/2001 (ICP-Brasil).', pageWidth / 2, footerY, { align: 'center' })

  // Gerar nome do arquivo
  const nomeArquivo = `comprovante_termos_${dados.cpf_cnpj.replace(/\D/g, '')}_${new Date().getTime()}.pdf`

  // Baixar o PDF
  doc.save(nomeArquivo)
}

function gerarCodigoVerificacao(dados: DadosComprovante): string {
  // Gera um código de verificação baseado nos dados
  const str = `${dados.cpf_cnpj}${dados.termos_aceitos_em}${dados.termos_versao}${dados.termos_ip}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const codigo = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return `PARMOT-${codigo.slice(0, 4)}-${codigo.slice(4, 8)}-${dados.termos_versao.replace('.', '')}`
}
