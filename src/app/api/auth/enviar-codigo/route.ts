import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { isValidEmail } from '@/lib/validations'

// Gerar código de 6 dígitos
function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  console.log('=== ENVIAR CÓDIGO DE VERIFICAÇÃO ===')

  try {
    const body = await request.json()
    const { email, tipo = 'cadastro' } = body
    console.log('Email:', email, 'Tipo:', tipo)

    if (!email) {
      console.log('ERRO: Email não fornecido')
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar se já existe um código válido (não expirado) para este email
    const { data: codigoExistente } = await supabase
      .from('verificacao_email')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('tipo', tipo)
      .eq('verificado', false)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Se já existe um código válido enviado há menos de 1 minuto, não reenviar
    if (codigoExistente) {
      const createdAt = new Date(codigoExistente.created_at)
      const agora = new Date()
      const diffMinutos = (agora.getTime() - createdAt.getTime()) / 1000 / 60

      if (diffMinutos < 1) {
        return NextResponse.json(
          { error: 'Aguarde 1 minuto antes de solicitar outro código' },
          { status: 429 }
        )
      }
    }

    // Gerar novo código
    const codigo = gerarCodigo()
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    // Salvar código no banco
    console.log('Salvando código no banco...')
    const { error: insertError } = await supabase
      .from('verificacao_email')
      .insert({
        email: email.toLowerCase(),
        codigo,
        tipo,
        expira_em: expiraEm.toISOString()
      })

    if (insertError) {
      console.error('ERRO ao salvar código:', insertError)
      console.error('Código:', insertError.code)
      console.error('Detalhes:', insertError.details)
      return NextResponse.json(
        { error: 'Erro ao gerar código de verificação' },
        { status: 500 }
      )
    }
    console.log('✓ Código salvo no banco')

    // Enviar email com o código
    console.log('Enviando email via Resend...')
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: tipo === 'cadastro'
          ? 'Seu código de verificação - Parmot Serviços'
          : 'Recuperação de senha - Parmot Serviços',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                          Parmot Serviços
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                          ${tipo === 'cadastro' ? 'Confirme seu email' : 'Recuperação de senha'}
                        </h2>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          ${tipo === 'cadastro'
                            ? 'Use o código abaixo para confirmar seu email e finalizar seu cadastro:'
                            : 'Use o código abaixo para redefinir sua senha:'}
                        </p>

                        <!-- Código -->
                        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 25px; text-align: center; margin: 0 0 30px 0;">
                          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">
                            ${codigo}
                          </span>
                        </div>

                        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                          Este código expira em <strong>15 minutos</strong>.
                        </p>

                        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
                          Se você não solicitou este código, ignore este email.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} Parmot Serviços. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      })
      console.log('✓ Email enviado com sucesso')
    } catch (emailError) {
      console.error('ERRO ao enviar email:', emailError)
      // Em desenvolvimento, vamos retornar o código para teste
      if (process.env.NODE_ENV === 'development') {
        console.log('Modo desenvolvimento - retornando código para teste')
        return NextResponse.json({
          message: 'Código gerado (modo desenvolvimento)',
          codigo_teste: codigo // REMOVER EM PRODUÇÃO
        })
      }
      return NextResponse.json(
        { error: 'Erro ao enviar email. Verifique se o email está correto.' },
        { status: 500 }
      )
    }

    console.log('=== CÓDIGO ENVIADO COM SUCESSO ===')
    return NextResponse.json({
      message: 'Código enviado para seu email'
    })

  } catch (error) {
    console.error('=== ERRO FATAL ENVIAR CÓDIGO ===')
    console.error('Erro:', error)
    if (error instanceof Error) {
      console.error('Mensagem:', error.message)
      console.error('Stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
