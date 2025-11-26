import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Termos de Uso - Parmot
            </CardTitle>
            <p className="text-center text-gray-500 text-sm">
              Última atualização: Novembro de 2024
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">1. Aceitação dos Termos</h2>
              <p className="text-gray-600">
                Ao acessar e usar a plataforma Parmot, você concorda com estes Termos de Uso.
                Se você não concordar com algum destes termos, não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">2. Descrição do Serviço</h2>
              <p className="text-gray-600">
                A Parmot é uma plataforma de intermediação que conecta clientes a profissionais
                da área de educação, incluindo aulas de música, reforço escolar e idiomas.
                Atuamos exclusivamente como intermediários, facilitando o contato entre as partes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">3. Responsabilidades da Parmot</h2>
              <p className="text-gray-600">
                A Parmot se compromete a:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Manter a plataforma disponível e funcional</li>
                <li>Proteger os dados pessoais dos usuários conforme a LGPD</li>
                <li>Analisar e aprovar cadastros de profissionais</li>
                <li>Mediar conflitos quando possível</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">4. Limitação de Responsabilidade</h2>
              <p className="text-gray-600 font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                A Parmot atua exclusivamente como intermediária e NÃO se responsabiliza por:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                <li>Qualidade dos serviços prestados pelos profissionais</li>
                <li>Disputas, conflitos ou problemas entre clientes e profissionais</li>
                <li>Danos diretos ou indiretos resultantes da contratação de serviços</li>
                <li>Veracidade das informações fornecidas pelos usuários</li>
                <li>Pagamentos realizados diretamente entre as partes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">5. Responsabilidades do Cliente</h2>
              <p className="text-gray-600">O cliente se compromete a:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Fornecer informações verdadeiras no cadastro</li>
                <li>Tratar os profissionais com respeito</li>
                <li>Honrar compromissos assumidos com profissionais</li>
                <li>Avaliar os serviços de forma justa e honesta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">6. Responsabilidades do Profissional</h2>
              <p className="text-gray-600">O profissional se compromete a:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Fornecer informações verdadeiras e documentação válida</li>
                <li>Prestar serviços de qualidade conforme acordado</li>
                <li>Tratar os clientes com respeito e profissionalismo</li>
                <li>Cumprir horários e compromissos assumidos</li>
                <li>Manter suas qualificações e certificações atualizadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">7. Sistema de Moedas</h2>
              <p className="text-gray-600">
                A plataforma utiliza um sistema de moedas virtuais para profissionais
                liberarem contatos de clientes. As moedas:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>São adquiridas mediante pagamento</li>
                <li>Não são reembolsáveis, exceto em casos específicos previstos</li>
                <li>Não possuem valor monetário fora da plataforma</li>
                <li>Podem ter seu valor alterado mediante aviso prévio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">8. Privacidade e Dados</h2>
              <p className="text-gray-600">
                Seus dados pessoais são tratados conforme nossa Política de Privacidade
                e em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                Utilizamos seus dados apenas para o funcionamento da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">9. Cancelamento e Suspensão</h2>
              <p className="text-gray-600">
                A Parmot reserva-se o direito de suspender ou cancelar contas que:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Violem estes Termos de Uso</li>
                <li>Forneçam informações falsas</li>
                <li>Pratiquem fraudes ou condutas inadequadas</li>
                <li>Recebam múltiplas avaliações negativas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">10. Alterações nos Termos</h2>
              <p className="text-gray-600">
                Estes termos podem ser alterados a qualquer momento. Alterações significativas
                serão comunicadas por e-mail ou pela plataforma. O uso continuado após
                alterações implica aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">11. Contato</h2>
              <p className="text-gray-600">
                Para dúvidas sobre estes Termos de Uso, entre em contato através da plataforma
                ou pelo e-mail de suporte.
              </p>
            </section>

            <div className="pt-6 border-t">
              <p className="text-center text-gray-500 text-sm">
                Ao utilizar a Parmot, você declara ter lido e concordado com todos os termos acima.
              </p>
              <div className="flex justify-center mt-4">
                <Link
                  href="/"
                  className="text-primary-600 hover:underline"
                >
                  Voltar para a página inicial
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
