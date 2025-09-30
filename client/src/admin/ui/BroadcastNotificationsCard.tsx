import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { postJSON } from "../utils/api";
import { Send, Users, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

export function BroadcastNotificationsCard() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetAudience, setTargetAudience] = useState("all");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Erreur",
        description: "Titre et message requis",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const response = await postJSON("/api/admin/broadcast", {
        title,
        message,
        type,
        targetAudience,
      });

      toast({
        title: "Notification envoyée",
        description: `${response.sentCount || 0} utilisateurs ont reçu la notification`,
      });

      setTitle("");
      setMessage("");
      setType("info");
      setTargetAudience("all");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = () => {
    const icons: Record<string, any> = {
      info: <Info className="w-4 h-4" />,
      success: <CheckCircle className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      error: <AlertCircle className="w-4 h-4" />,
    };
    return icons[type] || icons.info;
  };

  const getTypeColor = () => {
    const colors: Record<string, string> = {
      info: "from-blue-500/5",
      success: "from-green-500/5",
      warning: "from-yellow-500/5",
      error: "from-red-500/5",
    };
    return colors[type] || colors.info;
  };

  return (
    <div className={`rounded-2xl border border-pink-500/30 p-5 bg-gradient-to-b ${getTypeColor()} to-transparent`}>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        📢 Notifications broadcast
        <Badge variant="outline" className="text-xs">
          <Users className="w-3 h-3 mr-1" /> Tous les utilisateurs
        </Badge>
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Type de notification</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-black/40 border-pink-500/30" data-testid="select-notification-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  Information
                </div>
              </SelectItem>
              <SelectItem value="success">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Succès
                </div>
              </SelectItem>
              <SelectItem value="warning">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Avertissement
                </div>
              </SelectItem>
              <SelectItem value="error">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  Erreur/Urgent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-2">Public cible</label>
          <Select value={targetAudience} onValueChange={setTargetAudience}>
            <SelectTrigger className="bg-black/40 border-pink-500/30" data-testid="select-target-audience">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              <SelectItem value="investors">Investisseurs uniquement</SelectItem>
              <SelectItem value="creators">Créateurs uniquement</SelectItem>
              <SelectItem value="kyc_verified">Utilisateurs KYC vérifiés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-2">Titre</label>
          <Input
            placeholder="Titre de la notification..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/40 border-pink-500/30"
            maxLength={100}
            data-testid="input-notification-title"
          />
          <div className="text-xs opacity-50 mt-1">{title.length}/100</div>
        </div>

        <div>
          <label className="block text-sm mb-2">Message</label>
          <Textarea
            placeholder="Votre message aux utilisateurs..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-black/40 border-pink-500/30 min-h-[120px]"
            maxLength={500}
            data-testid="textarea-notification-message"
          />
          <div className="text-xs opacity-50 mt-1">{message.length}/500</div>
        </div>

        <div className="rounded-xl border border-pink-500/20 p-4 bg-black/40">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            {getTypeIcon()}
            Aperçu
          </div>
          <div className="text-sm opacity-70">
            <div className="font-semibold mb-1">{title || "Titre de la notification"}</div>
            <div>{message || "Votre message apparaîtra ici..."}</div>
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full bg-pink-500 hover:bg-pink-600"
          data-testid="button-send-broadcast"
        >
          {sending ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Envoyer la notification
            </>
          )}
        </Button>

        <div className="text-xs opacity-50 text-center">
          ⚠️ Cette action enverra une notification à {targetAudience === "all" ? "tous les utilisateurs" : "un groupe spécifique"} de la plateforme
        </div>
      </div>
    </div>
  );
}
