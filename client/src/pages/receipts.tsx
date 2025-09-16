import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Download, FileText, Search, Calendar, Euro, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReceiptData {
  id: string;
  receiptNumber: string;
  transactionId: string;
  amount: string;
  type: string;
  format: 'pdf' | 'txt';
  createdAt: string;
  metadata?: {
    templateVersion?: string;
    includeDetails?: boolean;
  };
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('transactionId', searchQuery);
    if (formatFilter !== 'all') params.set('format', formatFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    return params.toString();
  };

  // Fetch receipts with filters
  const { data: receiptsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/receipts', searchQuery, formatFilter, dateFrom, dateTo],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const url = queryParams ? `/api/receipts?${queryParams}` : '/api/receipts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json();
    },
    enabled: !!user
  });

  const downloadReceipt = async (receiptId: string, format?: 'pdf' | 'txt') => {
    try {
      const downloadUrl = format 
        ? `/api/receipts/${receiptId}/download?format=${format}`
        : `/api/receipts/${receiptId}/download`;
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Échec du téléchargement');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `receipt_${receiptId}.${format || 'pdf'}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement réussi",
        description: `Reçu téléchargé : ${filename}`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le reçu",
        variant: "destructive"
      });
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'caution_deposit': return 'Dépôt de caution';
      case 'video_deposit': return 'Dépôt vidéo';
      case 'investment': return 'Investissement';
      case 'withdrawal': return 'Retrait';
      default: return type;
    }
  };

  const getFormatIcon = (format: string) => {
    return format === 'pdf' ? <FileText className="w-4 h-4 text-red-500" /> : <Receipt className="w-4 h-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8" data-testid="receipts-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground" data-testid="receipts-title">
          Mes Reçus de Paiement
        </h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          {receiptsData?.count || 0} reçus
        </Badge>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-receipts"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger data-testid="format-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les formats</SelectItem>
                  <SelectItem value="pdf">PDF seulement</SelectItem>
                  <SelectItem value="txt">TXT seulement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date début</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10"
                  data-testid="date-from-filter"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10"
                  data-testid="date-to-filter"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFormatFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              data-testid="clear-filters"
            >
              Effacer les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Grid */}
      {receiptsData?.receipts?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="receipts-grid">
          {receiptsData.receipts.map((receipt: ReceiptData) => (
            <Card key={receipt.id} className="hover:shadow-md transition-shadow" data-testid={`receipt-${receipt.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getFormatIcon(receipt.format)}
                      {receipt.receiptNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getTransactionTypeLabel(receipt.type)}
                      </Badge>
                      <Badge variant={receipt.format === 'pdf' ? 'destructive' : 'secondary'} className="text-xs">
                        {receipt.format.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Montant</span>
                      <span className="font-medium flex items-center gap-1">
                        <Euro className="w-3 h-3" />
                        {receipt.amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Date</span>
                      <span className="text-sm">
                        {new Date(receipt.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transaction</span>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {receipt.transactionId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => downloadReceipt(receipt.id)}
                      className="flex-1"
                      data-testid={`download-${receipt.id}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    
                    {receipt.format === 'pdf' ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            TXT
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Télécharger en format TXT</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Ce reçu est disponible en PDF. Voulez-vous le télécharger en format TXT ?
                            </p>
                            <Button
                              onClick={() => downloadReceipt(receipt.id, 'txt')}
                              className="w-full"
                              data-testid={`download-txt-${receipt.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger en TXT
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            PDF
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Télécharger en format PDF</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Ce reçu est disponible en TXT. Voulez-vous le télécharger en format PDF ?
                            </p>
                            <Button
                              onClick={() => downloadReceipt(receipt.id, 'pdf')}
                              className="w-full"
                              data-testid={`download-pdf-${receipt.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger en PDF
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun reçu trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || formatFilter !== 'all' || dateFrom || dateTo
                ? "Aucun reçu ne correspond à vos critères de recherche."
                : "Vos reçus de paiement apparaîtront ici après vos transactions."
              }
            </p>
            {(searchQuery || formatFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFormatFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}