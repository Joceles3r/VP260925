import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, CheckCircle, XCircle, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { LiveShow, LiveShowFinalist } from '@shared/schema';

interface LineupState {
  locked: boolean;
  fallbackMode: string;
  F1?: LiveShowFinalist;
  F2?: LiveShowFinalist;
  A1?: LiveShowFinalist;
  A2?: LiveShowFinalist;
}

interface AuditEntry {
  id: string;
  eventType: string;
  actorId: string;
  actorType: string;
  targetUserId: string | null;
  details: string;
  createdAt: string;
}

export default function LiveShowsAdminPanel() {
  const { toast } = useToast();
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const { data: liveShows, isLoading: isLoadingShows } = useQuery<LiveShow[]>({
    queryKey: ['/api/admin/live-shows/active'],
  });

  const { data: lineup, isLoading: isLoadingLineup } = useQuery<LineupState>({
    queryKey: ['/api/admin/live-shows', selectedShowId, 'lineup'],
    enabled: !!selectedShowId,
  });

  const { data: auditLog } = useQuery<AuditEntry[]>({
    queryKey: ['/api/admin/live-shows', selectedShowId, 'audit'],
    enabled: !!selectedShowId,
  });

  const handleLockLineup = async (showId: string | null) => {
    if (!showId) return;
    try {
      await apiRequest('POST', `/api/admin/live-shows/${showId}/lock-lineup`, {});
      
      toast({
        title: "Line-up verrouillé",
        description: "Le line-up a été verrouillé avec succès",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/live-shows/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/live-shows', showId] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de verrouiller le line-up",
        variant: "destructive",
      });
    }
  };

  const handleUnlockLineup = async (showId: string | null) => {
    if (!showId) return;
    try {
      await apiRequest('POST', `/api/admin/live-shows/${showId}/unlock-lineup`, {});
      
      toast({
        title: "Line-up déverrouillé",
        description: "Le line-up a été déverrouillé avec succès",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/live-shows/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/live-shows', showId] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de déverrouiller le line-up",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      selected: 'bg-blue-500/10 text-blue-500',
      confirmed: 'bg-green-500/10 text-green-500',
      standby: 'bg-yellow-500/10 text-yellow-500',
      cancelled: 'bg-red-500/10 text-red-500',
    };

    const labels: Record<string, string> = {
      selected: 'Sélectionné',
      confirmed: 'Confirmé',
      standby: 'En attente',
      cancelled: 'Annulé',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const renderSlot = (label: string, finalist?: LiveShowFinalist) => (
    <div className="bg-muted/30 rounded-lg p-4" data-testid={`slot-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{label}</h4>
        {finalist && finalist.status && getStatusBadge(finalist.status)}
      </div>
      
      {finalist ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground" data-testid={`${label.toLowerCase()}-artist`}>
            {finalist.artistName}
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {finalist.userId.slice(-8)}
          </div>
          {finalist.confirmedAt && (
            <div className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Confirmé le {new Date(finalist.confirmedAt).toLocaleDateString()}
            </div>
          )}
          {finalist.cancelledAt && (
            <div className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Annulé: {finalist.cancellationReason}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">Slot vacant</div>
      )}
    </div>
  );

  if (isLoadingShows) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p>Chargement des Live Shows...</p>
      </div>
    );
  }

  if (!liveShows || liveShows.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun Live Show actif</h3>
        <p className="text-muted-foreground">Créez un nouveau Live Show pour commencer</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Live Shows Actifs</h3>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">
                {liveShows.length} show{liveShows.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {liveShows.map((show: LiveShow) => (
              <div
                key={show.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedShowId === show.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedShowId(show.id)}
                data-testid={`show-card-${show.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1" data-testid="show-title">
                      {show.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {show.scheduledStart && new Date(show.scheduledStart).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        {show.lineupLocked ? (
                          <>
                            <Lock className="h-4 w-4 text-red-500" />
                            <span className="text-red-500">Verrouillé</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 text-green-500" />
                            <span className="text-green-500">Déverrouillé</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {show.lineupLocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockLineup(show.id);
                      }}
                      data-testid="unlock-lineup"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Déverrouiller
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockLineup(show.id);
                      }}
                      data-testid="lock-lineup"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Verrouiller
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedShowId && (
        <>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Line-up</h3>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {lineup?.locked ? 'Verrouillé' : 'En cours de modification'}
                  </span>
                </div>
              </div>
            </div>

            {isLoadingLineup ? (
              <div className="p-6 text-center">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Finalistes
                    </h4>
                    {renderSlot('F1', lineup?.F1)}
                    {renderSlot('F2', lineup?.F2)}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Remplaçants
                    </h4>
                    {renderSlot('A1', lineup?.A1)}
                    {renderSlot('A2', lineup?.A2)}
                  </div>
                </div>

                {lineup && !lineup.F1 && !lineup.F2 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-500 mb-1">Line-up incomplet</h4>
                      <p className="text-sm text-yellow-500/80">
                        Aucun finaliste n'a été désigné. Veuillez désigner au moins 2 finalistes (F1 et F2).
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3">Mode de Fallback</h4>
                  <div className="text-sm text-muted-foreground">
                    Mode actif: <span className="text-foreground font-medium">{lineup?.fallbackMode || 'battle'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {auditLog && auditLog.length > 0 && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Historique d'Audit</h3>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {auditLog.map((entry: AuditEntry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                      data-testid={`audit-entry-${entry.id}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {entry.eventType.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">{entry.details}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
