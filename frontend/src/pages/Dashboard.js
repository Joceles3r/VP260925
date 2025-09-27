import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { DollarSign, TrendingUp, Wallet, Target, Bell, Settings, CreditCard, Activity, PieChart, ArrowUpRight, ArrowDownRight, Plus, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { investmentsApi, notificationsApi } from "@/lib/api";
import { formatCurrency, formatPercentage, calculateROI } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
export default function Dashboard() {
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState("overview");
    const { data: investmentsResponse, isLoading: investmentsLoading } = useQuery({
        queryKey: ['investments', 'my'],
        queryFn: () => investmentsApi.getMyInvestments({ limit: 10 }),
    });
    const { data: notificationsResponse, isLoading: notificationsLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsApi.getNotifications({ limit: 5 }),
    });
    const investments = investmentsResponse?.data || [];
    const notifications = notificationsResponse?.data || [];
    // Calculate portfolio metrics
    const portfolioMetrics = {
        totalInvested: parseFloat(user?.totalInvested || '0'),
        currentBalance: parseFloat(user?.balanceEUR || '0'),
        totalGains: parseFloat(user?.totalGains || '0'),
        investmentCount: investments.length,
    };
    const totalPortfolioValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue || '0'), 0);
    const totalROI = portfolioMetrics.totalInvested > 0
        ? calculateROI(totalPortfolioValue, portfolioMetrics.totalInvested)
        : 0;
    const StatCard = ({ title, value, change, icon: Icon, trend }) => (<Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground"/>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (<div className={`text-xs flex items-center space-x-1 ${trend === 'up' ? 'text-green-600' :
                trend === 'down' ? 'text-red-600' :
                    'text-muted-foreground'}`}>
            {trend === 'up' && <ArrowUpRight className="h-3 w-3"/>}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3"/>}
            <span>{change}</span>
          </div>)}
      </CardContent>
    </Card>);
    const InvestmentRow = ({ investment }) => {
        const roi = calculateROI(parseFloat(investment.currentValue), parseFloat(investment.amount));
        return (<TableRow>
        <TableCell>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
              <span className="text-xs font-medium">
                {investment.project?.title?.[0]}
              </span>
            </div>
            <div>
              <div className="font-medium text-sm">
                {investment.project?.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {investment.project?.category}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(parseFloat(investment.amount))}
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(parseFloat(investment.currentValue))}
        </TableCell>
        <TableCell className="text-right">
          <Badge variant={roi >= 0 ? 'default' : 'destructive'} className="text-xs">
            {formatPercentage(roi)}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={`text-xs ${investment.project?.status === 'active' ? 'border-green-500 text-green-600' :
                investment.project?.status === 'completed' ? 'border-blue-500 text-blue-600' :
                    'border-yellow-500 text-yellow-600'}`}>
            {investment.project?.status}
          </Badge>
        </TableCell>
      </TableRow>);
    };
    const NotificationItem = ({ notification }) => (<div className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium truncate">
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground ml-2">
            {new Date(notification.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
      </div>
    </div>);
    return (<div className="container-xl py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Gérez votre portefeuille d'investissements VISUAL
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2"/>
            Paramètres
          </Button>
          <Button asChild>
            <Link href="/projects">
              <Plus className="h-4 w-4 mr-2"/>
              Nouveau projet
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Solde disponible" value={formatCurrency(portfolioMetrics.currentBalance)} icon={Wallet}/>
        <StatCard title="Total investi" value={formatCurrency(portfolioMetrics.totalInvested)} icon={DollarSign}/>
        <StatCard title="Valeur portfolio" value={formatCurrency(totalPortfolioValue)} change={formatPercentage(totalROI)} trend={totalROI >= 0 ? 'up' : 'down'} icon={TrendingUp}/>
        <StatCard title="Projets investis" value={portfolioMetrics.investmentCount.toString()} icon={Target}/>
      </motion.div>

      {/* Main Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="investments">Investissements</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Investments */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Investissements récents</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/portfolio">
                          Voir tout
                        </Link>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {investmentsLoading ? (<div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="flex items-center space-x-3">
                            <Skeleton className="h-8 w-8 rounded-md"/>
                            <div className="flex-1">
                              <Skeleton className="h-4 w-32 mb-1"/>
                              <Skeleton className="h-3 w-20"/>
                            </div>
                            <Skeleton className="h-4 w-16"/>
                          </div>))}
                      </div>) : investments.length > 0 ? (<div className="space-y-3">
                        {investments.slice(0, 5).map((investment) => (<div key={investment.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {investment.project?.title?.[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {investment.project?.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(parseFloat(investment.amount))} • {investment.project?.category}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatCurrency(parseFloat(investment.currentValue))}
                              </div>
                              <Badge variant={calculateROI(parseFloat(investment.currentValue), parseFloat(investment.amount)) >= 0
                    ? 'default'
                    : 'destructive'} className="text-xs">
                                {formatPercentage(calculateROI(parseFloat(investment.currentValue), parseFloat(investment.amount)))}
                              </Badge>
                            </div>
                          </div>))}
                      </div>) : (<div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                        <h3 className="text-lg font-semibold mb-2">Aucun investissement</h3>
                        <p className="text-muted-foreground mb-4">
                          Commencez à investir dans des projets visuels
                        </p>
                        <Button asChild>
                          <Link href="/projects">
                            Découvrir les projets
                          </Link>
                        </Button>
                      </div>)}
                  </CardContent>
                </Card>
              </div>

              {/* Notifications & Quick Actions */}
              <div className="space-y-6">
                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Notifications</span>
                      <Bell className="h-4 w-4"/>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notificationsLoading ? (<div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="flex items-start space-x-3">
                            <Skeleton className="w-2 h-2 rounded-full mt-2"/>
                            <div className="flex-1">
                              <Skeleton className="h-4 w-full mb-1"/>
                              <Skeleton className="h-3 w-3/4"/>
                            </div>
                          </div>))}
                      </div>) : notifications.length > 0 ? (<div className="space-y-1 max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (<NotificationItem key={notification.id} notification={notification}/>))}
                      </div>) : (<div className="text-center py-4">
                        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2"/>
                        <p className="text-sm text-muted-foreground">
                          Aucune notification
                        </p>
                      </div>)}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/projects">
                        <Plus className="h-4 w-4 mr-2"/>
                        Créer un projet
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/portfolio">
                        <PieChart className="h-4 w-4 mr-2"/>
                        Voir portfolio
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2"/>
                      Ajouter des fonds
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tous mes investissements</CardTitle>
                <CardDescription>
                  Suivez la performance de vos investissements en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {investmentsLoading ? (<div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full"/>))}
                  </div>) : investments.length > 0 ? (<Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Projet</TableHead>
                        <TableHead className="text-right">Investi</TableHead>
                        <TableHead className="text-right">Valeur actuelle</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments.map((investment) => (<InvestmentRow key={investment.id} investment={investment}/>))}
                    </TableBody>
                  </Table>) : (<div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                    <h3 className="text-lg font-semibold mb-2">Aucun investissement</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous n'avez pas encore d'investissements
                    </p>
                    <Button asChild>
                      <Link href="/projects">
                        Commencer à investir
                      </Link>
                    </Button>
                  </div>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance mensuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                    <p className="text-muted-foreground">
                      Graphiques d'analyse bientôt disponibles
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                    <p className="text-muted-foreground">
                      Graphiques de répartition bientôt disponibles
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
                <CardDescription>
                  Gérez vos préférences et informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications pour les mises à jour de projets
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Vérification KYC</h4>
                      <p className="text-sm text-muted-foreground">
                        Vérifiez votre identité pour débloquer toutes les fonctionnalités
                      </p>
                    </div>
                    <Badge variant={user?.kycVerified ? "default" : "secondary"}>
                      {user?.kycVerified ? "Vérifié" : "En attente"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Mode simulation</h4>
                      <p className="text-sm text-muted-foreground">
                        Investir avec de l'argent virtuel pour apprendre
                      </p>
                    </div>
                    <Badge variant={user?.simulationMode ? "secondary" : "default"}>
                      {user?.simulationMode ? "Actif" : "Désactivé"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>);
}
