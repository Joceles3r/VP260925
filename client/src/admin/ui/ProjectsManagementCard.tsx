import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getJSON, postJSON, patchJSON } from "../utils/api";
import { Search, CheckCircle, XCircle, Star, Eye, Ban } from "lucide-react";

type Project = {
  id: number;
  title: string;
  description: string;
  category: string;
  creatorId: number;
  targetAmount: string;
  currentAmount: string;
  status: string;
  mlScore: number;
  roiEstimated: string;
  investorCount: number;
  createdAt: string;
};

export function ProjectsManagementCard() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | "suspend" | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getJSON("/api/admin/projects");
      setProjects(data.projects || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedProject) return;
    
    try {
      await patchJSON(`/api/admin/projects/${selectedProject.id}/status`, { status: 'active' });
      toast({
        title: "Projet approuvé",
        description: `${selectedProject.title} est maintenant actif`,
      });
      setShowDialog(false);
      loadProjects();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver le projet",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedProject) return;
    
    try {
      await patchJSON(`/api/admin/projects/${selectedProject.id}/status`, { status: 'rejected' });
      toast({
        title: "Projet rejeté",
        description: `${selectedProject.title} a été rejeté`,
      });
      setShowDialog(false);
      loadProjects();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le projet",
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async () => {
    if (!selectedProject) return;
    
    try {
      await patchJSON(`/api/admin/projects/${selectedProject.id}/status`, { status: 'suspended' });
      toast({
        title: "Projet suspendu",
        description: `${selectedProject.title} a été suspendu`,
      });
      setShowDialog(false);
      loadProjects();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de suspendre le projet",
        variant: "destructive",
      });
    }
  };

  const openDialog = (project: Project, actionType: "approve" | "reject" | "suspend") => {
    setSelectedProject(project);
    setAction(actionType);
    setShowDialog(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase()) ||
                         project.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: <Eye className="w-3 h-3 mr-1" />, label: "En attente" },
      active: { variant: "default", icon: <CheckCircle className="w-3 h-3 mr-1" />, label: "Actif" },
      rejected: { variant: "destructive", icon: <XCircle className="w-3 h-3 mr-1" />, label: "Rejeté" },
      suspended: { variant: "outline", icon: <Ban className="w-3 h-3 mr-1" />, label: "Suspendu" },
      completed: { variant: "default", icon: <Star className="w-3 h-3 mr-1" />, label: "Complété" },
    };
    
    const { variant, icon, label } = variants[status] || variants.pending;
    return (
      <Badge variant={variant} className="text-xs">
        {icon} {label}
      </Badge>
    );
  };

  return (
    <>
      <div className="rounded-2xl border border-violet-500/30 p-5 bg-gradient-to-b from-violet-500/5 to-transparent">
        <h2 className="text-xl font-semibold mb-4">📁 Gestion des projets</h2>
        
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input
              placeholder="Rechercher un projet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-black/40 border-violet-500/30"
              data-testid="input-search-projects"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-black/40 border-violet-500/30" data-testid="select-status-filter">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="completed">Complété</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-black/40 border-violet-500/30" data-testid="select-category-filter">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="video">Vidéo</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="art">Art</SelectItem>
              <SelectItem value="animation">Animation</SelectItem>
              <SelectItem value="vr">VR/AR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="rounded-xl border border-violet-500/20 p-4 bg-black/40"
              data-testid={`project-row-${project.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium" data-testid={`text-project-title-${project.id}`}>
                      {project.title}
                    </span>
                    {getStatusBadge(project.status)}
                    <Badge variant="outline" className="text-xs">{project.category}</Badge>
                    {project.mlScore && project.mlScore > 0.8 && (
                      <Badge className="text-xs bg-yellow-500/20 text-yellow-400">
                        <Star className="w-3 h-3 mr-1" /> ML: {(project.mlScore * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm opacity-70 mb-2 line-clamp-2">{project.description}</p>
                  <div className="flex gap-4 text-xs opacity-70">
                    <span>Objectif: {project.targetAmount}€</span>
                    <span>Levé: {project.currentAmount}€</span>
                    <span>Investisseurs: {project.investorCount || 0}</span>
                    <span>ROI estimé: {project.roiEstimated}%</span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {project.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(project, "approve")}
                        className="text-green-400 hover:text-green-300"
                        data-testid={`button-approve-${project.id}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(project, "reject")}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-reject-${project.id}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {project.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(project, "suspend")}
                      className="text-orange-400 hover:text-orange-300"
                      data-testid={`button-suspend-${project.id}`}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8 opacity-50">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun projet trouvé</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0b0b0f] border-violet-500/30">
          <DialogHeader>
            <DialogTitle>
              {action === "approve" && "Approuver le projet"}
              {action === "reject" && "Rejeter le projet"}
              {action === "suspend" && "Suspendre le projet"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedProject && (
              <>
                <p className="mb-4">
                  Projet: <strong>{selectedProject.title}</strong>
                </p>
                
                {action === "approve" && (
                  <p className="text-green-400">✓ Le projet sera activé et visible aux investisseurs.</p>
                )}
                
                {action === "reject" && (
                  <p className="text-red-400">✗ Le projet sera rejeté et non visible.</p>
                )}
                
                {action === "suspend" && (
                  <p className="text-orange-400">⚠️ Le projet sera suspendu temporairement.</p>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} data-testid="button-cancel-action">
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (action === "approve") handleApprove();
                else if (action === "reject") handleReject();
                else if (action === "suspend") handleSuspend();
              }}
              className="bg-violet-500 hover:bg-violet-600"
              data-testid="button-confirm-action"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
