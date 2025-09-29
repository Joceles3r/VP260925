import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight, BookOpen, Users, Monitor, Euro, MessageCircle, FileText, Shield, Scale, AlertTriangle } from 'lucide-react';

export default function InfoPage() {
  const [activeSection, setActiveSection] = useState('plateforme');

  const sections = [
    { id: 'plateforme', title: 'Plateforme', icon: Monitor },
    { id: 'comment-ca-marche', title: 'Comment ça marche', icon: BookOpen },
    { id: 'decouvrir-les-projets', title: 'Découvrir les projets', icon: Users },
    { id: 'live-shows', title: 'Live Shows', icon: Monitor },
    { id: 'tarifs', title: 'Tarifs', icon: Euro },
    { id: 'support', title: 'Support', icon: MessageCircle },
    { id: 'centre-daide', title: 'Centre d\'aide', icon: MessageCircle },
    { id: 'contact', title: 'Contact', icon: MessageCircle },
    { id: 'statut', title: 'Statut', icon: Monitor },
    { id: 'blog', title: 'Blog', icon: FileText },
    { id: 'legal-index', title: 'Légal (index)', icon: Scale },
    { id: 'mentions-legales', title: 'Mentions légales', icon: FileText },
    { id: 'confidentialite', title: 'Confidentialité', icon: Shield },
    { id: 'cgu', title: 'CGU', icon: Scale },
    { id: 'compliance-amf', title: 'Compliance AMF', icon: AlertTriangle }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'plateforme':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Plateforme
            </h1>
            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                VISUAL est une plateforme hybride <strong className="text-[#00D1FF]">streaming + micro‑investissement</strong> qui permet :
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  aux <strong>porteurs</strong> de publier des visuels (films, vidéos, documentaires, livres, Live Shows) et de monétiser ;
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  aux <strong>investi‑lecteurs / investisseurs</strong> de soutenir un projet avec de <strong className="text-[#FF3CAC]">petits montants (2–20 €)</strong>, d'influencer les classements et, selon les règles, d'être <strong>récompensés</strong> ;
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  aux <strong>visiteurs</strong> de découvrir et d'acheter des contenus à l'unité (prix des porteurs : <strong>2/3/4/5/10 €</strong>, max <strong>10 €</strong>).
                </li>
              </ul>

              <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Règles clés</h3>
                <ul className="space-y-2">
                  <li>• Évènements de catégorie (vidéo) : <strong>40 %</strong> investisseurs TOP 10 / <strong>30 %</strong> porteurs TOP 10 / <strong>7 %</strong> investisseurs rangs 11–100 / <strong>23 %</strong> VISUAL.</li>
                  <li>• Ventes directes (articles/livres) : <strong>70 %</strong> créateur / <strong>30 %</strong> VISUAL.</li>
                  <li>• <strong>Arrondis</strong> : paiements utilisateurs arrondis <strong>à l'euro inférieur</strong> ; restes intégrés à VISUAL.</li>
                  <li>• <strong>Extension (repêchage)</strong> : <strong>25 €</strong> (modifiable).</li>
                  <li>• <strong>VISUpoints</strong> convertibles à partir de <strong>2 500 pts</strong> (KYC/Stripe requis).</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'comment-ca-marche':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Comment ça marche
            </h1>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border border-[#00D1FF]/20 p-6">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Côté porteur</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Inscription et vérification (KYC si nécessaire).</li>
                  <li>2. Dépôt du visuel (média, description, prix <strong>2/3/4/5/10 €</strong> – max 10 €).</li>
                  <li>3. Publication en catégorie (ou Livres / Live Show) + options promo éventuelles.</li>
                  <li>4. Suivi des ventes et des classements. Reversements automatiques (Stripe).</li>
                </ol>
              </div>

              <div className="bg-card rounded-lg border border-[#7B2CFF]/20 p-6">
                <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Côté investisseur</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Création de compte.</li>
                  <li>2. Choix du projet et <strong>montant d'investissement (2–20 €)</strong> selon la catégorie (Voix de l'Info : micro‑prix 0,20–10 €).</li>
                  <li>3. Votes / engagement → impacte le classement et la redistribution.</li>
                  <li>4. À la <strong>clôture</strong>, calcul des parts (selon règles) et virement du montant dû.</li>
                </ol>
              </div>

              <div className="bg-card rounded-lg border border-[#FF3CAC]/20 p-6">
                <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Côté visiteur</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Découverte libre (extraits gratuits, recommandations).</li>
                  <li>2. Achat unitaire d'un visuel (prix du porteur).</li>
                  <li>3. (Option) Création de compte investisseur par la suite.</li>
                </ol>
              </div>
            </div>
          </div>
        );

      case 'decouvrir-les-projets':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Découvrir les projets
            </h1>
            <div className="space-y-4 text-muted-foreground">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  Filtres : <strong>catégorie</strong>, <strong>prix</strong>, <strong>durée</strong>, <strong>langue</strong>, <strong>popularité</strong>, <strong>nouveautés</strong>.
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  Fiches projet : bande‑annonce/extrait, synopsis, équipe, objectifs, <strong>barre d'engagement</strong>.
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  Signaux de confiance : historique du porteur, notes, mentions presse (si dispo).
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#00D1FF] mt-1 mr-2" />
                  Accessibilité : sous‑titres <strong>VTT/SRT</strong>, descriptions courtes, lecteur optimisé.
                </li>
              </ul>
            </div>
          </div>
        );

      case 'live-shows':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Live Shows
            </h1>
            <div className="space-y-4 text-muted-foreground">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#FF3CAC] mt-1 mr-2" />
                  Sessions en direct (créateurs, masterclass, coulisses).
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#FF3CAC] mt-1 mr-2" />
                  Ouverture d'un Live : indication <strong className="text-red-500">🔴 En direct</strong> + compteur de spectateurs.
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#FF3CAC] mt-1 mr-2" />
                  Achats/investissements possibles pendant le Live (règles de la catégorie vidéo).
                </li>
                <li className="flex items-start">
                  <ChevronRight className="w-4 h-4 text-[#FF3CAC] mt-1 mr-2" />
                  Replays : disponibles selon droits du porteur.
                </li>
              </ul>
            </div>
          </div>
        );

      case 'tarifs':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Tarifs
            </h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Prix porteurs & investissements</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Prix porteurs (unitaires)</strong> : 2, 3, 4, 5, 10 €, <strong>max 10 €</strong>.</li>
                  <li>• <strong>Tranches d'investissement (standard)</strong> : 2, 3, 4, 5, 6, 8, 10, 12, 15, 20 €.</li>
                  <li>• <strong>Voix de l'Info</strong> (articles) : micro‑prix 0,20–10 € (côté lecteur), créateur 0,20–5 €.</li>
                  <li>• <strong>Extension / repêchage</strong> : <strong>25 €</strong> (pour prolonger la fenêtre d'une catégorie, selon règles).</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-[#FF3CAC]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#FF3CAC]/20">
                <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Commissions & taxes</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Commission VISUAL</strong> : 30 % sur ventes directes ; 23 % sur évènements de catégorie (selon répartition globale).</li>
                  <li>• Taxes (TVA, etc.) : affichage clair au checkout.</li>
                  <li className="text-sm italic">(*) Tous les montants sont en <strong>EUR</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Support
            </h1>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-xl font-semibold mb-4">Besoin d'aide ?</h3>
              <div className="space-y-3 text-muted-foreground">
                <p>• Centre d'aide : <strong className="text-[#00D1FF]">support.visual.fr</strong></p>
                <p>• Email support : <strong className="text-[#00D1FF]">support@visual.fr</strong></p>
                <p>• Horaires : <strong>Lun-Ven 9h-18h</strong></p>
                <p>• Téléphone : <strong>+33 1 XX XX XX XX</strong></p>
                <p>• Adresse postale (support) : <strong>VISUAL SAS, 123 Avenue des Champs-Élysées, 75008 Paris</strong></p>
              </div>
            </div>
          </div>
        );

      case 'centre-daide':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Centre d'aide
            </h1>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Rubriques principales :</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Compte & sécurité (2FA, récupération, KYC)',
                  'Paiements & retraits (Stripe, délais, idempotence)',
                  'Publier un projet (médias, sous‑titres, prix)',
                  'Investir & redistributions (2–20 €, règles TOP 10, 11–100)',
                  'VISUpoints & fidélité (conversion à partir de 2 500 pts)',
                  'Problèmes techniques (lecteur, CDN, cache)',
                  'Légal & conformité (disclaimer, CGU, confidentialité)'
                ].map((rubrique, index) => (
                  <div key={index} className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-muted-foreground">{rubrique}</p>
                  </div>
                ))}
              </div>
              <p className="text-center">Contact direct : <strong className="text-[#00D1FF]">support@visual.fr</strong></p>
            </div>
          </div>
        );

      case 'legal-index':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Légal (index)
            </h1>
            <div className="space-y-4">
              <p className="text-muted-foreground">Retrouvez nos documents :</p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Mentions légales', id: 'mentions-legales' },
                  { title: 'Confidentialité (Politique de protection des données)', id: 'confidentialite' },
                  { title: 'CGU (Conditions générales d\'utilisation)', id: 'cgu' },
                  { title: 'Compliance AMF (informations réglementaires)', id: 'compliance-amf' },
                  { title: 'Cookies (bannière, préférences)', id: 'cookies' }
                ].map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveSection(doc.id)}
                    className="bg-card p-4 rounded-lg border border-border text-left hover:border-[#00D1FF]/50 transition-colors"
                    data-testid={`legal-nav-${doc.id}`}
                  >
                    <p className="text-foreground hover:text-[#00D1FF]">{doc.title}</p>
                  </button>
                ))}
              </div>
              <p className="text-center">Pour toute question : <strong className="text-[#00D1FF]">legal@visual.fr</strong></p>
            </div>
          </div>
        );

      case 'mentions-legales':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Mentions légales
            </h1>
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Éditeur du site</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Raison sociale : <strong>VISUAL SAS</strong></p>
                  <p>• Forme juridique : <strong>Société par Actions Simplifiée</strong></p>
                  <p>• Capital social : <strong>100 000 €</strong></p>
                  <p>• Siège social : <strong>123 Avenue des Champs-Élysées, 75008 Paris, France</strong></p>
                  <p>• RCS/SIREN : <strong>XXX XXX XXX RCS Paris</strong></p>
                  <p>• N° TVA intracommunautaire : <strong>FR XX XXX XXX XXX</strong></p>
                  <p>• Directeur de la publication : <strong>Jean Dupont</strong> — <strong>contact@visual.fr</strong></p>
                  <p>• Contact : <strong>contact@visual.fr</strong> — <strong>+33 1 XX XX XX XX</strong></p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Hébergeur du site</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Nom : <strong>Replit Inc.</strong></p>
                    <p>• Adresse : <strong>San Francisco, CA, USA</strong></p>
                    <p>• Téléphone : <strong>+1-XXX-XXX-XXXX</strong></p>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Streaming des médias</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p>• Nom : <strong>Replit Object Storage</strong></p>
                    <p>• Adresse : <strong>San Francisco, CA, USA</strong></p>
                    <p>• Téléphone : <strong>+1-XXX-XXX-XXXX</strong></p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-4">Propriété intellectuelle & Responsabilité</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Les contenus publiés par les porteurs restent leur propriété. Les porteurs garantissent détenir les droits nécessaires.</p>
                  <p>• Les marques, logos et éléments de VISUAL appartiennent à <strong>VISUAL SAS</strong>.</p>
                  <p>• VISUAL met à disposition une plateforme technique. Les porteurs restent responsables de leurs contenus.</p>
                  <p>• En cas de signalement, écrire à <strong className="text-[#00D1FF]">legal@visual.fr</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'confidentialite':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Confidentialité (Politique de protection des données)
            </h1>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Responsable de traitement</h3>
                <p className="text-muted-foreground">
                  <strong>VISUAL SAS</strong> — Adresse : <strong>123 Avenue des Champs-Élysées, 75008 Paris</strong> — Contact DPO : <strong>dpo@visual.fr</strong>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-[#7B2CFF] mb-2">Base légale</h4>
                    <p className="text-sm text-muted-foreground">Exécution du contrat (comptes/achats), intérêt légitime (sécurité, lutte anti‑fraude), consentement (marketing/cookies).</p>
                  </div>
                  
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-[#7B2CFF] mb-2">Données collectées</h4>
                    <p className="text-sm text-muted-foreground">Identité, contact, contenus, logs techniques, paiements (via prestataire).</p>
                  </div>

                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-[#7B2CFF] mb-2">Finalités</h4>
                    <p className="text-sm text-muted-foreground">Fourniture du service, paiement, modération, amélioration produit, assistance, obligations légales.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-[#FF3CAC] mb-2">Destinataires</h4>
                    <p className="text-sm text-muted-foreground">Prestataires techniques (hébergement/streaming, paiements, emailing), strictement nécessaires.</p>
                  </div>
                  
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-[#FF3CAC] mb-2">Durées de conservation</h4>
                    <p className="text-sm text-muted-foreground">Comptes (tant que service), logs (2 ans), facturation (10 ans).</p>
                  </div>

                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-[#FF3CAC] mb-2">Droits RGPD</h4>
                    <p className="text-sm text-muted-foreground">Accès, rectification, effacement, opposition, limitation, portabilité. Demandes : <strong>dpo@visual.fr</strong>.</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-4">Sécurité & Cookies</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• <strong>Sécurité</strong> : 2FA, chiffrement en transit, journalisation signée, revue régulière.</p>
                  <p>• <strong>Cookies</strong> : bandeau de consentement et page préférences disponibles.</p>
                  <p>• <strong>Mises à jour</strong> : publication sur cette page (date en tête).</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cgu':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              CGU (Conditions générales d'utilisation)
            </h1>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Objet</h3>
                <p className="text-muted-foreground">
                  Les présentes CGU régissent l'accès au site/app VISUAL et l'utilisation des services (streaming, publication, investissement, achats).
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Comptes & sécurité</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>• Âge minimum : <strong>18 ans</strong>.</li>
                    <li>• Un compte par personne ; informations exactes et mises à jour.</li>
                    <li>• Protection des identifiants ; activation <strong>2FA</strong> recommandée/obligatoire pour opérations sensibles.</li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Contenus & droits</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>• Les porteurs doivent détenir tous les droits.</li>
                    <li>• Contenus interdits : illégaux, haineux, diffamatoires, contrefaisants, NSFW non autorisé, etc.</li>
                    <li>• VISUAL peut retirer/suspendre un contenu en cas de non‑conformité.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-4">Paiements & répartition</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Paiements traités par <strong>Stripe</strong> (ou prestataire équivalent).</li>
                  <li>• <strong>Ventes directes</strong> : 70 % créateur / 30 % VISUAL (au centime près).</li>
                  <li>• <strong>Évènements de catégorie (vidéo)</strong> : 40/30/7/23 (arrondis à l'euro inférieur pour paiements utilisateurs).</li>
                  <li>• <strong>VISUpoints</strong> : convertibles à partir de 2 500 pts, sous KYC ; l'équivalence indiciaire peut varier.</li>
                  <li>• <strong>Extension</strong> : prestation optionnelle à <strong>25 €</strong> (modifiable).</li>
                  <li>• Les montants reversés peuvent être soumis à fiscalité (responsabilité de l'utilisateur).</li>
                </ul>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Sanctions</h3>
                  <p className="text-muted-foreground text-sm">
                    VISUAL peut suspendre/fermer un compte en cas de fraude, abus, non‑respect des CGU.
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Limitation de responsabilité</h3>
                  <p className="text-muted-foreground text-sm">
                    Service "en l'état", meilleurs efforts pour disponibilité et sécurité. VISUAL n'est pas responsable des pertes indirectes, ni des décisions d'investissement des utilisateurs.
                  </p>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border text-center">
                <h3 className="text-xl font-semibold mb-4">Contact</h3>
                <p className="text-muted-foreground">
                  <strong className="text-[#00D1FF]">legal@visual.fr</strong> — <strong>+33 1 XX XX XX XX</strong>
                </p>
              </div>
            </div>
          </div>
        );

      case 'compliance-amf':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Compliance AMF (informations réglementaires)
            </h1>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 rounded-lg border border-orange-500/20">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
                  <h3 className="text-xl font-semibold text-orange-500">Nature de VISUAL</h3>
                </div>
                <div className="space-y-2 text-muted-foreground">
                  <p>• VISUAL est une plateforme <strong>de contenus & micro‑engagements</strong> qui intègre un mécanisme de <strong>redistribution</strong> défini par des règles publiques (ex. 40/30/7/23).</p>
                  <p>• VISUAL <strong>n'est pas un conseiller en investissement</strong> et ne fournit <strong>aucune recommandation personnalisée</strong>.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Cadre réglementaire</h3>
                  <div className="space-y-2 text-muted-foreground text-sm">
                    <p>• Selon la structuration juridique retenue, certaines activités peuvent relever de régimes spécifiques (ex. <strong>financement participatif</strong> / régime européen ECSPR, statut national équivalent, ou activités hors périmètre).</p>
                    <p>• Si une <strong>autorisation / immatriculation</strong> est requise, VISUAL opérera sous le statut : <strong>PSFP agréé</strong> — Numéro d'enregistrement : <strong>XX-XXX-XXX</strong>.</p>
                    <p>• Prestataire de paiement : <strong>Stripe</strong> — conformité KYC/AML applicable.</p>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Avertissements & risques</h3>
                  <div className="space-y-2 text-muted-foreground text-sm">
                    <p>• Les montants engagés comportent un <strong>risque de perte</strong> ; <strong>aucune garantie de gain</strong>.</p>
                    <p>• Les performances passées ne préjugent pas des performances futures.</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-4">Réclamations & médiation</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>• Procédure de réclamation : <strong className="text-[#00D1FF]">compliance@visual.fr</strong></p>
                  <p>• Médiateur compétent : <strong>Médiateur de l'AMF</strong></p>
                  <p>• Responsable conformité : <strong>Marie Martin</strong> — <strong className="text-[#00D1FF]">compliance@visual.fr</strong></p>
                  <p>• Adresse postale : <strong>VISUAL SAS, 123 Avenue des Champs-Élysées, 75008 Paris</strong></p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-4 rounded-lg border border-[#00D1FF]/20 text-center">
                <p className="text-sm text-muted-foreground">
                  <strong>Mises à jour</strong> : Cette page est révisée périodiquement afin de refléter l'évolution du cadre réglementaire et du statut de VISUAL.
                </p>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Contact
            </h1>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg border border-border" data-testid="contact-general">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Informations générales</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>• <strong>Éditeur</strong> : VISUAL SAS</p>
                  <p>• <strong>Adresse du siège</strong> : 123 Avenue des Champs-Élysées, 75008 Paris, France</p>
                  <p>• <strong>Téléphone</strong> : +33 1 XX XX XX XX</p>
                  <p>• <strong>Email général</strong> : <strong className="text-[#00D1FF]">contact@visual.fr</strong></p>
                  <p>• <strong>Heures d'ouverture</strong> : Lun-Ven 9h-18h, Sam 10h-16h</p>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border border-border" data-testid="contact-team">
                <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Équipe dirigeante</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>• <strong>Directeur de la publication</strong> : Jean Dupont</p>
                  <p>• <strong>DPO (données personnelles)</strong> : Marie Martin — <strong className="text-[#7B2CFF]">dpo@visual.fr</strong></p>
                  <p>• <strong>Responsable conformité</strong> : Pierre Dubois — <strong className="text-[#7B2CFF]">compliance@visual.fr</strong></p>
                  <p>• <strong>Support technique</strong> : <strong className="text-[#7B2CFF]">support@visual.fr</strong></p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'statut':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Statut
            </h1>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-lg border border-green-500/20" data-testid="status-main">
                <h3 className="text-xl font-semibold text-green-500 mb-4">🟢 Tous les services sont opérationnels</h3>
                <p className="text-muted-foreground">Suivi temps réel de l'infrastructure et incidents : <strong className="text-[#00D1FF]">status.visual.fr</strong></p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border" data-testid="uptime-target">
                  <h4 className="font-semibold text-[#00D1FF] mb-2">Objectif de disponibilité</h4>
                  <p className="text-2xl font-bold text-[#00D1FF]">99,9%</p>
                  <p className="text-sm text-muted-foreground">Uptime cible</p>
                </div>
                
                <div className="bg-card p-6 rounded-lg border border-border" data-testid="incident-history">
                  <h4 className="font-semibold text-[#7B2CFF] mb-2">Historique</h4>
                  <p className="text-sm text-muted-foreground">Historique des incidents disponible sur notre page de statut</p>
                  <p className="text-xs text-[#7B2CFF] mt-2">status.visual.fr/historique</p>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border" data-testid="alerts-subscription">
                  <h4 className="font-semibold text-[#FF3CAC] mb-2">Alertes</h4>
                  <p className="text-sm text-muted-foreground">Abonnement alertes par email ou RSS</p>
                  <p className="text-xs text-[#FF3CAC] mt-2">status.visual.fr/alertes</p>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-4">Services surveillés</h3>
                <div className="space-y-3">
                  {[
                    { service: 'Interface web', status: 'Opérationnel', color: 'text-green-500' },
                    { service: 'API VISUAL', status: 'Opérationnel', color: 'text-green-500' },
                    { service: 'Streaming vidéo', status: 'Opérationnel', color: 'text-green-500' },
                    { service: 'Paiements (Stripe)', status: 'Opérationnel', color: 'text-green-500' },
                    { service: 'Stockage fichiers', status: 'Opérationnel', color: 'text-green-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded" data-testid={`service-${index}`}>
                      <span className="text-foreground">{item.service}</span>
                      <span className={`text-sm font-medium ${item.color}`}>🟢 {item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'blog':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Blog
            </h1>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20" data-testid="blog-intro">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Le Blog VISUAL</h3>
                <p className="text-muted-foreground">
                  Découvrez les dernières actualités, guides pratiques et retours d'expérience de la communauté VISUAL.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  URL : <strong className="text-[#00D1FF]">blog.visual.fr</strong>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border" data-testid="blog-content-types">
                  <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Le Blog VISUAL couvre :</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-[#7B2CFF] mt-1 mr-2" />
                      Cas d'usage & retours d'expérience de porteurs
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-[#7B2CFF] mt-1 mr-2" />
                      Nouveautés produit, IA & créa
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-[#7B2CFF] mt-1 mr-2" />
                      Guides : monétiser un court, lancer un Live Show, publier un livre
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="w-4 h-4 text-[#7B2CFF] mt-1 mr-2" />
                      Mises à jour légales & sécurité
                    </li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border" data-testid="blog-recent">
                  <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Articles récents</h3>
                  <div className="space-y-3">
                    {[
                      'Comment optimiser votre campagne VISUAL',
                      'Nouveaux tarifs 2-20€ : guide complet',
                      'Live Shows : meilleures pratiques',
                      'VISUpoints : tout savoir sur la conversion'
                    ].map((title, index) => (
                      <div key={index} className="p-3 bg-muted rounded text-sm" data-testid={`article-${index}`}>
                        <p className="text-foreground font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Il y a {index + 1} jour{index > 0 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] bg-clip-text text-transparent">
              Cookies
            </h1>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-6 rounded-lg border border-[#00D1FF]/20" data-testid="cookies-intro">
                <h3 className="text-xl font-semibold text-[#00D1FF] mb-4">Politique de cookies</h3>
                <p className="text-muted-foreground">
                  VISUAL utilise des cookies pour améliorer votre expérience utilisateur et analyser l'utilisation de notre plateforme.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border border-border" data-testid="cookies-essential">
                  <h3 className="text-xl font-semibold text-[#7B2CFF] mb-4">Cookies essentiels</h3>
                  <div className="space-y-2 text-muted-foreground text-sm">
                    <p>• <strong>Authentification</strong> : maintien de votre session de connexion</p>
                    <p>• <strong>Sécurité</strong> : protection contre les attaques CSRF</p>
                    <p>• <strong>Préférences</strong> : sauvegarde de vos réglages (langue, thème)</p>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border" data-testid="cookies-analytics">
                  <h3 className="text-xl font-semibold text-[#FF3CAC] mb-4">Cookies analytiques</h3>
                  <div className="space-y-2 text-muted-foreground text-sm">
                    <p>• <strong>Usage</strong> : analyse des pages visitées et du comportement utilisateur</p>
                    <p>• <strong>Performance</strong> : optimisation de la plateforme</p>
                    <p>• <strong>Statistiques</strong> : métriques anonymisées</p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border" data-testid="cookies-management">
                <h3 className="text-xl font-semibold mb-4">Gestion des cookies</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>• <strong>Banneau de consentement</strong> : affiché lors de votre première visite</p>
                  <p>• <strong>Préférences</strong> : modifiables à tout moment via les paramètres de votre compte</p>
                  <p>• <strong>Refus</strong> : possible pour les cookies non-essentiels sans impact sur les fonctionnalités de base</p>
                  <p>• <strong>Durée</strong> : cookies de session (supprimés à la fermeture) et persistants (maximum 13 mois)</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12" data-testid="section-default">
            <div className="bg-gradient-to-r from-[#00D1FF]/10 to-[#7B2CFF]/10 p-8 rounded-lg border border-[#00D1FF]/20 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-[#00D1FF] mb-2">Section non trouvée</h2>
              <p className="text-muted-foreground mb-4">
                La section demandée n'existe pas ou est en cours de développement.
              </p>
              <button
                onClick={() => setActiveSection('plateforme')}
                className="px-4 py-2 bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] text-white rounded-lg hover:opacity-90 transition-opacity"
                data-testid="return-to-platform"
              >
                Retour à la section Plateforme
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="info-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-8 bg-card rounded-lg border border-border p-6">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-[#00D1FF] mr-2" />
                <h2 className="text-xl font-bold">VISUAL — Chapitres</h2>
              </div>
              
              <nav className="space-y-2" data-testid="info-navigation">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                      activeSection === section.id
                        ? 'bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    aria-current={activeSection === section.id ? 'page' : undefined}
                    data-testid={`nav-${section.id}`}
                  >
                    <section.icon className="w-4 h-4 mr-2" />
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-border">
                <Link href="/visual" className="block">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] text-white rounded-lg hover:opacity-90 transition-opacity" data-testid="back-to-visual">
                    ← Retour à VISUAL
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-card rounded-lg border border-border p-8" data-testid={`section-${activeSection}`}>
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}