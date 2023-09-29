import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from 'bunyan';
import 'express-async-errors';
import applicationRoutes from '@root/routes';
import { CustomError, IErrorResponse } from '@globals/helpers/error-handler';
import { config } from '@root/config';
import { SocketIOPostHandler } from '@sockets/post';
import { SocketIONotificationHandler } from '@sockets/notification';
import { SocketIOFollowerHandler } from '@sockets/follower';
import { SocketIOUserHandler } from '@sockets/user';
import { SocketIOImageHandler } from '@sockets/image';

const SERVER_PORT = config.PORT;
const log: Logger = config.createLogger('server');

export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE, config.SECRET_KEY_TWO],
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: config.NODE_ENV === 'production'
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true, // Need to true for cookie
        optionsSuccessStatus: HTTP_STATUS.OK,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' })); //for form data
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', async (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: `${req.originalUrl} not found`
      });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }

      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      }
    });

    const pubClient = createClient({
      url: config.REDIS_HOST
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server started at port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {
    const postSocketHandler: SocketIOPostHandler = new SocketIOPostHandler(io);
    const followerSocketHandler: SocketIOFollowerHandler = new SocketIOFollowerHandler(io);
    const notificationSocketHandler: SocketIONotificationHandler = new SocketIONotificationHandler();
    const userSocketHandler: SocketIOUserHandler = new SocketIOUserHandler(io);
    const imageSocketHandler: SocketIOImageHandler = new SocketIOImageHandler();


    postSocketHandler.listen();
    notificationSocketHandler.listen(io);
    followerSocketHandler.listen();
    userSocketHandler.listen();
    imageSocketHandler.listen(io);
  }
}
