import { userService } from '@services/db/user.service';
import { UserCache } from '@services/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let user = null;
    let token = null;

    const cachedUser = (await userCache.getUserFromCache(req.currentUser?.userId as string)) as IUserDocument;

    const existingUser: IUserDocument = cachedUser
      ? cachedUser
      : ((await userService.getUserById(req.currentUser?.userId as string)) as IUserDocument);

    if (Object.keys(existingUser).length) {
      isUser = true;
      token = req.session?.jwt;
      user = existingUser;
    }

    res.status(200).send({
      isUser,
      user,
      token
    });
  }
}
