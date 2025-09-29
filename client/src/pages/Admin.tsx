@@ .. @@
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Badge } from '@/componentsimport { Users, FolderOpen, DollarSign, TriangleAlert as AlertTriangle, Shield, Search, Brain } from 'lucide-react'+import { Users, FolderOpen, DollarSign, AlertTriangle, Shield, Search } from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
import AgentCoordinatorPanel from '@/components/admin/AgentCoordinatorPanel';
+import VisualScoutPanel from '@/components/admin/VisualScoutPanel';
 
 interface AdminStats {
 }
@@ .. @@
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="master" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 font-bold">
            👑 PATRON
          </TabsTrigger>
           <TabsTrigger value="users">Utilisateurs</TabsTrigger>
           <TabsTrigger value="projects">Projets</TabsTrigger>
           <TabsTrigger value="transactions">Transactions</TabsTrigger>
           <TabsTrigger value="compliance">Compliance</TabsTrigger>
+          <TabsTrigger value="scout">VisualScout</TabsTrigger>
          <TabsTrigger value="agents">Coordination</TabsTrigger>
         </TabsList>
 
@@ .. @@
             </div>
           </Card>
         </TabsContent>

        <TabsContent value="master" className="space-y-4">
          <MasterControlPanel />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AgentCoordinatorPanel />
        </TabsContent>
+
+        <TabsContent value="scout" className="space-y-4">
+          <VisualScoutPanel />
+        </TabsContent>
       </Tabs>
     </div>