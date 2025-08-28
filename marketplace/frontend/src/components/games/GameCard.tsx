import Link from 'next/link';
import { Game } from '@/lib/api/games';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, ShoppingBag, Users } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/game/${game.slug}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={game.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Gamepad2 className="h-12 w-12 opacity-80" />
            </div>
          )}
          
          {/* Platform badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {game.platformTypes.map((platform) => (
              <Badge
                key={platform}
                variant="secondary"
                className="text-xs bg-black/50 text-white hover:bg-black/70"
              >
                {platform}
              </Badge>
            ))}
          </div>
          
          {/* Listings count overlay */}
          {game.listingsCount !== undefined && game.listingsCount > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              {game.listingsCount}
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
              {game.name}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{game.categoriesCount || 0} categories</span>
              </div>
              
              <div className="flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" />
                <span>{game.listingsCount || 0} listings</span>
              </div>
            </div>
            
            {game.listingsCount === 0 ? (
              <Badge variant="outline" className="text-xs">
                Coming Soon
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                Available Now
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}