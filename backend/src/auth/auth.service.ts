import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

type TokenPair = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async validateUser(email: string, pass: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    // remove password before returning
    // @ts-ignore
    const { password, ...safe } = user;
    return safe;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload, { expiresIn: '1h' });
    const refreshToken = randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshToken(user.id, hashed);
    return { accessToken, refreshToken } as TokenPair;
  }

  async register(createDto: any) {
    const existing = await this.users.findByEmail(createDto.email);
    if (existing) throw new UnauthorizedException('Email already in use');
    const user = await this.users.create(createDto);
    // @ts-ignore
    const { password, ...safe } = user;
    // issue tokens similar to login
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '1h' });
    const refreshToken = randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshToken(user.id, hashed);
    return { user: safe, accessToken, refreshToken };
  }

  async refresh(oldRefreshToken: string) {
    try {
      // we signed refresh tokens as opaque random strings, so we must find the user by comparing hashed token
      // search users where refreshToken is not null and compare
      const users = await (this.users as any).prisma.user.findMany({ where: { refreshToken: { not: null } } });
      for (const u of users) {
        if (u.refreshToken && (await bcrypt.compare(oldRefreshToken, u.refreshToken))) {
          // matched user
          const accessToken = this.jwt.sign({ sub: u.id, email: u.email }, { expiresIn: '1h' });
          const newRefreshToken = randomBytes(64).toString('hex');
          const hashed = await bcrypt.hash(newRefreshToken, 10);
          await this.users.setRefreshToken(u.id, hashed);
          return { accessToken, refreshToken: newRefreshToken } as TokenPair;
        }
      }
      throw new UnauthorizedException('Invalid refresh token');
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    // @ts-ignore
    const { password, refreshToken, ...safe } = user;
    return safe;
  }

  async logout(userId: string) {
    await this.users.clearRefreshToken(userId);
    return { success: true };
  }
}
