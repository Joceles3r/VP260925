import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { VideoUploadForm } from "@/components/bunny/VideoUploadForm";
import { UsageEstimateCard } from "@/components/bunny/UsageEstimateCard";
import { Video, Film } from "lucide-react";

export default function CreatorVideosPage() {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user
  });

  const creatorProjects = Array.isArray(projects) 
    ? projects.filter((p: any) => p.creatorId === user?.id)
    : [];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Connectez-vous pour accéder à cette page</p>
        </Card>
      </div>
    );
  }

  if (user.profileType !== 'creator' && user.profileType !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-neon-purple" />
          <h2 className="text-xl font-bold mb-2">Accès Créateur Requis</h2>
          <p className="text-muted-foreground">
            Cette fonctionnalité est réservée aux porteurs de projet avec profil Créateur
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Video className="w-8 h-8 text-neon-purple" />
          <h1 className="text-3xl font-bold">Dépôt Vidéo Bunny.net</h1>
        </div>
        <p className="text-muted-foreground">
          Hébergez vos vidéos avec protection anti-piratage et tarification VISUAL
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 animate-pulse">
            <div className="h-96 bg-muted rounded"></div>
          </Card>
          <Card className="p-6 animate-pulse">
            <div className="h-64 bg-muted rounded"></div>
          </Card>
        </div>
      ) : creatorProjects.length === 0 ? (
        <Card className="p-8 text-center">
          <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
          <p className="text-muted-foreground">
            Créez d'abord un projet pour pouvoir y déposer des vidéos
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VideoUploadForm projects={creatorProjects} />
          <UsageEstimateCard />
        </div>
      )}

      <div className="mt-8 p-6 rounded-lg border border-neon-cyan/30 bg-neon-cyan/5">
        <h3 className="font-semibold mb-3">Tarification Bunny.net via VISUAL</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-neon-cyan">Clip (≤10min)</div>
            <div className="text-muted-foreground">Tarif unique : 2€</div>
          </div>
          <div>
            <div className="font-semibold text-neon-purple">Documentaire (≤30min)</div>
            <div className="text-muted-foreground">Tarif unique : 5€</div>
          </div>
          <div>
            <div className="font-semibold text-neon-pink">Film (≤4h)</div>
            <div className="text-muted-foreground">Tarif unique : 10€</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Protection anti-piratage incluse : tokens HMAC, expiration 30min, 3 lectures max, IP + User-Agent
        </div>
      </div>
    </div>
  );
}
