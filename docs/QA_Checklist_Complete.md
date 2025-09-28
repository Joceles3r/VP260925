# QA Checklist Complet - VISUAL Platform

## 🎯 Fonctionnalités Core

### Authentification & Sécurité
- [ ] **Replit Auth** : Connexion/déconnexion fonctionnelle
- [ ] **Sessions** : Persistance utilisateur entre rechargements
- [ ] **KYC/2FA** : Vérification identité pour retraits
- [ ] **Rate limiting** : Protection anti-spam sur API
- [ ] **Audit logs** : Traçabilité actions sensibles

### Système d'investissement
- [ ] **Montants corrects** par catégorie (voir VISUAL_CONSTANTS)
- [ ] **Mapping votes** : 2€→1 vote, 20€→10 votes
- [ ] **Calculs ROI** : Précision au centime
- [ ] **Arrondis** : Euro inférieur utilisateurs, restes → VISUAL
- [ ] **Stripe** : Paiements sécurisés avec webhooks

## 📚 Catégorie Livres (Mensuelle)

### Calendrier
- [ ] **Ouverture** : 1er mois 00:00:00 (Europe/Paris)
- [ ] **Clôture** : Dernier jour 23:59:59 (28/29/30/31)
- [ ] **DST** : Changement heure sans décalage
- [ ] **Compte à rebours** : Affichage correct temps restant

### Classement & Redistribution
- [ ] **TOP 10** : Sélection par votes
- [ ] **Coefficient engagement** : Tri final correct
- [ ] **Pot mensuel** : 60% auteurs / 40% lecteurs
- [ ] **Auto-report** : TOP 10 → mois suivant
- [ ] **Repêchage** : 25€ sous 24h (rangs 11-100)

## 🎬 Catégories Vidéo

### Règles financières
- [ ] **Tranches** : 2,3,4,5,6,8,10,12,15,20€
- [ ] **Prix porteurs** : 2,3,4,5,10€ (max 10€)
- [ ] **Redistribution** : 40/30/7/23 correcte
- [ ] **Ventes unitaires** : 70% créateur / 30% VISUAL

## 📰 Les Voix de l'Info

### Micro-paiements
- [ ] **Micro-prix** : 0,20; 0,50; 1; 2; 3; 4; 5€
- [ ] **Tranches lecteurs** : 0,20 à 10€
- [ ] **Split vente** : 70/30 au centime près
- [ ] **Interface** : Adaptée aux petits montants

## 📢 Petites Annonces

### Fonctionnalités
- [ ] **10 photos max** : Upload, réordonnancement, cover
- [ ] **Formats** : JPEG/PNG/WebP, 10Mo max
- [ ] **Modération** : IA + humaine, NSFW détecté
- [ ] **Escrow** : 5% + frais Stripe, médiation
- [ ] **Thématique** : Audiovisuel/spectacle uniquement
- [ ] **Hors redistribution** : Pas de 40/30/7/23

### Sécurité
- [ ] **EXIF supprimés** : Géolocalisation, métadonnées
- [ ] **Thumbnails** : 320/640/1280px générés
- [ ] **CDN** : Cache, purge à modification
- [ ] **Alt textes** : Accessibilité requise

## 🔄 Toggles ON/OFF

### API
- [ ] **Endpoint public** : `/api/public/toggles`
- [ ] **Cache** : 5 secondes, headers corrects
- [ ] **i18n** : Messages localisés backend
- [ ] **Admin** : PATCH pour modification

### Interface
- [ ] **Placeholders OFF** : "Catégorie en travaux"
- [ ] **Boutons désactivés** : TOP 10 si catégorie OFF
- [ ] **Messages** : Traduits selon langue
- [ ] **SEO** : noindex sur pages OFF

## 🌍 Internationalisation

### Langues
- [ ] **FR/EN/ES** : Toutes chaînes traduites
- [ ] **Routing** : /fr, /en, /es fonctionnel
- [ ] **Détection** : Langue navigateur → pré-sélection
- [ ] **Fallback** : FR → EN si traduction manquante

### SEO multilingue
- [ ] **hreflang** : Balises sur toutes pages
- [ ] **Sitemaps** : Un par langue + index
- [ ] **Canonical** : URLs correctes
- [ ] **Schema.org** : Multilingue

### Formats locaux
- [ ] **Monnaie** : €, décimales selon locale
- [ ] **Dates** : Format local (DD/MM vs MM/DD)
- [ ] **Nombres** : Séparateurs corrects

## 💳 Stripe Integration

### Paiements
- [ ] **Idempotence** : Clés uniques, pas de doublons
- [ ] **Webhooks** : Signatures vérifiées
- [ ] **Connect** : Payouts créateurs
- [ ] **Remboursements** : Gestion complète

### Sécurité
- [ ] **Secrets** : Rotation testée
- [ ] **Sandbox** : Tests complets
- [ ] **Anti-fraude** : Détection patterns
- [ ] **Reporting** : CSV mensuels, reçus PDF

## 🎨 Interface Utilisateur

### Design
- [ ] **Couleurs néon** : #00D1FF, #7B2CFF, #FF3CAC
- [ ] **Animations** : 150-250ms, fluides
- [ ] **Responsive** : Mobile-first, breakpoints
- [ ] **Dark mode** : Par défaut, light optionnel

### Accessibilité
- [ ] **Contrastes** : AA minimum respecté
- [ ] **Focus** : Visible sur tous éléments
- [ ] **Alt textes** : Images décrites
- [ ] **Navigation clavier** : Complète
- [ ] **Screen readers** : ARIA labels

### Performance
- [ ] **LCP** : < 2,5s cible
- [ ] **Lazy loading** : Images, vidéos
- [ ] **Cache** : Assets statiques
- [ ] **Bundle size** : Optimisé

## 🔍 Dock de Curiosité

### Fonctionnalités
- [ ] **Compteurs live** : Spectateurs, lives, nouveaux
- [ ] **Boutons** : En direct, TOP 10, Nouveau, Surprends-moi
- [ ] **Désactivation** : TOP 10 si catégorie OFF
- [ ] **Animations** : Pulse, transitions fluides
- [ ] **Responsive** : Mobile et desktop

## 📊 Analytics & Monitoring

### Métriques
- [ ] **Curiosity CTR** : Clics dock / sessions
- [ ] **Découvertes** : Projets uniques ouverts
- [ ] **Watch time** : Temps moyen
- [ ] **Conversions** : Suivis, favoris, investissements

### Logs
- [ ] **API** : Toutes requêtes loggées
- [ ] **Erreurs** : Stack traces complètes
- [ ] **Performance** : Temps réponse
- [ ] **Sécurité** : Tentatives suspectes

## 🧪 Tests E2E

### Parcours utilisateur
- [ ] **Landing → Inscription** : Complet
- [ ] **Découverte → Investissement** : Fluide
- [ ] **Achat livre** : Paiement → téléchargement
- [ ] **Annonce** : Création → publication

### Cas limites
- [ ] **Connexion lente** : Timeouts gérés
- [ ] **Erreurs Stripe** : Messages clairs
- [ ] **Catégorie OFF** : Placeholders corrects
- [ ] **Langue inexistante** : Fallback FR

## 🚀 Déploiement

### Production
- [ ] **Variables env** : Toutes définies
- [ ] **HTTPS** : Certificats valides
- [ ] **CDN** : Assets optimisés
- [ ] **Monitoring** : Alertes configurées

### Rollback
- [ ] **Backup DB** : Avant déploiement
- [ ] **Version précédente** : Disponible
- [ ] **Tests smoke** : Post-déploiement
- [ ] **Rollback plan** : Documenté

---

## ✅ Validation finale

- [ ] **Tous les tests** passent
- [ ] **Performance** acceptable
- [ ] **Sécurité** validée
- [ ] **Accessibilité** conforme
- [ ] **Documentation** à jour

**Date de validation :** ___________  
**Validé par :** ___________  
**Version :** ___________