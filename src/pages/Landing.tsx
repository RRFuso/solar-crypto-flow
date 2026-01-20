import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Rocket, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Brain, 
  Eye, 
  Bell,
  CheckCircle2,
  Star,
  Twitter,
  Mail,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-landing-dark text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-landing-dark via-landing-dark to-landing-blue/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-landing-blue/20 via-transparent to-transparent" />
        
        {/* Astronaut image */}
        <div className="absolute inset-0 opacity-20 md:opacity-30 lg:opacity-40 pointer-events-none z-0">
          <img 
            src="/ChatGPT-Image-20_01_2026_-11_56_40.webp" 
            alt="Astronauta explorando o sistema solar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">

          
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-landing-blue to-landing-green bg-clip-text text-transparent">
            Domine o Mercado Crypto com Inteligência Artificial
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Visualize fluxos de capital em tempo real, detecte movimentos de smart money e tome decisões baseadas em dados — não em emoções.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-landing-blue hover:bg-landing-blue/90 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-landing-blue/25"
              asChild
            >
              <Link to="/app">
                <Rocket className="mr-2 h-5 w-5" />
                Começar Beta
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-landing-green text-landing-green hover:bg-landing-green/10 text-lg px-8 py-6 rounded-xl"
            >
              <Eye className="mr-2 h-5 w-5" />
              Ver Demo
            </Button>
          </div>
          
          {/* Value Bullets */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-landing-green" />
              <span>Dados em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-landing-green" />
              <span>IA preditiva avançada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-landing-green" />
              <span>Alertas inteligentes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-landing-dark/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            O Problema do Trader Comum
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            97% dos traders perdem dinheiro porque operam às cegas, sem acesso aos dados que os grandes players usam.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-red-950/30 border-red-500/30 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-red-400">Informação Atrasada</h3>
                <p className="text-muted-foreground">
                  Quando você vê a notícia, o movimento já aconteceu. Smart money já saiu.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-950/30 border-red-500/30 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-red-400">Dados Fragmentados</h3>
                <p className="text-muted-foreground">
                  Dezenas de ferramentas, dashboards separados. Impossível ter visão unificada.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-950/30 border-red-500/30 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-red-400">Decisões Emocionais</h3>
                <p className="text-muted-foreground">
                  FOMO, medo, ganância. Sem dados claros, suas emoções controlam suas trades.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            A Solução: <span className="text-landing-blue">Sistema Solar Crypto</span>
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Uma plataforma que unifica dados on-chain, fluxos de capital e inteligência artificial para você tomar decisões como os profissionais.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-landing-blue/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-landing-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Visualização Unificada</h3>
                  <p className="text-muted-foreground">
                    Todos os dados que você precisa em um único dashboard intuitivo e visual.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-landing-green/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-landing-green" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Tempo Real</h3>
                  <p className="text-muted-foreground">
                    Dados atualizados em segundos via WebSocket. Nunca mais perca um movimento.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-landing-orange/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-landing-orange" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">IA Preditiva</h3>
                  <p className="text-muted-foreground">
                    Algoritmos que identificam padrões antes que se tornem óbvios para o mercado.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-landing-blue/20 to-landing-green/20 border border-landing-blue/30 flex items-center justify-center backdrop-blur">
                <div className="text-center p-8">
                  <BarChart3 className="h-16 w-16 text-landing-blue mx-auto mb-4" />
                  <p className="text-muted-foreground">Preview do Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-landing-blue/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Funcionalidades Principais
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Ferramentas profissionais simplificadas para traders de todos os níveis.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 border-border/50 backdrop-blur hover:border-landing-blue/50 transition-colors">
              <CardContent className="p-6">
                <TrendingUp className="h-10 w-10 text-landing-blue mb-4" />
                <h3 className="text-lg font-semibold mb-2">Capital Flow</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize fluxos de capital entre exchanges, DeFi e wallets em tempo real.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 backdrop-blur hover:border-landing-green/50 transition-colors">
              <CardContent className="p-6">
                <Shield className="h-10 w-10 text-landing-green mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Money</h3>
                <p className="text-sm text-muted-foreground">
                  Rastreie movimentos de baleias e fundos institucionais automaticamente.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 backdrop-blur hover:border-landing-orange/50 transition-colors">
              <CardContent className="p-6">
                <Bell className="h-10 w-10 text-landing-orange mb-4" />
                <h3 className="text-lg font-semibold mb-2">Alertas</h3>
                <p className="text-sm text-muted-foreground">
                  Notificações personalizadas quando padrões importantes são detectados.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 backdrop-blur hover:border-purple-500/50 transition-colors">
              <CardContent className="p-6">
                <Brain className="h-10 w-10 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">IA Analyst</h3>
                <p className="text-sm text-muted-foreground">
                  Assistente IA que analisa dados e gera insights acionáveis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            O Que Dizem Nossos Usuários
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Traders reais, resultados reais.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Finalmente consigo ver o que as baleias estão fazendo antes que seja tarde demais. Mudou completamente minha estratégia."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-landing-blue/20 flex items-center justify-center">
                    <span className="text-sm font-bold">RC</span>
                  </div>
                  <div>
                    <p className="font-semibold">Rafael C.</p>
                    <p className="text-xs text-muted-foreground">Trader há 3 anos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "A visualização de fluxo de capital é incrível. Nunca vi nada parecido no mercado. Vale cada centavo."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-landing-green/20 flex items-center justify-center">
                    <span className="text-sm font-bold">MS</span>
                  </div>
                  <div>
                    <p className="font-semibold">Marina S.</p>
                    <p className="text-xs text-muted-foreground">Investidora DeFi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Os alertas de smart money me salvaram de várias quedas. A IA realmente entende os padrões do mercado."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-landing-orange/20 flex items-center justify-center">
                    <span className="text-sm font-bold">PA</span>
                  </div>
                  <div>
                    <p className="font-semibold">Pedro A.</p>
                    <p className="text-xs text-muted-foreground">Day trader</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-landing-blue/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
            Planos & Preços
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Escolha o plano ideal para sua jornada.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <Card className="bg-card/50 border-border/50 backdrop-blur">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Dashboard básico
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    5 visualizações/dia
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Dados com delay 15min
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/app">Começar Grátis</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Pro */}
            <Card className="bg-gradient-to-b from-landing-blue/20 to-card/50 border-landing-blue/50 backdrop-blur relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-landing-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Tudo do Free
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Dados em tempo real
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Smart Money Alerts
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    IA Analyst básico
                  </li>
                </ul>
                <Button className="w-full bg-landing-blue hover:bg-landing-blue/90" asChild>
                  <Link to="/app">Assinar Pro</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Premium */}
            <Card className="bg-gradient-to-b from-landing-orange/10 to-card/50 border-landing-orange/30 backdrop-blur">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Tudo do Pro
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    IA Analyst avançado
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    API Access
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-landing-green" />
                    Suporte prioritário
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-landing-orange text-landing-orange hover:bg-landing-orange/10" asChild>
                  <Link to="/app">Assinar Premium</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Operar como um Profissional?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a milhares de traders que já estão usando dados para vencer o mercado.
          </p>
          <Button 
            size="lg" 
            className="bg-landing-blue hover:bg-landing-blue/90 text-white text-lg px-12 py-6 rounded-xl shadow-lg shadow-landing-blue/25"
            asChild
          >
            <Link to="/app">
              <Rocket className="mr-2 h-5 w-5" />
              Começar Beta
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-muted-foreground">
              © 2025 Sistema Solar Crypto
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Email
              </a>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
