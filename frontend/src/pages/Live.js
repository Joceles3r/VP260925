import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, Eye, DollarSign, Clock, Trophy } from 'lucide-react';

const Live = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const liveEvents = [
    {
      id: 1,
      title: "Battle de Réalisateurs - Finale",
      description: "Affrontement épique entre les 4 meilleurs réalisateurs de documentaires",
      status: "live",
      viewers: 2847,
      category: "Battle",
      prize: 15000,
      timeLeft: "2h 15m",
      participants: [
        { name: "Marie Dubois", votes: 1203, funding: 4500 },
        { name: "Thomas Martin", votes: 987, funding: 3200 },
        { name: "Sophie Laurent", votes: 657, funding: 2100 },
        { name: "Alex Moreau", votes: 543, funding: 1800 }
      ]
    },
    {
      id: 2,
      title: "Présentation Nouveaux Projets",
      description: "Découverte de 8 nouveaux projets innovants ce mois-ci",
      status: "starting-soon",
      viewers: 892,
      category: "Présentation",
      prize: 5000,
      timeLeft: "15m",
      participants: []
    },
    {
      id: 3,
      title: "Workshop Animation 3D",
      description: "Masterclass avec les créateurs les plus talentueux",
      status: "scheduled",
      viewers: 0,
      category: "Workshop",
      prize: 0,
      timeLeft: "1j 4h",
      participants: []
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white';
      case 'starting-soon': return 'bg-orange-500 text-white';
      case 'scheduled': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return '🔴 En direct';
      case 'starting-soon': return '🟡 Bientôt';
      case 'scheduled': return '📅 Programmé';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Shows en direct 🎬
        </h1>
        <p className="text-gray-600">
          Participez aux événements live et investissez en temps réel
        </p>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-red-100 mr-4">
              <Radio className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-gray-600">Événements actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-purple-100 mr-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3,739</p>
              <p className="text-sm text-gray-600">Spectateurs en ligne</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full p-3 bg-green-100 mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">20,000€</p>
              <p className="text-sm text-gray-600">Investis aujourd'hui</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Events */}
      <div className="space-y-6">
        {liveEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    {event.title}
                    <Badge className={getStatusColor(event.status)}>
                      {getStatusText(event.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {event.viewers} spectateurs
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.timeLeft}
                    </div>
                    {event.prize > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {event.prize}€ de prix
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  variant={selectedEvent === event.id ? "default" : "outline"}
                >
                  {event.status === 'live' ? 'Rejoindre' : 'Détails'}
                </Button>
              </div>
            </CardHeader>

            {selectedEvent === event.id && (
              <CardContent className="border-t bg-gray-50">
                {event.status === 'live' && event.participants.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Classement en temps réel</h3>
                    <div className="space-y-3">
                      {event.participants.map((participant, index) => (
                        <div key={participant.name} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{participant.name}</p>
                              <p className="text-sm text-gray-500">{participant.votes} votes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{participant.funding}€</p>
                            <p className="text-sm text-gray-500">financé</p>
                          </div>
                          <Button size="sm">
                            Voter & Investir
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Radio className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      {event.status === 'scheduled' ? 
                        'Cet événement n\'a pas encore commencé' :
                        'Préparez-vous pour le live !'
                      }
                    </p>
                    <Button variant="outline">
                      Programmer un rappel
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Upcoming Events */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Prochains événements</CardTitle>
          <CardDescription>
            Ne manquez pas les futures sessions live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Pitch Session - Startups Créatives</h3>
                <p className="text-sm text-gray-500">Demain à 14h00</p>
              </div>
              <Button variant="outline" size="sm">
                S'inscrire
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Masterclass Storytelling Digital</h3>
                <p className="text-sm text-gray-500">Vendredi à 18h30</p>
              </div>
              <Button variant="outline" size="sm">
                S'inscrire
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Live;