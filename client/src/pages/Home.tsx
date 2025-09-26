import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Filter,
  Search,
  Play,
  Eye,
  Heart,
  MoreVertical,
} from "lucide-react";
import { projectsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useLiveUpdates } from "@/hooks/useWebSocket";
import { formatCurrency, getCategoryColor, getStatusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterState {
  category?: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
}

export default function Home() {
  const { user } = useAuth();
  const liveUpdates = useLiveUpdates('investment');
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
  });

  const {
    data: projectsResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectsApi.getProjects({
      category: filters.category,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: 1,
      limit: 12
    }),
  });

  const projects = projectsResponse?.data || [];
  const pagination = projectsResponse?.pagination;

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const ProjectCard = ({ project }: { project: any }) => {
    const progressPercentage = project.targetAmount 
      ? (parseFloat(project.currentAmount) / parseFloat(project.targetAmount)) * 100 
      : 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-200">
          {/* Project Image/Video Thumbnail */}
          <div className="relative aspect-video bg-muted overflow-hidden">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Category Badge */}
            <Badge className={`absolute top-3 left-3 ${getCategoryColor(project.category)}`}>
              {project.category}
            </Badge>
            
            {/* Status Badge */}
            <Badge 
              variant={project.status === 'active' ? 'default' : 'secondary'}
              className="absolute top-3 right-3"
            >
              {getStatusLabel(project.status)}
            </Badge>

            {/* Actions */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir le projet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Heart className="mr-2 h-4 w-4" />
                    Ajouter aux favoris
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CardContent className="p-4">
            {/* Creator Info */}
            <div className="flex items-center space-x-2 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.creator?.profileImageUrl} />
                <AvatarFallback className="text-xs">
                  {project.creator?.firstName?.[0]}{project.creator?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate">
                {project.creator?.firstName} {project.creator?.lastName}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              <Link href={`/projects/${project.id}`}>
                {project.title}
              </Link>
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">
                  {formatCurrency(parseFloat(project.currentAmount))}
                </span>
                <span className="text-muted-foreground">
                  sur {formatCurrency(parseFloat(project.targetAmount))}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{progressPercentage.toFixed(1)}% financé</span>
                <span>{project.investorCount || 0} investisseurs</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{project.votesCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{project.investorCount || 0}</span>
                </div>
              </div>
              
              {project.mlScore && (
                <Badge variant="outline" className="text-xs">
                  Score: {parseFloat(project.mlScore).toFixed(1)}/10
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const ProjectCardSkeleton = () => (
    <Card className="h-full overflow-hidden">
      <Skeleton className="aspect-video" />
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container-xl py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bonjour {user?.firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Découvrez les projets visuels en cours de financement
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {liveUpdates.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-current rounded-full mr-2" />
                {liveUpdates.length} mise(s) à jour
              </Badge>
            )}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres et recherche</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category */}
            <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                <SelectItem value="documentaire">Documentaire</SelectItem>
                <SelectItem value="court-métrage">Court-métrage</SelectItem>
                <SelectItem value="clip">Clip</SelectItem>
                <SelectItem value="animation">Animation</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="livres">Livres</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Plus récents</SelectItem>
                <SelectItem value="currentAmount">Plus financés</SelectItem>
                <SelectItem value="investorCount">Plus d'investisseurs</SelectItem>
                <SelectItem value="votesCount">Plus de votes</SelectItem>
                <SelectItem value="mlScore">Meilleur score</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Décroissant</SelectItem>
                <SelectItem value="asc">Croissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      {!isLoading && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {pagination?.total || 0} projet(s) trouvé(s)
          </p>
          {pagination && pagination.totalPages > 1 && (
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} sur {pagination.totalPages}
            </p>
          )}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="text-4xl">😞</div>
                  <h3 className="text-lg font-semibold">Erreur de chargement</h3>
                  <p className="text-muted-foreground">
                    Impossible de charger les projets. Veuillez réessayer.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Réessayer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : projects.length === 0 ? (
          // Empty state
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🎬</div>
                  <h3 className="text-lg font-semibold">Aucun projet trouvé</h3>
                  <p className="text-muted-foreground">
                    Aucun projet ne correspond à vos critères de recherche.
                  </p>
                  <Button onClick={() => setFilters({
                    status: 'active',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    search: '',
                  })}>
                    Réinitialiser les filtres
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Projects
          projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {/* Load More */}
      {pagination && pagination.page < pagination.totalPages && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">
            Charger plus de projets
          </Button>
        </div>
      )}
    </div>
  );
}