import HTTP_STATUS from 'http-status-codes';
import JWT from 'jsonwebtoken';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { loginSchema } from '@auth/schemes/signin';
import { joiValidation } from '@globals/decorators/joi-validation.decorators';
import { BadRequestError } from '@globals/helpers/error-handler';
import { authService } from '@services/db/auth.service';
import { Request, Response } from 'express';
import { config } from '@root/config';
import { IResetPasswordParams, IUserDocument } from '@user/interfaces/user.interface';
import { userService } from '@services/db/user.service';
import { forgotPasswordTemplate } from '@services/emails/templates/forgot-pasword/forgot-password-template';
import { emailQueue } from '@services/queues/email.queue';
import moment from 'moment';
import publicIp from 'ip';
import { resetPasswordTemplate } from '@services/emails/templates/reset-password/reset-password-template';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }
    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);
    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    req.session = { jwt: userJwt };

    const templateParams: IResetPasswordParams = {
      username: existingUser.username,
      email: existingUser.email,
      ipaddress: publicIp.address(),
      date: moment().format('MMMM Do YYYY, h:mm:ss a')
    };
    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);

    emailQueue.addEmailJob('forgotPasswordEmail', {
      template,
      receiverEmail: 'karlee9@ethereal.email',
      subject: 'Password reset confirmation'
    });

    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument;
    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: userDocument, token: userJwt });
  }
}
