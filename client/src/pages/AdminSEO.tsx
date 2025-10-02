import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, RefreshCw, Globe, FileText } from 'lucide-react';
import type { PageMetadata } from '@/hooks/useSEO';

export default function AdminSEO() {
  const { toast } = useToast();

  const { data: metadata, isLoading } = useQuery<PageMetadata[]>({
    queryKey: ['/api/seo/metadata'],
  });

  const { data: config } = useQuery({
    queryKey: ['/api/seo/config'],
  });

  const approveMutation = useMutation({
    mutationFn: async (metadataId: string) => {
      return apiRequest('POST', `/api/seo/approve/${metadataId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/metadata'] });
      toast({
        title: 'Success',
        description: 'Metadata approved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve metadata',
        variant: 'destructive',
      });
    },
  });

  const generateHomeMutation = useMutation({
    mutationFn: async (locale: string) => {
      return apiRequest('POST', `/api/seo/generate/home?locale=${locale}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seo/metadata'] });
      toast({
        title: 'Success',
        description: 'Homepage metadata generated',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="page-admin-seo">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">SEO Management</h1>
        <p className="text-muted-foreground">
          Manage SEO metadata across the platform. VisualScoutAI generates suggestions, Admin has full control.
        </p>
      </div>

      {config && (
        <Card className="mb-6" data-testid="card-seo-config">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Site Name:</span> {config.siteName}
              </div>
              <div>
                <span className="font-medium">Site URL:</span> {config.siteUrl}
              </div>
              <div>
                <span className="font-medium">Default Locale:</span> {config.defaultLocale}
              </div>
              <div>
                <span className="font-medium">Supported Locales:</span> {config.supportedLocales?.join(', ')}
              </div>
              <div>
                <span className="font-medium">AI Generation:</span> 
                {config.aiGenerationEnabled ? (
                  <Badge variant="success" className="ml-2">Enabled</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">Disabled</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {['fr', 'en', 'es'].map(locale => (
              <Button
                key={locale}
                variant="outline"
                onClick={() => generateHomeMutation.mutate(locale)}
                disabled={generateHomeMutation.isPending}
                data-testid={`button-generate-home-${locale}`}
              >
                Generate Home ({locale.toUpperCase()})
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => window.open('/api/seo/sitemap.xml', '_blank')}
              data-testid="button-view-sitemap"
            >
              View Sitemap
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-2xl font-semibold">Page Metadata</h2>
        
        {!metadata || metadata.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No metadata found. Generate some using the quick actions above.
            </CardContent>
          </Card>
        ) : (
          metadata.map((meta) => (
            <Card key={meta.id} data-testid={`card-metadata-${meta.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{meta.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {meta.pageSlug} • {meta.locale.toUpperCase()} • {meta.pageType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {meta.adminApproved ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Admin Approved
                      </Badge>
                    ) : meta.visualAIApproved ? (
                      <Badge variant="secondary">
                        VisualAI Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Pending Approval
                      </Badge>
                    )}
                    <Badge variant="outline">{meta.generatedBy || 'manual'}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
                  </div>
                  {meta.keywords && meta.keywords.length > 0 && (
                    <div>
                      <span className="font-medium">Keywords:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {meta.keywords.map((kw, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {meta.ogImage && (
                    <div>
                      <span className="font-medium">OG Image:</span>
                      <p className="text-sm text-muted-foreground mt-1">{meta.ogImage}</p>
                    </div>
                  )}
                  {!meta.adminApproved && (
                    <div className="pt-4">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(meta.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${meta.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve as Admin
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
