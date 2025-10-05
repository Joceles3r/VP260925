import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Archive,
  Filter,
  Eye,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface InternalMessage {
  id: string;
  subject: string;
  subjectCustom?: string;
  message: string;
  priority: 'urgent' | 'medium' | 'low';
  status: 'unread' | 'read' | 'in_progress' | 'resolved' | 'archived';
  adminNotes?: string;
  handledBy?: string;
  handledAt?: string;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userType: string;
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  userNickname?: string;
}

interface MessageStats {
  total: number;
  unread: number;
  urgent: number;
  inProgress: number;
  todayCount: number;
}

// Configuration des sujets
const SUBJECT_LABELS = {
  'probleme_paiement': '🔴 Problème de paiement/virement',
  'escroquerie_fraude': '🔴 Signalement d\'escroquerie/fraude',
  'erreur_prelevement': '🔴 Erreur de prélèvement/remboursement',
  'probleme_compte': '🔴 Problème d\'accès compte',
  'signalement_bug': '🟡 Signalement de bug',
  'question_projet': '🟢 Question sur un projet',
  'question_investissement': '🟢 Question sur un investissement',
  'demande_aide': '🟢 Demande d\'aide générale',
  'autre_demande': '🟢 Autre demande'
};

const PRIORITY_COLORS = {
  'urgent': 'bg-red-100 text-red-800 border-red-200',
  'medium': 'bg-orange-100 text-orange-800 border-orange-200',
  'low': 'bg-green-100 text-green-800 border-green-200'
};

const STATUS_COLORS = {
  'unread': 'bg-blue-100 text-blue-800 border-blue-200',
  'read': 'bg-gray-100 text-gray-800 border-gray-200',
  'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'resolved': 'bg-green-100 text-green-800 border-green-200',
  'archived': 'bg-slate-100 text-slate-800 border-slate-200'
};

export const InternalMessagesManager: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    subject: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const queryClient = useQueryClient();

  // Récupérer les statistiques
  const { data: stats } = useQuery<MessageStats>({
    queryKey: ['admin', 'internal-messages', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/internal-messages/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      return response.json().then(data => data.stats);
    },
    refetchInterval: 30000, // Refresh toutes les 30s
  });

  // Récupérer les messages avec filtres
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'internal-messages', 'list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/admin/internal-messages?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des messages');
      return response.json();
    },
  });

  // Mutation pour mettre à jour un message
  const updateMessage = useMutation({
    mutationFn: async ({ messageId, updates }: { messageId: string; updates: any }) => {
      const response = await fetch(`/api/admin/internal-messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'internal-messages'] });
      setShowMessageDialog(false);
    }
  });

  const handleViewMessage = async (message: InternalMessage) => {
    setSelectedMessage(message);
    setShowMessageDialog(true);
    
    // Marquer comme lu automatiquement
    if (message.status === 'unread') {
      updateMessage.mutate({
        messageId: message.id,
        updates: { status: 'read' }
      });
    }
  };

  const handleStatusChange = (status: string) => {
    if (!selectedMessage) return;
    
    updateMessage.mutate({
      messageId: selectedMessage.id,
      updates: { status }
    });
  };

  const handleAddNotes = (notes: string) => {
    if (!selectedMessage) return;
    
    updateMessage.mutate({
      messageId: selectedMessage.id,
      updates: { adminNotes: notes }
    });
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      subject: '',
      dateFrom: '',
      dateTo: '',
      userId: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messagerie Interne - Gestion Administrative
          </CardTitle>
          <CardDescription>
            Gestion des messages des utilisateurs vers les responsables VISUAL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
              <div className="text-sm text-blue-600">Total messages</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats?.unread || 0}</div>
              <div className="text-sm text-red-600">Non lus</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats?.urgent || 0}</div>
              <div className="text-sm text-orange-600">Urgents</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</div>
              <div className="text-sm text-yellow-600">En cours</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.todayCount || 0}</div>
              <div className="text-sm text-green-600">Aujourd'hui</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Statut</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="unread">Non lu</SelectItem>
                  <SelectItem value="read">Lu</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priorité</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters(f => ({ ...f, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les priorités</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="medium">🟡 Moyen</SelectItem>
                  <SelectItem value="low">🟢 Bas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sujet</Label>
              <Select value={filters.subject} onValueChange={(value) => setFilters(f => ({ ...f, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les sujets</SelectItem>
                  {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Du</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <Label>Au</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <Button onClick={resetFilters} variant="outline" size="sm">
                Réinitialiser
              </Button>
              <Button onClick={() => refetch()} size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({messagesData?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
              <p>Chargement des messages...</p>
            </div>
          ) : messagesData?.messages?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun message trouvé avec ces filtres
            </div>
          ) : (
            <div className="space-y-4">
              {messagesData?.messages?.map((message: InternalMessage) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    message.status === 'unread' ? 'border-blue-200 bg-blue-50/30' : ''
                  }`}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={PRIORITY_COLORS[message.priority]}>
                          {message.priority === 'urgent' && '🔴'}
                          {message.priority === 'medium' && '🟡'}
                          {message.priority === 'low' && '🟢'}
                          {message.priority.toUpperCase()}
                        </Badge>
                        <Badge className={STATUS_COLORS[message.status]}>
                          {message.status === 'unread' && <Eye className="h-3 w-3 mr-1" />}
                          {message.status === 'read' && <Eye className="h-3 w-3 mr-1" />}
                          {message.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                          {message.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {message.status === 'archived' && <Archive className="h-3 w-3 mr-1" />}
                          {message.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {message.emailSent && (
                          <Badge variant="outline">📧 Email envoyé</Badge>
                        )}
                      </div>
                      
                      <h4 className="font-medium mb-1">
                        {SUBJECT_LABELS[message.subject as keyof typeof SUBJECT_LABELS] || message.subject}
                        {message.subjectCustom && `: ${message.subjectCustom}`}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {message.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          👤 {message.userNickname || `${message.userFirstName} ${message.userLastName}` || message.userEmail || 'Utilisateur inconnu'}
                        </span>
                        <span>📝 {message.userType}</span>
                        <span>
                          🕒 {formatDistanceToNow(new Date(message.createdAt), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails du message */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Détails du message
                </DialogTitle>
                <DialogDescription>
                  Message de {selectedMessage.userNickname || `${selectedMessage.userFirstName} ${selectedMessage.userLastName}` || selectedMessage.userEmail}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Informations du message */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Sujet</Label>
                    <p className="font-medium">
                      {SUBJECT_LABELS[selectedMessage.subject as keyof typeof SUBJECT_LABELS]}
                      {selectedMessage.subjectCustom && `: ${selectedMessage.subjectCustom}`}
                    </p>
                  </div>
                  <div>
                    <Label>Priorité</Label>
                    <Badge className={PRIORITY_COLORS[selectedMessage.priority]}>
                      {selectedMessage.priority === 'urgent' && '🔴'}
                      {selectedMessage.priority === 'medium' && '🟡'}
                      {selectedMessage.priority === 'low' && '🟢'}
                      {selectedMessage.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label>Statut actuel</Label>
                    <Badge className={STATUS_COLORS[selectedMessage.status]}>
                      {selectedMessage.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label>Email envoyé</Label>
                    <p>{selectedMessage.emailSent ? '✅ Oui' : '❌ Non'}</p>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <Label>Message</Label>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {/* Informations utilisateur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Utilisateur</Label>
                    <p>{selectedMessage.userNickname || `${selectedMessage.userFirstName} ${selectedMessage.userLastName}` || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{selectedMessage.userEmail || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <Label>Type de profil</Label>
                    <p>{selectedMessage.userType}</p>
                  </div>
                  <div>
                    <Label>Date de création</Label>
                    <p>{new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                {/* Actions administrateur */}
                <div className="space-y-4 border-t pt-4">
                  <Label>Actions administrateur</Label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('read')}
                      disabled={selectedMessage.status === 'read'}
                    >
                      Marquer comme lu
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={selectedMessage.status === 'in_progress'}
                    >
                      En cours
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('resolved')}
                      disabled={selectedMessage.status === 'resolved'}
                    >
                      Résolu
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange('archived')}
                      disabled={selectedMessage.status === 'archived'}
                    >
                      Archiver
                    </Button>
                  </div>

                  {/* Notes administrateur */}
                  <div>
                    <Label>Notes internes</Label>
                    <Textarea
                      defaultValue={selectedMessage.adminNotes || ''}
                      placeholder="Ajoutez vos notes internes..."
                      rows={3}
                      onBlur={(e) => handleAddNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};