import { Card, CardContent } from '@/components/ui/card';

export function GameCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-200 animate-pulse" />
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GamesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}