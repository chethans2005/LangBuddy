import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, getMessageNotifications, deleteMessageNotification } from "../lib/api";
import { BellIcon, CheckCheck, MessageSquareIcon, UserCheckIcon, Trash2 } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { useEffect, useState } from "react";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  // server-backed message notifications
  const {
    data: messageNotificationsData,
    isLoading: isMsgsLoading,
  } = useQuery({
    queryKey: ["messageNotifications"],
    queryFn: async () => {
      const res = await getMessageNotifications();
      return res.notifications || [];
    },
  });

  const messageNotifications = messageNotificationsData || [];

  const deleteMutation = useMutation({
    mutationFn: deleteMessageNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messageNotifications"] });
      window.dispatchEvent(new CustomEvent("messageNotificationsUpdated", { detail: 0 }));
    },
  });

  const deleteMessageNotificationLocal = (id) => {
    deleteMutation.mutate(id);
  };

  const clearAllMessageNotifications = async () => {
    try {
      const ids = messageNotifications.map((n) => n._id);
      await Promise.all(ids.map((id) => deleteMessageNotification(id)));
      queryClient.invalidateQueries({ queryKey: ["messageNotifications"] });
      window.dispatchEvent(new CustomEvent("messageNotificationsUpdated", { detail: 0 }));
    } catch (err) {
      /* ignore */
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar w-14 h-14 rounded-full bg-base-300">
                              <img src={request.sender.profilePic} alt={request.sender.fullName} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.sender.fullName}</h3>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                  Native: {request.sender.nativeLanguage}
                                </span>
                                <span className="badge badge-outline badge-sm">
                                  Learning: {request.sender.learningLanguage}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => acceptRequestMutation(request._id)}
                            disabled={isPending}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div key={notification._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.recipient.fullName}</h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <CheckCheck  className="h-3 w-3 mr-1" />
                              {notification.createdAt
                                ? new Date(notification.createdAt).toLocaleDateString()
                                : "Unknown"}
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MESSAGE NOTIFICATIONS (from chat) */}
            {(!isMsgsLoading && messageNotifications.length > 0) && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-primary" />
                  Messages
                  <button className="btn btn-ghost btn-xs ml-auto" onClick={clearAllMessageNotifications}>
                    Clear all
                  </button>
                </h2>

                <div className="space-y-3">
                  {messageNotifications.map((note) => (
                    <div key={note._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{note.senderName}</h3>
                            <p className="text-sm my-1">{note.text || "New message"}</p>
                            <p className="text-xs opacity-70">
                              {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Unknown"}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => deleteMessageNotificationLocal(note._id)}>
                              <Trash2 className="h-4 w-4 mr-1 inline" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && messageNotifications.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;