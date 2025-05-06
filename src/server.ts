import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 6071;

const wss = new WebSocketServer({ port: Number(PORT) });

// Store channels and their subscribers
// Map<channelName, Set<WebSocketClient>>
const channels = new Map<string, Set<WebSocket>>();

console.log(`WebSocket server started on port ${PORT}`);

interface returnType {
    channel?: string;
    type: 'status'  | 'message' | 'error'| 'data';
    message?: string;
    data?: any;
}

wss.on('connection', (ws) => {
    const connectUsers = wss.clients.size;
    console.log(`Client connected, Connected users: ${connectUsers}`);

    // Store the channels this client is subscribed to
    const subscribedChannels = new Set<string>();

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log('Received:', parsedMessage);

            // Expected message format: { type: 'subscribe' | 'publish', channel: string, data?: any }
            const { type, channel, data } = parsedMessage;

            if (!type && !channel) {
                const returnData: returnType = {
                    channel,
                    type: 'error',
                    message: 'Invalid message format. Missing type and channel.'
                }
                ws.send(JSON.stringify(returnData));
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
                    const returnData: returnType = {
                        channel,
                        type: 'status',
                        message: `You have subscribed to channel ${channel}`
                    }
                    ws.send(JSON.stringify(returnData));
                    break;
                case 'publish':
                    if(!data){
                        const returnData: returnType = {
                            channel,
                            type: 'error',
                            message: 'Invalid message format. Missing data.'
                        }
                        ws.send(JSON.stringify(returnData));
                        return;
                    }
                    if (channels.has(channel)) {
                        // const messageToSend = JSON.stringify({ type: 'message', channel, data });
                        console.log(`Publishing to channel ${channel}:`, data);
                        channels.get(channel)?.forEach(client => {
                            // Send to all clients in the channel except the sender
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                // client.send(messageToSend);
                                const returnData: returnType = {
                                    channel,
                                    type: 'data',
                                    message: "New data received",
                                    data,
                                }
                                ws.send(JSON.stringify(returnData));
                            }
                        });
                    } else {
                         const message = `Publish failed, Channel ${channel} does not exist or has no subscribers.`;
                         console.log(message);
                         const returnData: returnType = {
                            channel,
                            type: 'error',
                            message,
                        }
                        ws.send(JSON.stringify(returnData));
                    }
                    break;

                default:
                    const returnData2: returnType = {
                        channel,
                        type: 'error',
                        message:`Unknown message type: ${type}, valid types publish | subscribe`,
                    }
                    ws.send(JSON.stringify(returnData2));
            }
        } catch (error) {
            console.error('Failed to process message:', error);
            const message = 'Failed to process message. Invalid JSON format.';
            const returnData: returnType = {
                type: 'error',
                message,
            }
            ws.send(JSON.stringify(returnData));
        }
    });

    ws.on('close', () => {
        const connectUsers = wss.clients.size;
        console.log(`Client disconnected, Connected users: ${connectUsers}`);
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

    const returnData: returnType = {
        channel: undefined,
        type: 'status',
        message: 'Welcome to the WebSocket server!'
    }
    ws.send(JSON.stringify(returnData));
});

wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
});
