import { useEffect, useState, useRef } from "react";
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

  const clientRef = useRef(null);
  const channelRef = useRef(null);
  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Initialize and connect user only once
  useEffect(() => {
    const connectToStream = async () => {
      if (!tokenData?.token || !authUser) {
        console.warn("Skipping Stream connection - missing token or authUser", { hasToken: !!tokenData?.token, hasAuthUser: !!authUser });
        return;
      }

      // If already connected, skip
      if (clientRef.current?.user) {
        console.log("Already connected to Stream");
        setChatClient(clientRef.current);
        return;
      }

      try {
        console.log("🔌 Connecting to Stream Chat...", {
          userId: authUser._id,
          userName: authUser.fullName,
          token: tokenData.token.substring(0, 20) + "...",
        });

        const client = StreamChat.getInstance(STREAM_API_KEY);
        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        console.log("✅ Connected to Stream successfully");
        clientRef.current = client;
        setChatClient(client);
      } catch (error) {
        console.error("❌ Error connecting to Stream:", error);
        toast.error(`Stream connection failed: ${error.message}`);
      }
    };

    connectToStream();
  }, [tokenData, authUser]);

  // Watch channel when client is ready and targetUserId changes
  useEffect(() => {
    const watchChannel = async () => {
      if (!chatClient || !targetUserId) {
        console.warn("Skipping channel watch - missing client or targetUserId", { hasClient: !!chatClient, targetUserId });
        return;
      }

      try {
        console.log("📺 Loading chat with user:", targetUserId);

        const channelId = [authUser._id, targetUserId].sort().join("-");
        console.log("📝 Channel ID created:", channelId);

        const currChannel = chatClient.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        console.log("⏳ Watching channel...");
        await currChannel.watch();

        // Listen for new messages on THIS channel only (channel-level, not client-level)
        const handleChannelMessage = async (event) => {
          // Only create notification if message is from the other user
          console.log("📬 Message event received:", {
            senderId: event.user?.id,
            senderName: event.user?.name,
            authUserId: authUser._id,
            text: event.message?.text,
          });

          if (event.user?.id === authUser._id) {
            console.log("📨 Ignoring own message - sender matches logged-in user");
            return;
          }

          console.log("🔔 New message received from", event.user?.name, "- creating notification");

          try {
            const { createMessageNotification } = await import("../lib/api");
            const result = await createMessageNotification({
              senderId: event.user?.id,
              senderName: event.user?.name || "Unknown",
              text: event.message?.text || "Sent a message",
              channelCid: currChannel.cid,
            });
            console.log("✅ Notification created:", result);
          } catch (error) {
            console.error("❌ Error creating notification:", error);
          }
        };

        console.log("🔗 Attaching message.new handler to channel");
        currChannel.on("message.new", handleChannelMessage);
        channelRef.current = { channel: currChannel, handler: handleChannelMessage, channelId };

        console.log("✅ Channel watched successfully");
        setChannel(currChannel);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error watching channel:", error);
        toast.error(`Channel connection failed: ${error.message}`);
        setLoading(false);
      }
    };

    watchChannel();

    return () => {
      if (channelRef.current) {
        console.log("🧹 Removing message.new handler from channel:", channelRef.current.channelId);
        const { channel: ch, handler } = channelRef.current;
        ch.off("message.new", handler);
        channelRef.current = null;
      }
    };
  }, [chatClient, targetUserId, authUser]);

  // Cleanup on unmount
  useEffect(() => {
    return async () => {
      try {
        if (clientRef.current?.user) {
          await clientRef.current.disconnectUser();
          clientRef.current = null;
        }
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    };
  }, []);

  if (loading || !chatClient || !channel) return <ChatLoader />;

  // Expose test function for debugging
  window.testNotification = async () => {
    console.log("🧪 Testing notification creation...");
    try {
      const { createMessageNotification } = await import("../lib/api");
      const result = await createMessageNotification({
        senderId: "test-user-id",
        senderName: "Test User",
        text: "This is a test notification",
        channelCid: "test-channel",
      });
      console.log("✅ Test notification created:", result);
    } catch (error) {
      console.error("❌ Test notification failed:", error);
    }
  };

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