import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share, TrendingUp, Users, Plus } from 'lucide-react';

const Social = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: "Marie Dubois",
        avatar: "MD",
        isCreator: true,
        followers: 1204
      },
      content: "Très excitée de vous présenter mon nouveau documentaire sur l'IA ! 🎬 Les tournages viennent de commencer et l'équipe est incroyable. Merci à tous mes investisseurs pour votre confiance 💜",
      project: {
        title: "Documentaire sur l'IA",
        funding: "1,250€ / 5,000€"
      },
      likes: 47,
      comments: 12,
      shares: 8,
      timestamp: "Il y a 2h",
      isLiked: false
    },
    {
      id: 2,
      author: {
        name: "Thomas Martin",
        avatar: "TM",
        isCreator: true,
        followers: 856
      },
      content: "Les premières images de notre court-métrage animation sont là ! 🎨 Que pensez-vous de cette direction artistique ? Vos retours sont précieux pour la suite du projet.",
      project: {
        title: "Court-métrage Animation",
        funding: "3,200€ / 8,000€"
      },
      likes: 63,
      comments: 18,
      shares: 5,
      timestamp: "Il y a 4h",
      isLiked: true
    },
    {
      id: 3,
      author: {
        name: "Sophie Laurent",
        avatar: "SL",
        isCreator: false,
        followers: 234
      },
      content: "Incroyable de voir à quel point la communauté VISUAL est active ! J'ai déjà investi dans 5 projets ce mois-ci et les retours sont excellents 📈 Merci à tous les créateurs pour leur transparence !",
      project: null,
      likes: 29,
      comments: 7,
      shares: 3,
      timestamp: "Il y a 6h",
      isLiked: false
    }
  ]);

  const handleLike = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked 
          }
        : post
    ));
  };

  const trendingTopics = [
    { tag: "#DocumentaireIA", posts: 23 },
    { tag: "#AnimationCreative", posts: 18 },
    { tag: "#InvestissementVisuel", posts: 15 },
    { tag: "#ShowLive", posts: 12 },
    { tag: "#CommunauteVISUAL", posts: 9 }
  ];

  const suggestedUsers = [
    { name: "Alex Moreau", avatar: "AM", isCreator: true, followers: 2341 },
    { name: "Emma Rousseau", avatar: "ER", isCreator: true, followers: 1876 },
    { name: "Lucas Bernard", avatar: "LB", isCreator: false, followers: 543 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Réseau Social VISUAL
        </h1>
        <p className="text-gray-600">
          Connectez-vous avec la communauté créative et partagez vos découvertes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Create Post */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>DU</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    placeholder="Partagez vos découvertes, vos investissements ou vos créations..."
                    className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    📸 Photo
                  </Button>
                  <Button variant="outline" size="sm">
                    🎬 Projet
                  </Button>
                </div>
                <Button>Publier</Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{post.author.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{post.author.name}</span>
                        {post.author.isCreator && (
                          <Badge variant="outline" className="text-xs">
                            Créateur
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {post.author.followers} abonnés • {post.timestamp}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-900 mb-3">{post.content}</p>
                  
                  {post.project && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-purple-900">
                            {post.project.title}
                          </h4>
                          <p className="text-sm text-purple-700">
                            {post.project.funding}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Voir le projet
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 text-sm hover:text-red-500 transition-colors ${
                        post.isLiked ? 'text-red-500' : 'text-gray-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-green-500 transition-colors">
                      <Share className="h-4 w-4" />
                      <span>{post.shares}</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="h-5 w-5 mr-2" />
                Tendances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div key={topic.tag} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-600 hover:underline cursor-pointer">
                    {topic.tag}
                  </span>
                  <span className="text-xs text-gray-500">{topic.posts} posts</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Suggested Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2" />
                À suivre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedUsers.map((user) => (
                <div key={user.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.followers} abonnés</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Suivre
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communauté</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Membres actifs</span>
                <span className="text-sm font-medium">12,847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Posts aujourd'hui</span>
                <span className="text-sm font-medium">236</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Projets partagés</span>
                <span className="text-sm font-medium">47</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Social;