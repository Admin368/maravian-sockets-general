# WebSocket Relay Server

A general-purpose WebSocket server that allows clients to create, subscribe to, and publish messages on arbitrary channels. The server acts as a relay, forwarding messages from publishers to all subscribed clients.

## Features

- Multiple channels support: clients can subscribe to any number of channels
- Cross-platform: any client that supports WebSockets can connect
- Simple JSON-based protocol
- Docker support for easy deployment

## Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- pnpm
- Docker (for containerized deployment)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```

### Development

Run the server in development mode:
```
pnpm dev
```

### Building

Build the TypeScript project:
```
pnpm build
```

### Production

Run the server in production mode:
```
pnpm start
```

## Docker Deployment

Build the Docker image:
```
docker build -t websocket-relay-server .
```

Run the container:
```
docker run -p 6071:6071 websocket-relay-server
```

## Protocol

The server expects JSON messages with the following structure:

### Subscribe to a channel

```json
{
  "type": "subscribe",
  "channel": "channel-name"
}
```

### Publish to a channel

```json
{
  "type": "publish",
  "channel": "channel-name",
  "data": {
    // Any JSON data to be sent to subscribers
  }
}
```

### Message reception

When a message is published to a subscribed channel, clients receive:

```json
{
  "type": "message",
  "channel": "channel-name",
  "data": {
    // The data that was published
  }
}
```

## License

ISC