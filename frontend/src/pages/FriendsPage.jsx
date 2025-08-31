import { useQuery } from "@tanstack/react-query";
import FriendCard from "../components/FriendCard";
import useAuthUser from "../hooks/useAuthUser";
import { getUserFriends } from "../lib/api"; // You need to implement this API call

const FriendsPage = () => {
  // eslint-disable-next-line no-unused-vars
  const { authUser } = useAuthUser();

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Friends</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : friends.length === 0 ? (
        <div>No friends found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {friends.map((friend) => (
            <FriendCard key={friend._id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage;