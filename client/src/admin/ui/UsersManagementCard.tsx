import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getJSON, postJSON, patchJSON } from "../utils/api";
import { Search, UserX, Shield, CheckCircle, XCircle, Edit, Ban } from "lucide-react";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileType: string;
  kycVerified: boolean;
  balanceEUR: string;
  totalInvested: string;
  createdAt: string;
};

export function UsersManagementCard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<"ban" | "verify" | "role" | null>(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getJSON("/api/admin/users");
      setUsers(data.users || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      await postJSON(`/api/admin/users/${selectedUser.id}/ban`, {});
      toast({
        title: "Utilisateur banni",
        description: `${selectedUser.email} a été banni avec succès`,
      });
      setShowDialog(false);
      loadUsers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de bannir l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleVerifyKYC = async () => {
    if (!selectedUser) return;
    
    try {
      await patchJSON(`/api/admin/users/${selectedUser.id}/kyc`, { verified: true });
      toast({
        title: "KYC vérifié",
        description: `KYC approuvé pour ${selectedUser.email}`,
      });
      setShowDialog(false);
      loadUsers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le KYC",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    
    try {
      await patchJSON(`/api/admin/users/${selectedUser.id}/role`, { profileType: newRole });
      toast({
        title: "Rôle modifié",
        description: `Rôle changé en ${newRole} pour ${selectedUser.email}`,
      });
      setShowDialog(false);
      loadUsers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
    }
  };

  const openDialog = (user: User, actionType: "ban" | "verify" | "role") => {
    setSelectedUser(user);
    setAction(actionType);
    setNewRole(user.profileType);
    setShowDialog(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.profileType === roleFilter;
    const matchesKYC = kycFilter === "all" || 
                       (kycFilter === "verified" && user.kycVerified) ||
                       (kycFilter === "unverified" && !user.kycVerified);
    return matchesSearch && matchesRole && matchesKYC;
  });

  return (
    <>
      <div className="rounded-2xl border border-cyan-500/30 p-5 bg-gradient-to-b from-cyan-500/5 to-transparent">
        <h2 className="text-xl font-semibold mb-4">👥 Gestion des utilisateurs</h2>
        
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-black/40 border-cyan-500/30"
              data-testid="input-search-users"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] bg-black/40 border-cyan-500/30" data-testid="select-role-filter">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="investor">Investisseur</SelectItem>
              <SelectItem value="creator">Créateur</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="infoporteur">Infoporteur</SelectItem>
            </SelectContent>
          </Select>

          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger className="w-[180px] bg-black/40 border-cyan-500/30" data-testid="select-kyc-filter">
              <SelectValue placeholder="Statut KYC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="verified">Vérifié</SelectItem>
              <SelectItem value="unverified">Non vérifié</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="rounded-xl border border-cyan-500/20 p-4 bg-black/40 flex items-center justify-between"
              data-testid={`user-row-${user.id}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium" data-testid={`text-user-email-${user.id}`}>{user.email}</span>
                  <Badge variant={user.kycVerified ? "default" : "secondary"} className="text-xs">
                    {user.kycVerified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {user.kycVerified ? "KYC ✓" : "KYC ✗"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{user.profileType}</Badge>
                </div>
                <div className="text-sm opacity-70 mt-1">
                  {user.firstName} {user.lastName} • Balance: {user.balanceEUR}€ • Investi: {user.totalInvested}€
                </div>
              </div>
              
              <div className="flex gap-2">
                {!user.kycVerified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(user, "verify")}
                    className="text-green-400 hover:text-green-300"
                    data-testid={`button-verify-kyc-${user.id}`}
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog(user, "role")}
                  className="text-cyan-400 hover:text-cyan-300"
                  data-testid={`button-change-role-${user.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog(user, "ban")}
                  className="text-red-400 hover:text-red-300"
                  data-testid={`button-ban-user-${user.id}`}
                >
                  <Ban className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 opacity-50">
              <UserX className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0b0b0f] border-cyan-500/30">
          <DialogHeader>
            <DialogTitle>
              {action === "ban" && "Bannir l'utilisateur"}
              {action === "verify" && "Vérifier le KYC"}
              {action === "role" && "Modifier le rôle"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedUser && (
              <>
                <p className="mb-4">
                  Utilisateur: <strong>{selectedUser.email}</strong>
                </p>
                
                {action === "ban" && (
                  <p className="text-red-400">⚠️ Cette action bannira définitivement l'utilisateur.</p>
                )}
                
                {action === "verify" && (
                  <p className="text-green-400">✓ Le KYC sera marqué comme vérifié.</p>
                )}
                
                {action === "role" && (
                  <div>
                    <label className="block text-sm mb-2">Nouveau rôle:</label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="bg-black/40 border-cyan-500/30" data-testid="select-new-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investisseur</SelectItem>
                        <SelectItem value="creator">Créateur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="infoporteur">Infoporteur</SelectItem>
                        <SelectItem value="invested_reader">Investi-lecteur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                if (action === "ban") handleBanUser();
                else if (action === "verify") handleVerifyKYC();
                else if (action === "role") handleChangeRole();
              }}
              className="bg-cyan-500 hover:bg-cyan-600"
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
