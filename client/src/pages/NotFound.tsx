import { motion } from "framer-motion";
import { Link } from "wouter";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card>
            <CardContent className="pt-6 text-center">
              {/* 404 Animation */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
              >
                <div className="text-6xl font-bold text-primary mb-2">404</div>
                <div className="text-xl text-muted-foreground mb-4">
                  Page non trouvée
                </div>
              </motion.div>

              {/* Illustration */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-6"
              >
                <div className="w-32 h-32 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-16 w-16 text-muted-foreground" />
                </div>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-8"
              >
                <h1 className="text-xl font-semibold mb-2">
                  Oups ! Cette page n'existe pas
                </h1>
                <p className="text-muted-foreground">
                  La page que vous cherchez a peut-être été supprimée, 
                  renommée ou n'existe pas.
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="space-y-3"
              >
                <Button asChild className="w-full">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Retour à l'accueil
                  </Link>
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/projects">
                      <Search className="mr-2 h-4 w-4" />
                      Projets
                    </Link>
                  </Button>
                  
                  <Button variant="outline" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Besoin d'aide ?
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <HelpCircle className="mr-2 h-3 w-3" />
                    Contactez le support
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}