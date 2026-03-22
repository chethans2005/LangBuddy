import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import Sidebar from "../components/Sidebar";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    let cleanupFn;
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        //
        const channelId = [authUser._id, targetUserId].sort().join("-");

        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        // clear message notifications for this chat when user opens it
        try {
          const raw = localStorage.getItem("message_notifications");
          const arr = raw ? JSON.parse(raw) : [];
          const filtered = arr.filter((n) => n.channelCid !== currChannel?.cid);
          localStorage.setItem("message_notifications", JSON.stringify(filtered));
          window.dispatchEvent(new CustomEvent("messageNotificationsUpdated", { detail: filtered.length }));
        } catch (err) {
          /* ignore */
        }

        // handle incoming messages globally — show toast and increment unread when appropriate
        const handleNewMessage = (event) => {
          const senderId = event.user?.id;
          if (!senderId || senderId === authUser._id) return;

          const eventChannelCid = event.channel?.cid;
          // if message belongs to this currently-open chat and user is on this chat, don't create a notification
          if (
            eventChannelCid === currChannel?.cid &&
            window.location.pathname?.startsWith(`/chat/${targetUserId}`)
          ) {
            return;
          }

          // create persistent message notification in localStorage
          try {
            const raw = localStorage.getItem("message_notifications");
            const arr = raw ? JSON.parse(raw) : [];
            const note = {
              id: Date.now().toString() + "-" + Math.random().toString(36).slice(2, 8),
              senderId,
              senderName: event.user?.name || "Unknown",
              text: event.message?.text || "",
              channelCid: eventChannelCid,
              createdAt: new Date().toISOString(),
            };
            arr.unshift(note);
            localStorage.setItem("message_notifications", JSON.stringify(arr));
            window.dispatchEvent(new CustomEvent("messageNotificationsUpdated", { detail: arr.length }));

            // try persist to server as well (best-effort)
            import("../lib/api").then(({ createMessageNotification }) => {
              try {
                // create server notification for current user
                createMessageNotification({
                  senderId: note.senderId,
                  senderName: note.senderName,
                  text: note.text,
                  channelCid: note.channelCid,
                }).catch(() => {});
              } catch (err) {
                /* ignore */
              }
            });
          } catch (err) {
            /* ignore */
          }

          toast.success(`${event.user?.name || "New"}: ${event.message?.text || "New message"}`);
        };


        client.on("message.new", handleNewMessage);

        // expose cleanup to effect scope
        cleanupFn = async () => {
          try {
            client.off("message.new", handleNewMessage);
          } catch (err) {
            /* ignore */
          }
          try {
            await currChannel?.stopWatching?.();
          } catch (err) {
            /* ignore */
          }
          try {
            await client.disconnectUser();
          } catch (err) {
            /* ignore */
          }
        };

        setChatClient(client);
        setChannel(currChannel);

        // cleanup on unmount: remove listener and disconnect client
        // (returned below in effect cleanup)
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [tokenData, authUser, targetUserId]);

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh] flex items-center justify-center bg-base-100">
      <div className="w-full max-w-5xl h-[85vh] rounded-lg shadow-lg bg-base-200 overflow-hidden flex flex-col">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="w-full relative flex-1 flex flex-col">
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
};
export default ChatPage;