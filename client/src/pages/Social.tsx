import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Plus, Image, Video, Users, TrendingUp, Clock, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useEmojiSystem } from '@/hooks/useEmojiSystem';

interface SocialPost {
  id: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  projectRef?: {
    id: string;
    title: string;
    category: string;
  };
}

export default function Social() {
  const { user } = useAuth();
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const emoji = useEmojiSystem();

  // Mock social posts data
  const mockPosts: SocialPost[] = [
    {
      id: 'post-1',
      author: {
        id: '2',
        firstName: 'Thomas',
        lastName: 'Martin',
        profileImageUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100'
      },
      content: 'Très heureux de partager les premières images de mon court-métrage en animation 3D ! Le projet avance bien grâce au soutien de la communauté VISUAL 🎬✨',
      imageUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=600',
      likesCount: 42,
      commentsCount: 8,
      isLiked: false,
      createdAt: '2024-01-20T14:30:00Z',
      projectRef: {
        id: 'proj-2',
        title: 'Court-métrage Animation 3D',
        category: 'animation'
      }
    },
    {
      id: 'post-2',
      author: {
        id: '1',
        firstName: 'Marie',
        lastName: 'Dubois',
        profileImageUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100'
      },
      content: 'Tournage terminé pour le documentaire sur l\'IA ! Merci à tous les investisseurs qui ont cru au projet. Les premières images sont prometteuses 🤖📹',
      likesCount: 67,
      commentsCount: 15,
      isLiked: true,
      createdAt: '2024-01-19T10:15:00Z',
      projectRef: {
        id: 'proj-1',
        title: 'Documentaire sur l\'IA',
        category: 'documentaire'
      }
    },
    {
      id: 'post-3',
      author: {
        id: '3',
        firstName: 'Sophie',
        lastName: 'Leroy'
      },
      content: 'Recherche encore quelques investisseurs pour boucler le financement de ma série thriller. Chaque euro compte ! 💪',
      likesCount: 23,
      commentsCount: 5,
      isLiked: false,
      createdAt: '2024-01-18T16:45:00Z',
      projectRef: {
        id: 'proj-3',
        title: 'Série Web Thriller',
        category: 'série'
      }
    }
  ];

  const { data: posts = mockPosts, isLoading } = useQuery({
    queryKey: ['social-posts'],
    queryFn: async () => mockPosts,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });

  const handleCreatePost = async (e: React.MouseEvent) => {
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      emoji.triggerAnnouncement(x, y);
      setNewPostContent('');
      
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = (postId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    emoji.triggerFollowCreator(x, y);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-purple-500" />
            <h1 className="text-4xl font-bold text-white">Social</h1>
            <Badge className="bg-purple-500/90 text-white">
              Communauté
            </Badge>
          </div>
          <p className="text-gray-400">
            Partagez vos projets et découvrez les créations de la communauté
          </p>
        </motion.div>

        {/* Créer un post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {user?.firstName?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Partagez vos actualités, projets ou découvertes..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Image className="h-4 w-4 mr-1" />
                        Photo
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Video className="h-4 w-4 mr-1" />
                        Vidéo
                      </Button>
                    </div>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isPosting}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      {isPosting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Publication...
                        </div>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Publier
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feed des posts */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200">
                <CardContent className="p-6">
                  {/* Header du post */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {post.author.profileImageUrl ? (
                        <img 
                          src={post.author.profileImageUrl} 
                          alt={`${post.author.firstName} ${post.author.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {post.author.firstName[0]}{post.author.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">
                          {post.author.firstName} {post.author.lastName}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      
                      {post.projectRef && (
                        <Badge variant="secondary" className="text-xs mb-2">
                          {post.projectRef.category} • {post.projectRef.title}
                        </Badge>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Contenu */}
                  <div className="mb-4">
                    <p className="text-gray-300 leading-relaxed mb-3">
                      {post.content}
                    </p>
                    
                    {post.imageUrl && (
                      <div className="rounded-lg overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt="Post image"
                          className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => handleLike(post.id, e)}
                        className={`text-gray-400 hover:text-red-400 ${post.isLiked ? 'text-red-400' : ''}`}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                        {post.likesCount}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.commentsCount}
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-400">
                        <Share2 className="h-4 w-4 mr-1" />
                        Partager
                      </Button>
                    </div>

                    {post.projectRef && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Voir le projet
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* État vide */}
        {posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun post</h3>
            <p className="text-gray-400 mb-6">
              Soyez le premier à partager quelque chose avec la communauté !
            </p>
            <Button 
              onClick={() => document.querySelector('input')?.focus()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un post
            </Button>
          </motion.div>
        )}

        {/* Suggestions de connexions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Créateurs à suivre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Emma Rousseau', category: 'Documentaires', followers: 156 },
                  { name: 'Lucas Bernard', category: 'Clips musicaux', followers: 89 },
                  { name: 'Julien Moreau', category: 'Animation', followers: 203 }
                ].map((creator, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {creator.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{creator.name}</p>
                        <p className="text-xs text-gray-400">{creator.category} • {creator.followers} abonnés</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
                      Suivre
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}