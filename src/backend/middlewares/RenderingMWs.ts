import {NextFunction, Request, Response} from 'express';
import {ErrorCodes, ErrorDTO} from '../../common/entities/Error';
import {Utils} from '../../common/Utils';
import {Message} from '../../common/entities/Message';
import {SharingDTO} from '../../common/entities/SharingDTO';
import {Config} from '../../common/config/private/Config';
import {ConfigClass} from '../../common/config/private/ConfigClass';
import {UserRoles} from '../../common/entities/UserDTO';
import {NotificationManager} from '../model/NotifocationManager';
import {Logger} from '../Logger';

export class RenderingMWs {

  public static renderResult(req: Request, res: Response, next: NextFunction) {
    if (typeof req.resultPipe === 'undefined') {
      return next();
    }

    return RenderingMWs.renderMessage(res, req.resultPipe);
  }


  public static renderSessionUser(req: Request, res: Response, next: NextFunction) {
    if (!(req.session.user)) {
      return next(new ErrorDTO(ErrorCodes.GENERAL_ERROR, 'User not exists'));
    }

    const user = Utils.clone(req.session.user);
    delete user.password;
    RenderingMWs.renderMessage(res, user);
  }

  public static renderSharing(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }

    const sharing = Utils.clone<SharingDTO>(req.resultPipe);
    delete sharing.password;
    RenderingMWs.renderMessage(res, sharing);
  }

  public static renderFile(req: Request, res: Response, next: NextFunction) {
    if (!req.resultPipe) {
      return next();
    }
    return res.sendFile(req.resultPipe, {maxAge: 31536000, dotfiles: 'allow'});
  }

  public static renderOK(req: Request, res: Response, next: NextFunction) {
    const message = new Message<string>(null, 'ok');
    res.json(message);
  }


  public static renderConfig(req: Request, res: Response, next: NextFunction) {
    const message = new Message<ConfigClass>(null, Config.original());
    res.json(message);
  }


  public static renderError(err: any, req: Request, res: Response, next: NextFunction): any {

    if (err instanceof ErrorDTO) {
      if (err.details) {
        Logger.warn('Handled error:');
        console.log(err);
        delete (err.details); // do not send back error object to the client side

        // hide error details for non developers
        if (!(req.session.user && req.session.user.role >= UserRoles.Developer)) {
          delete (err.detailsStr);
        }
      }
      const message = new Message<any>(err, null);
      return res.json(message);
    }
    NotificationManager.error('unknown server error', err);
    return next(err);
  }


  protected static renderMessage<T>(res: Response, content: T) {
    const message = new Message<T>(null, content);
    res.json(message);
  }


}
