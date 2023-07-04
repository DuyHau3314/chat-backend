import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

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
  public CLOUD_NAME = '';
  public CLOUD_API_KEY = '';
  public CLOUD_API_SECRET = '';
  public SENDER_EMAIL = '';
  public SENDER_EMAIL_PASSWORD = '';
  // public SENDGRID_API_KEY = '';
  // public SENDGRID_SENDER = '';

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
    this.CLOUD_NAME = process.env.CLOUD_NAME || '';
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
    this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
    // this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
    // this.SENDGRID_SENDER = process.env.SENDGRID_SENDER || '';
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

  public cloudinaryConfig(): void {
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_key: this.CLOUD_API_KEY,
      api_secret: this.CLOUD_API_SECRET
    });
  }
}

export const config: Config = new Config();
