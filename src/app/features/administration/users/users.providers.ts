import { inject, InjectionToken } from '@angular/core';
import {
  BlockOperationalUser,
  CreateOperationalUser,
  GetOperationalUser,
  GetUserCredential,
  InactivateOperationalUser,
  ListUsers,
  ReactivateOperationalUser,
  RequestUserCredentialActivation,
  UpdateOperationalUser,
} from './application';
import { AuthUserCredentialsApiAdapter, OsUsersApiAdapter } from './infrastructure';

export const LIST_USERS = new InjectionToken<ListUsers>('LIST_USERS', {
  providedIn: 'root',
  factory: () => new ListUsers(inject(OsUsersApiAdapter)),
});
export const GET_OPERATIONAL_USER = new InjectionToken<GetOperationalUser>('GET_OPERATIONAL_USER', {
  providedIn: 'root',
  factory: () => new GetOperationalUser(inject(OsUsersApiAdapter)),
});
export const CREATE_OPERATIONAL_USER = new InjectionToken<CreateOperationalUser>(
  'CREATE_OPERATIONAL_USER',
  { providedIn: 'root', factory: () => new CreateOperationalUser(inject(OsUsersApiAdapter)) },
);
export const UPDATE_OPERATIONAL_USER = new InjectionToken<UpdateOperationalUser>(
  'UPDATE_OPERATIONAL_USER',
  { providedIn: 'root', factory: () => new UpdateOperationalUser(inject(OsUsersApiAdapter)) },
);
export const BLOCK_OPERATIONAL_USER = new InjectionToken<BlockOperationalUser>(
  'BLOCK_OPERATIONAL_USER',
  { providedIn: 'root', factory: () => new BlockOperationalUser(inject(OsUsersApiAdapter)) },
);
export const REACTIVATE_OPERATIONAL_USER = new InjectionToken<ReactivateOperationalUser>(
  'REACTIVATE_OPERATIONAL_USER',
  { providedIn: 'root', factory: () => new ReactivateOperationalUser(inject(OsUsersApiAdapter)) },
);
export const INACTIVATE_OPERATIONAL_USER = new InjectionToken<InactivateOperationalUser>(
  'INACTIVATE_OPERATIONAL_USER',
  { providedIn: 'root', factory: () => new InactivateOperationalUser(inject(OsUsersApiAdapter)) },
);
export const GET_USER_CREDENTIAL = new InjectionToken<GetUserCredential>('GET_USER_CREDENTIAL', {
  providedIn: 'root',
  factory: () => new GetUserCredential(inject(AuthUserCredentialsApiAdapter)),
});
export const REQUEST_USER_CREDENTIAL_ACTIVATION =
  new InjectionToken<RequestUserCredentialActivation>('REQUEST_USER_CREDENTIAL_ACTIVATION', {
    providedIn: 'root',
    factory: () => new RequestUserCredentialActivation(inject(AuthUserCredentialsApiAdapter)),
  });
