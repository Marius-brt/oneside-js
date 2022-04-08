import { print, drawTree, printConsole } from './utils';
import { createInterface } from 'readline';
import { stdin as input, stdout as output } from 'node:process';
import { Server } from './server';

global.rl = createInterface({ input, output });

export function CLI(server: Server) {
  global.rl.question('> ', (cmd) => {
    cmd = cmd.trim();
    if (cmd == '') {
      print('error', 'Command cannot be empty');
    } else {
      const splt = cmd.split(' ');
      switch (splt[0]) {
        case 'help':
          print('log', 'Available commands:');
          print('log', ' - help: print commands');
          print('log', ' - endpoints: print all the endpoints');
          print('log', ' - (cls | clear): clear the CLI');
          print('log', ' - exit: stop the server');
          break;
        case 'endpoints':
          drawTree(global.endpoints, global.errors);
          break;
        case 'cls':
        case 'clear':
          printConsole();
          break;
        case 'exit':
          process.exit(0);
        default:
          print('error', "Command '" + splt[0] + "' not found");
          break;
      }
    }
    CLI(server);
  });
}
