import WebSocket from 'ws';
import readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:6071');

// Subscribed channels
const subscribedChannels = new Set<string>();

// Process user commands
const processCommand = (input: string) => {
  const parts = input.trim().split(' ');
  const command = parts[0].toLowerCase();

  switch (command) {
    case 'subscribe':
      if (parts.length < 2) {
        console.log('Usage: subscribe <channel>');
        return;
      }
      const subscribeChannel = parts[1];
      ws.send(JSON.stringify({ type: 'subscribe', channel: subscribeChannel }));
      subscribedChannels.add(subscribeChannel);
      console.log(`Subscribing to channel: ${subscribeChannel}`);
      break;

    case 'publish':
      if (parts.length < 3) {
        console.log('Usage: publish <channel> <message>');
        return;
      }
      const publishChannel = parts[1];
      const message = parts.slice(2).join(' ');
      ws.send(JSON.stringify({ type: 'publish', channel: publishChannel, data: message }));
      console.log(`Publishing to channel ${publishChannel}: ${message}`);
      break;

    case 'channels':
      console.log('Subscribed channels:', Array.from(subscribedChannels).join(', ') || 'None');
      break;

    case 'help':
      console.log(`
Available commands:
  subscribe <channel> - Subscribe to a channel
  publish <channel> <message> - Publish a message to a channel
  channels - List subscribed channels
  help - Show this help
  exit - Close connection and exit
      `);
      break;

    case 'exit':
      console.log('Closing connection and exiting...');
      ws.close();
      rl.close();
      process.exit(0);
      break;

    default:
      console.log('Unknown command. Type "help" for available commands.');
  }
};

// WebSocket event handlers
ws.on('open', () => {
  console.log('Connected to WebSocket server!');
  console.log('Type "help" for available commands');
  
  // Start reading user input
  rl.prompt();
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('\nReceived message:', JSON.stringify(message, null, 2));
  } catch (error) {
    console.log('\nReceived non-JSON message:', data.toString());
  }
  rl.prompt();
});

ws.on('close', () => {
  console.log('Disconnected from server');
  rl.close();
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  rl.close();
});

// Handle user input
rl.on('line', (input) => {
  processCommand(input);
  rl.prompt();
});