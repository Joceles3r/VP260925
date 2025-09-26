import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Play,
  TrendingUp,
  Users,
  Shield,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  DollarSign,
  BarChart3,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: DollarSign,
    title: "Micro-investissements",
    description: "Investissez de €1 à €20 dans des projets visuels innovants",
    color: "bg-green-500",
  },
  {
    icon: BarChart3,
    title: "Système de vote",
    description: "Influencez les classements et soutenez les meilleurs projets",
    color: "bg-blue-500",
  },
  {
    icon: Play,
    title: "Shows en direct",
    description: "Participez aux battles d'artistes en temps réel",
    color: "bg-red-500",
  },
  {
    icon: Shield,
    title: "Plateforme sécurisée",
    description: "Conformité AMF et paiements Stripe sécurisés",
    color: "bg-purple-500",
  },
];

const stats = [
  { label: "Projets financés", value: "150+", icon: TrendingUp },
  { label: "Investisseurs actifs", value: "2.5K+", icon: Users },
  { label: "ROI moyen", value: "15%", icon: Star },
  { label: "Montant investi", value: "€250K+", icon: DollarSign },
];

const testimonials = [
  {
    name: "Marie Dubois",
    role: "Créatrice de documentaires",
    content: "VISUAL m'a permis de financer mon projet en quelques semaines. L'engagement des investisseurs est remarquable !",
    avatar: "MD",
  },
  {
    name: "Thomas Martin",
    role: "Investisseur",
    content: "J'adore pouvoir soutenir des projets créatifs avec de petits montants. Le système de vote est génial !",
    avatar: "TM",
  },
  {
    name: "Sophie Laurent",
    role: "Réalisatrice",
    content: "La plateforme parfaite pour les créateurs. Interface intuitive et communauté bienveillante.",
    avatar: "SL",
  },
];

export default function Landing() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-md flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">V</span>
              </div>
              <span className="font-bold text-xl">VISUAL</span>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/">
                  Commencer à investir
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="mb-4">
                  <Zap className="w-3 h-3 mr-1" />
                  Nouvelle plateforme
                </Badge>
                <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
                  Investissez dans le{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    futur visuel
                  </span>
                </h1>
                <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  Plateforme hybride streaming/crowdfunding qui révolutionne l'investissement 
                  dans les contenus visuels. Soutenez des créateurs, influencez les classements, 
                  et participez aux gains des projets à succès.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="flex-1">
                    <Link href="/">
                      Découvrir les projets
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Voir la démo
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md"
              >
                <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="text-center p-4 bg-background/50 rounded-lg backdrop-blur-sm"
                      >
                        <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Pourquoi choisir VISUAL ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme innovante qui combine le meilleur du streaming et du crowdfunding 
              pour créer une expérience d'investissement unique.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-lift">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Comment ça marche ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              En 3 étapes simples, commencez à investir dans l'avenir des contenus visuels
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[
              {
                step: "1",
                title: "Découvrez",
                description: "Parcourez les projets visuels en cours de financement",
                icon: Globe,
              },
              {
                step: "2", 
                title: "Investissez",
                description: "Choisissez vos projets favoris avec des montants de €1 à €20",
                icon: DollarSign,
              },
              {
                step: "3",
                title: "Gagnez",
                description: "Participez aux gains si vos projets finissent dans le TOP 10",
                icon: TrendingUp,
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                    {step.step}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Ce qu'ils en disent
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Créateurs et investisseurs font confiance à VISUAL pour leurs projets
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {testimonial.avatar}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
              Prêt à rejoindre la révolution visuelle ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Commencez dès aujourd'hui avec €10,000 en mode simulation. 
              Aucun risque, apprentissage garanti !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button size="lg" asChild className="flex-1">
                <Link href="/">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Commencer gratuitement
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Mode simulation inclus • Authentification Replit • Paiements sécurisés
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-md flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">V</span>
              </div>
              <span className="font-bold text-xl">VISUAL</span>
            </div>
            <p className="text-muted-foreground">
              Plateforme d'investissement de contenus visuels • Conformité AMF
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              © 2024 VISUAL. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}