import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config();

class Config {
  public DATABASE_URL = '';
  public JWT_TOKEN = '';
  public PORT: number | 4000;
  public SECRET_KEY_TWO = '';
  public SECRET_KEY_ONE = '';
  public CLIENT_URL = '';
  public NODE_ENV = '';
  public REDIS_HOST = '';

  private readonly DEFAULT_DATABASE_URL = 'mongodb://localhost:27017/chattyapp-backend';

  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL;
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.PORT = Number(process.env.PORT) || 4000;
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (!value) {
        throw new Error(`Missing config value for ${key}`);
      }
    }
  }
}

export const config: Config = new Config();
