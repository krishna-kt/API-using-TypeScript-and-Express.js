import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { sequelize } from './config/database';
import { Item } from './models/item';

const app = express();
const port = 3000;
const secret = 'my-secret-key';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Authorization header is missing');
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyToken(token);
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Unauthorized' });
  }
}

function generateToken(userId: number): string {
  return jwt.sign({ userId }, secret, { expiresIn: '1h' });
}

function verifyToken(token: string): Promise<{ userId: number }> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(decoded as { userId: number });
    });
  });
}

app.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  // TODO: Implement user registration
  res.send({ message: 'User registered successfully' });
});

app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  // TODO: Implement user authentication
  const token = generateToken(1);
  res.send({ token });
});

app.post('/items', authenticate, async (req: Request, res: Response) => {
  const { name, description, price } = req.body;
  const item = await Item.create({ name, description, price });
  res.send(item);
});

app.get('/items', authenticate, async (req: Request, res: Response) => {
  const items = await Item.findAll();
  res.send(items);
});

app.get('/items/:id', authenticate, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const item = await Item.findByPk(id);
  if (!item) {
    res.status(404).send({ error: 'Item not found' });
    return;
  }
  res.send(item);
});

app.put('/items/:id', authenticate, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, price } = req.body;
  const item = await Item.findByPk(id);
  if (!item) {
    res.status(404).send({ error: 'Item not found' });
    return;
  }
  item.name = name;
  item.description = description;
  item.price = price;
  await item.save();
  res.send(item);
});

app.delete('/items/:id', authenticate, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const item = await Item.findByPk(id);
  if (!item) {
    res.status(404).send({ error: 'Item not found' });
    return;
  }
  await item.destroy();
  res.send({ message: 'Item deleted successfully' });
});

sequelize.sync().then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });