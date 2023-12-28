import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  login() {
    return {
      message: 'I am login',
    };
  }

  signup() {
    return {
      message: 'I am signup',
    };
  }
}
