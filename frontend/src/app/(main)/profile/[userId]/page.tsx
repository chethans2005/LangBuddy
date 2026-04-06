"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthStore } from "@/store/useAuthStore";
import { FiStar, FiMessageSquare, FiUserPlus, FiArrowLeft, FiEdit3 } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { userId } = useParams();
  const { authUser } = useAuthStore();
  const { user, ratings, isLoading, fetchUserProfile, fetchUserRatings, addRating } = useProfileStore();
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId as string);
      fetchUserRatings(userId as string);
    }
  }, [userId, fetchUserProfile, fetchUserRatings]);

  const handleSubmitRating = async () => {
    if (!authUser) {
      toast.error("Please log in to rate");
      return;
    }

    setIsSubmittingRating(true);
    await addRating(userId as string, ratingScore, ratingComment);
    setRatingScore(5);
    setRatingComment("");
    setShowRatingForm(false);
    setIsSubmittingRating(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-white text-xl mb-4">User not found</p>
          <Link href="/chat" className="text-purple-400 hover:text-purple-300">
            Back to chat
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = authUser?._id === user._id;
  const avgRating = ratings?.avgRating || 0;
  const totalRatings = ratings?.totalRatings || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#09090b] to-[#18181b] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link href="/chat" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8">
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Chat</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#18181b] border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          {/* Header with avatar and basic info */}
          <div className="flex gap-8 mb-8 pb-8 border-b border-white/5">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 overflow-hidden flex items-center justify-center shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold">{user.name?.charAt(0)}</span>
                )}
              </div>
              {isSelf && (
                <Link
                  href="/settings"
                  className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
                  title="Edit profile"
                >
                  <FiEdit3 className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
              <p className="text-zinc-400 mb-4">{user.bio || "No bio yet"}</p>

              {/* Languages */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 mb-1">Native Language</p>
                  <p className="text-lg font-semibold text-purple-300">{user.nativeLanguage || "Not set"}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 mb-1">Learning</p>
                  <p className="text-lg font-semibold text-blue-300">{user.learningLanguage || "Not set"}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {avgRating.toFixed(1)} ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
                </span>
              </div>
            </div>
          </div>

          {/* Proficiency levels */}
          <div className="mb-8 pb-8 border-b border-white/5">
            <h2 className="text-2xl font-bold mb-4">Language Proficiency</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-zinc-400 mb-2">{user.nativeLanguage} Proficiency</p>
                <p className="text-lg font-semibold capitalize">
                  {user.proficiencyLevels?.nativeLanguage || "Native"}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-zinc-400 mb-2">{user.learningLanguage} Proficiency</p>
                <p className="text-lg font-semibold capitalize">
                  {user.proficiencyLevels?.learningLanguage || "Beginner"}
                </p>
              </div>
            </div>
          </div>

          {/* User stats */}
          <div className="mb-8 pb-8 border-b border-white/5">
            <h2 className="text-2xl font-bold mb-4">Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{user.friends?.length || 0}</p>
                <p className="text-sm text-zinc-400">Friends</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400">{totalRatings}</p>
                <p className="text-sm text-zinc-400">Ratings</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-zinc-400">Avg Rating</p>
              </div>
            </div>
          </div>

          {/* Ratings section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Reviews</h2>
              {!isSelf && authUser && (
                <button
                  onClick={() => setShowRatingForm(!showRatingForm)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold transition-all"
                >
                  {showRatingForm ? "Cancel" : "Leave Review"}
                </button>
              )}
            </div>

            {/* Rating form */}
            {showRatingForm && !isSelf && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4"
              >
                <div className="mb-4">
                  <p className="text-sm text-zinc-400 mb-2">Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setRatingScore(score)}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          ratingScore >= score
                            ? "bg-yellow-500 text-white"
                            : "bg-white/10 text-zinc-400 hover:bg-white/20"
                        }`}
                      >
                        <FiStar className="w-full h-full p-2 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience (optional)"
                    maxLength={300}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-zinc-500 mt-1">{ratingComment.length}/300</p>
                </div>
                <button
                  onClick={handleSubmitRating}
                  disabled={isSubmittingRating}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  {isSubmittingRating ? "Submitting..." : "Submit Review"}
                </button>
              </motion.div>
            )}

            {/* Ratings list */}
            {ratings && ratings.ratings && ratings.ratings.length > 0 ? (
              <div className="space-y-3">
                {ratings.ratings.map((rating: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {rating.fromUserId?.avatar ? (
                        <img
                          src={rating.fromUserId.avatar}
                          alt={rating.fromUserId?.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                          {rating.fromUserId?.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{rating.fromUserId?.name || "Anonymous"}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <FiStar
                                key={j}
                                className={`w-3 h-3 ${
                                  j < rating.score ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {rating.comment && <p className="text-sm text-zinc-300">{rating.comment}</p>}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <p>No reviews yet</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isSelf && authUser && (
            <div className="flex gap-4">
              <Link
                href={`/chat?userId=${user._id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-lg transition-all"
              >
                <FiMessageSquare className="w-4 h-4" />
                Message
              </Link>
              <button className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition-all border border-white/20">
                <FiUserPlus className="w-4 h-4" />
                Add Friend
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
