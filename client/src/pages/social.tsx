import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, Users, Trophy, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SocialPost {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorProfileType: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
}

export default function SocialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState('discussion');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Fetch social posts
  const { data: postsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['/api/social/posts'],
    enabled: !!user
  });

  // Fetch comments for selected post
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['/api/social/posts', selectedPostId, 'comments'],
    enabled: !!selectedPostId
  });

  // Fetch user stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/social/stats'],
    enabled: !!user
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { title: string; content: string; type: string }) => {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Post publié", description: "Votre post a été publié avec succès!" });
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts'] });
      setNewPostContent('');
      setNewPostTitle('');
      setNewPostType('discussion');
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de publier le post", variant: "destructive" });
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts'] });
    }
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to create comment');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Commentaire ajouté" });
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts', selectedPostId, 'comments'] });
      setNewCommentContent('');
    }
  });

  const getProfileBadge = (profileType: string) => {
    switch (profileType) {
      case 'admin':
        return <Badge variant="destructive" className="text-xs"><Star className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'creator':
        return <Badge variant="secondary" className="text-xs"><Trophy className="w-3 h-3 mr-1" />Porteur</Badge>;
      case 'investor':
        return <Badge variant="outline" className="text-xs">Investisseur</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Lecteur</Badge>;
    }
  };

  if (isLoadingPosts) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8" data-testid="social-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground" data-testid="social-title">
          Réseau Social VISUAL
        </h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
{String((postsData as any)?.posts?.length || 0)} posts
        </Badge>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mes VisuPoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{(statsData as any).visuPoints || 0}</div>
              <p className="text-xs text-muted-foreground">Points communauté</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Mes Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{(statsData as any).postsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Publications</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{(statsData as any).likesReceived || 0}</div>
              <p className="text-xs text-muted-foreground">Likes reçus</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Post */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Partager une pensée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Titre de votre post"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                data-testid="new-post-title"
              />
            </div>
            <div className="space-y-2">
              <Select value={newPostType} onValueChange={setNewPostType}>
                <SelectTrigger data-testid="new-post-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="announcement">Annonce</SelectItem>
                  <SelectItem value="teaser">Teaser</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="update">Mise à jour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Que voulez-vous partager avec la communauté VISUAL ?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[100px]"
              data-testid="new-post-content"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {newPostContent.length}/500 caractères
              </div>
              <Button
                onClick={() => createPostMutation.mutate({
                  title: newPostTitle,
                  content: newPostContent,
                  type: newPostType
                })}
                disabled={!newPostContent.trim() || !newPostTitle.trim() || createPostMutation.isPending || newPostContent.length > 500}
                data-testid="publish-post-button"
              >
                {createPostMutation.isPending ? 'Publication...' : 'Publier'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-6" data-testid="posts-feed">
        {(postsData as any)?.posts?.length > 0 ? (
          (postsData as any).posts.map((post: SocialPost) => (
            <Card key={post.id} data-testid={`post-${post.id}`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.authorName?.[0] || post.authorEmail?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{post.authorName || post.authorEmail}</p>
                      {getProfileBadge(post.authorProfileType)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likePostMutation.mutate(post.id)}
                        className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
                        data-testid={`like-post-${post.id}`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        {post.likesCount}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                        className="flex items-center gap-2"
                        data-testid={`comment-post-${post.id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.commentsCount}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Partager
                      </Button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {selectedPostId === post.id && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Ajouter un commentaire..."
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            data-testid="new-comment-input"
                          />
                          {newCommentContent && (
                            <Button
                              size="sm"
                              onClick={() => createCommentMutation.mutate({
                                postId: post.id,
                                content: newCommentContent
                              })}
                              disabled={createCommentMutation.isPending}
                              data-testid="submit-comment-button"
                            >
                              {createCommentMutation.isPending ? 'Envoi...' : 'Commenter'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Comments List */}
                      {isLoadingComments ? (
                        <div className="space-y-3">
                          {[1, 2].map(i => (
                            <div key={i} className="animate-pulse flex gap-3">
                              <div className="w-8 h-8 bg-muted rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                <div className="h-4 bg-muted rounded w-full"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        (commentsData as any)?.comments?.map((comment: Comment) => (
                          <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-muted">
                                {comment.authorName?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{comment.authorName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1 ml-3">
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  <Heart className="w-3 h-3 mr-1" />
                                  {comment.likesCount}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun post pour le moment</h3>
              <p className="text-muted-foreground mb-4">Soyez le premier à partager quelque chose avec la communauté !</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}