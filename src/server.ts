import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 6071;

const wss = new WebSocketServer({ port: Number(PORT) });

// Store channels and their subscribers
// Map<channelName, Set<WebSocketClient>>
const channels = new Map<string, Set<WebSocket>>();

console.log(`WebSocket server started on port ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Store the channels this client is subscribed to
    const subscribedChannels = new Set<string>();

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log('Received:', parsedMessage);

            // Expected message format: { type: 'subscribe' | 'publish', channel: string, data?: any }
            const { type, channel, data } = parsedMessage;

            if (!type || !channel) {
                ws.send(JSON.stringify({ error: 'Invalid message format. Missing type or channel.' }));
                return;
            }

            switch (type) {
                case 'subscribe':
                    if (!channels.has(channel)) {
                        channels.set(channel, new Set());
                    }
                    channels.get(channel)?.add(ws);
                    subscribedChannels.add(channel);
                    console.log(`Client subscribed to channel: ${channel}`);
                    ws.send(JSON.stringify({ status: 'subscribed', channel }));
                    break;

                case 'publish':
                    if (channels.has(channel)) {
                        const messageToSend = JSON.stringify({ type: 'message', channel, data });
                        console.log(`Publishing to channel ${channel}:`, data);
                        channels.get(channel)?.forEach(client => {
                            // Send to all clients in the channel except the sender
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(messageToSend);
                            }
                        });
                    } else {
                         console.log(`Channel ${channel} does not exist or has no subscribers.`);
                         // Optionally notify sender: ws.send(JSON.stringify({ status: 'publish_failed', channel, reason: 'No subscribers' }));
                    }
                    break;

                default:
                    ws.send(JSON.stringify({ error: `Unknown message type: ${type}` }));
            }
        } catch (error) {
            console.error('Failed to process message:', error);
            ws.send(JSON.stringify({ error: 'Invalid JSON message received.' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Unsubscribe from all channels the client was subscribed to
        subscribedChannels.forEach(channel => {
            channels.get(channel)?.delete(ws);
            // Optional: Clean up empty channels
            if (channels.get(channel)?.size === 0) {
                channels.delete(channel);
                console.log(`Channel removed: ${channel}`);
            }
        });
        subscribedChannels.clear();
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        // Clean up on error as well
         subscribedChannels.forEach(channel => {
            channels.get(channel)?.delete(ws);
            if (channels.get(channel)?.size === 0) {
                channels.delete(channel);
            }
        });
        subscribedChannels.clear();
    });

    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));
});

wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
});
