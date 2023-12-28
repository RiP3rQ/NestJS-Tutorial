import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

      // delete user hash from the response
      delete user.hash;

      // return the user
      return user;
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
    // delete user hash from the response
    delete user.hash;
    // send the user back
    return user;
  }
}
