import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen, DollarSign, AlertTriangle, Shield, Search, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AgentCoordinatorPanel from '@/components/admin/AgentCoordinatorPanel';
import VisualScoutPanel from '@/components/admin/VisualScoutPanel';
import VisualAIPanel from '@/components/admin/VisualAIPanel';
import VisualFinancePanel from '@/components/admin/VisualFinancePanel';

interface AdminStats {
}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-500" />
              Administration VISUAL
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                Agents IA Intégrés
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Contrôle des agents IA et gestion complète de la plateforme
            </p>
          </div>
          
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="visual-ai">VisualAI</TabsTrigger>
          <TabsTrigger value="finance-ai">FinanceAI</TabsTrigger>
          <TabsTrigger value="scout">VisualScout</TabsTrigger>
          <TabsTrigger value="agents">Coordination</TabsTrigger>
        </TabsList>

            </div>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AgentCoordinatorPanel />
        </TabsContent>

        <TabsContent value="scout" className="space-y-4">
          <VisualScoutPanel />
        </TabsContent>

        <TabsContent value="visual-ai" className="space-y-4">
          <VisualAIPanel />
        </TabsContent>

        <TabsContent value="finance-ai" className="space-y-4">
          <VisualFinancePanel />
        </TabsContent>
      </Tabs>
    </div>