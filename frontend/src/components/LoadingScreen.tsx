import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="relative"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">V</span>
          </div>
          
          {/* Animated Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 border-2 border-transparent border-t-primary rounded-lg"
          />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.6,
          }}
          className="text-center space-y-2"
        >
          <h2 className="text-xl font-semibold text-foreground">VISUAL</h2>
          <p className="text-sm text-muted-foreground">
            Plateforme d'Investissement de Contenus Visuels
          </p>
        </motion.div>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 0.6,
            duration: 0.4,
          }}
          className="flex space-x-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{
            delay: 1,
            duration: 2,
            ease: "easeInOut",
          }}
          className="w-48 h-1 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{
              delay: 1,
              duration: 2,
              ease: "easeInOut",
            }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </motion.div>
      </div>
    </div>
  );
}