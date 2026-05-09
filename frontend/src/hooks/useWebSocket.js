import { useState, useEffect } from "react";

export const useWebSocket = (url) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    setWs(socket);

    return () => socket.close();
  }, [url]);

  return { isConnected, lastMessage };
};
