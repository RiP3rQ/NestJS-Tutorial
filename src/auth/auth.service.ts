import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      // generate the password hash
      const passwordHash = await argon.hash(dto.password);

      // save the user in the db
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash: passwordHash,
        },
      });

      // return jwt token
      return this.signToken(user.id, user.email);
    } catch (err) {
      // if (err instanceof PrismaClientKnownRequestError) {
      //   if (err.code === 'P2002') {
      //     throw new Error('User already exists');
      //   }
      // }
      if (err.code === 'P2002') {
        throw new ForbiddenException('User already exists');
      }
      throw err;
    }
  }

  async login(dto: AuthDto) {
    // find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // if not found, throw an error
    if (!user) {
      throw new ForbiddenException('User does not exist');
    }
    // compare the password hash from database with the actual password
    const match = await argon.verify(user.hash, dto.password);
    // if not match, throw an error
    if (!match) {
      throw new ForbiddenException('Invalid credentials');
    }

    // return jwt token
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '30m',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
