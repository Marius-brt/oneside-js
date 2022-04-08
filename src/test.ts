import oneside, { cookieParser } from './index';

const app = oneside({
  address: '192.168.0.185',
  serverType: 'http',
});

app.get('/', cookieParser, (req, res) => {
  console.log(req.headers);
  console.log(req.cookies);
  res.send('Hello World!');
});

app.listen();
