import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, ErrorMessage } from "@/components/Shared/UI";
import { apiClient } from "@/lib/apiClient";

interface Rating {
  rating: number;
  comment: string | null;
}

interface RatingsFeedProps {
  username: string;
  address: string;
}

const RatingCard = ({ rating, comment }: Rating) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Star Rating */}
        <div className="flex items-center gap-1">
          {stars.map((star) =>
            star <= rating ? (
              <StarIconSolid key={star} className="size-5 text-yellow-400" />
            ) : (
              <StarIconOutline
                key={star}
                className="size-5 text-gray-300 dark:text-gray-600"
              />
            )
          )}
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {rating}/5
          </span>
        </div>

        {/* Comment */}
        {comment && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            "{comment}"
          </p>
        )}
      </div>
    </Card>
  );
};

const RatingsShimmer = () => {
  return (
    <div className="space-y-3 px-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className="size-5 rounded bg-gray-200 dark:bg-gray-700"
                />
              ))}
              <div className="ml-2 h-4 w-8 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </Card>
      ))}
    </div>
  );
};

const RatingsFeed = ({ username, address }: RatingsFeedProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message?: string } | null>(null);

  const fetchRatings = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getFreelancerRatings(address);
      setRatings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load ratings:", err);
      setError({ message: err?.message || "Failed to load ratings" });
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  if (loading) {
    return <RatingsShimmer />;
  }

  if (error) {
    return (
      <div className="px-3">
        <ErrorMessage error={error} title="Failed to load ratings" />
      </div>
    );
  }

  if (!ratings.length) {
    return (
      <div className="px-3">
        <EmptyState
          icon={<StarIconOutline className="size-8" />}
          message={
            <div>
              <b className="mr-1">{username}</b>
              <span>has no ratings yet!</span>
            </div>
          }
        />
      </div>
    );
  }

  // Calculate average rating
  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(
        1
      )
    : "0";

  return (
    <div className="space-y-3 px-3">
      {/* Summary Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarIconSolid className="size-6 text-yellow-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {avgRating}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({ratings.length} {ratings.length === 1 ? "rating" : "ratings"})
            </span>
          </div>
        </div>
      </Card>

      {/* Individual Ratings */}
      {ratings.map((rating, index) => (
        <RatingCard
          key={index}
          rating={rating.rating}
          comment={rating.comment}
        />
      ))}
    </div>
  );
};

export default RatingsFeed;