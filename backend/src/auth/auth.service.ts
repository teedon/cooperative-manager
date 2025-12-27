import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { ActivitiesService } from '../activities/activities.service';
import {
  sendEmail,
  generateWelcomeEmailTemplate,
  generatePasswordResetEmailTemplate,
  generatePasswordResetSuccessEmailTemplate,
} from '../services/mailer';

type TokenPair = { accessToken: string; refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private prisma: PrismaService,
    private jwt: JwtService,
    private activitiesService: ActivitiesService,
  ) {}

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

    // Log activity
    await this.activitiesService.log(
      user.id,
      'auth.login',
      'Logged into the system',
      undefined,
      { email: user.email },
    );

    return { accessToken, refreshToken } as TokenPair;
  }

  async register(createDto: any) {
    const existing = await this.users.findByEmail(createDto.email);
    if (existing) throw new UnauthorizedException('Email already in use');
    
    const user = await this.users.create(createDto);
    
    // Link any offline members that match this user's email or phone
    await this.linkOfflineMembers(user.id, user.email, user.phone);
    
    // @ts-ignore
    const { password, ...safe } = user;
    // issue tokens similar to login
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: '1h' });
    const refreshToken = randomBytes(64).toString('hex');
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshToken(user.id, hashed);

    // Log activity
    await this.activitiesService.log(
      user.id,
      'auth.register',
      'Created a new account',
      undefined,
      { email: user.email, firstName: user.firstName, lastName: user.lastName },
    );

    // Send welcome email
    sendEmail(
      user.email,
      'Welcome to CoopManager!',
      generateWelcomeEmailTemplate(`${user.firstName} ${user.lastName}`),
    ).catch(err => console.error('Failed to send welcome email:', err));

    return { user: safe, accessToken, refreshToken };
  }

  /**
   * Link offline members to a newly registered user based on email or phone match.
   * This allows offline members added by admins to take over their accounts.
   */
  private async linkOfflineMembers(userId: string, email: string, phone?: string | null) {
    // Find offline members with matching email
    const emailMatches = email ? await this.prisma.member.findMany({
      where: {
        isOfflineMember: true,
        userId: null,
        email: { equals: email, mode: 'insensitive' },
      },
    }) : [];

    // Find offline members with matching phone (if phone is provided)
    const phoneMatches = phone ? await this.prisma.member.findMany({
      where: {
        isOfflineMember: true,
        userId: null,
        phone: phone,
      },
    }) : [];

    // Combine and deduplicate by member id
    const allMatches = [...emailMatches, ...phoneMatches];
    const uniqueMatches = allMatches.filter((member, index, self) =>
      index === self.findIndex(m => m.id === member.id)
    );

    // Link each matching offline member to the new user
    for (const member of uniqueMatches) {
      await this.prisma.member.update({
        where: { id: member.id },
        data: {
          userId: userId,
          isOfflineMember: false,
          status: 'active', // Automatically activate since they verified their identity
        },
      });

      // Log the account takeover
      await this.activitiesService.log(
        userId,
        'member.account_linked',
        `Linked account to existing membership in cooperative`,
        member.cooperativeId,
        { memberId: member.id },
      );
    }

    return uniqueMatches.length;
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

  /**
   * Return pending invitations for a given email address.
   * Used after signup/login so users can see invites addressed to them.
   */
  async getPendingInvitationsByEmail(email: string) {
    if (!email) return [];
    const invites = await this.prisma.invitation.findMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        status: 'pending',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        cooperative: true,
        inviter: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return invites;
  }

  /**
   * Accept an invitation by id for the authenticated user.
   * Creates a Member entry, marks invite accepted and returns cooperative info.
   */
  async acceptInvitation(userId: string, invitationId: string) {
    const invite = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.status !== 'pending') throw new BadRequestException('Invitation is not pending');
    
    // Check if invitation has expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await this.prisma.invitation.update({ where: { id: invitationId }, data: { status: 'expired' } });
      throw new BadRequestException('This invitation has expired');
    }

    // Ensure the invite targets this user's email or phone (if provided)
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (invite.email) {
      if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new ForbiddenException('This invitation was not sent to your email');
      }
    }
    if (invite.phone && user.phone) {
      const cleanInvitePhone = invite.phone.replace(/\D/g, '');
      const cleanUserPhone = user.phone.replace(/\D/g, '');
      if (cleanInvitePhone !== cleanUserPhone) {
        throw new ForbiddenException('This invitation was not sent to your phone number');
      }
    }

    // Check if user is already a member
    const existing = await this.prisma.member.findFirst({ where: { cooperativeId: invite.cooperativeId, userId } });
    if (existing) {
      // mark invitation accepted anyway
      await this.prisma.invitation.update({ where: { id: invitationId }, data: { status: 'accepted', acceptedBy: userId, acceptedAt: new Date() } });
      throw new BadRequestException('You are already a member of this cooperative');
    }

    // Create member as active
    const member = await this.prisma.member.create({
      data: {
        cooperativeId: invite.cooperativeId,
        userId,
        role: 'member',
        joinedAt: new Date(),
        status: 'active',
        virtualBalance: 0,
      },
    });

    // Update cooperative member count (best-effort)
    try {
      await this.prisma.cooperative.update({ where: { id: invite.cooperativeId }, data: { memberCount: { increment: 1 } as any } });
    } catch (err) {
      // ignore errors here
      console.warn('Failed to increment memberCount for cooperative', invite.cooperativeId, err);
    }

    // Mark invitation accepted
    await this.prisma.invitation.update({ where: { id: invitationId }, data: { status: 'accepted', acceptedBy: userId, acceptedAt: new Date() } });

    // Log activity and notify
    await this.activitiesService.log(
      userId,
      'invitation.accepted',
      `Accepted invitation to join cooperative`,
      invite.cooperativeId,
      { invitationId: invite.id },
    );

    // Notify admins if notifications service is available
    // TODO: Inject NotificationsService if needed
    /*
    try {
      if (this.notificationsService) {
        await this.notificationsService.notifyCooperativeAdmins(
          invite.cooperativeId,
          'member_joined',
          'Member Joined via Invitation',
          `${user.firstName} ${user.lastName} joined via invitation`,
          { memberId: member.id },
        );
      }
    } catch (err) {
      console.warn('Failed to send notification', err);
    }
    */

    const coop = await this.prisma.cooperative.findUnique({ where: { id: invite.cooperativeId } });

    return { cooperative: coop, member };
  }

  async logout(userId: string) {
    await this.users.clearRefreshToken(userId);
    return { success: true };
  }

  /**
   * Initiate forgot password flow - generates a reset token
   */
  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    
    // Don't reveal if email exists or not for security
    if (!user) {
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
    }

    // Generate a secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    // Set token expiry to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save the hashed token and expiry
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    // Log activity
    await this.activitiesService.log(
      user.id,
      'auth.forgot_password',
      'Requested password reset',
      undefined,
      { email: user.email },
    );

    // Generate a 6-digit OTP for the email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send password reset email with OTP (showing the reset token as OTP for simplicity)
    sendEmail(
      user.email,
      'Password Reset Request - CoopManager',
      generatePasswordResetEmailTemplate(
        `${user.firstName} ${user.lastName}`,
        resetToken.substring(0, 6).toUpperCase(), // Use first 6 chars as OTP display
      ),
    ).catch(err => console.error('Failed to send password reset email:', err));

    // In production, you would send an email here with the reset link
    // For now, we return the token (in production, never return the token directly!)
    // The token should be sent via email with a link like: /reset-password?token=xxx
    
    return { 
      message: 'If an account with this email exists, a password reset link has been sent.',
      // Remove this in production - only for development/testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  /**
   * Verify if a reset token is valid
   */
  async verifyResetToken(token: string) {
    // Find users with non-expired reset tokens
    const users = await this.prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    // Check each user's token (since they're hashed)
    for (const user of users) {
      if (user.passwordResetToken && await bcrypt.compare(token, user.passwordResetToken)) {
        return { valid: true, email: user.email };
      }
    }

    throw new BadRequestException('Invalid or expired reset token');
  }

  /**
   * Reset password with a valid token
   */
  async resetPassword(token: string, newPassword: string) {
    // Find users with non-expired reset tokens
    const users = await this.prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    // Find the user with matching token
    let matchedUser = null;
    for (const user of users) {
      if (user.passwordResetToken && await bcrypt.compare(token, user.passwordResetToken)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // Invalidate all sessions
      },
    });

    // Log activity
    await this.activitiesService.log(
      matchedUser.id,
      'auth.password_reset',
      'Password was reset successfully',
      undefined,
      { email: matchedUser.email },
    );

    // Send password reset success email
    sendEmail(
      matchedUser.email,
      'Password Reset Successful - CoopManager',
      generatePasswordResetSuccessEmailTemplate(`${matchedUser.firstName} ${matchedUser.lastName}`),
    ).catch(err => console.error('Failed to send password reset success email:', err));

    return { message: 'Password reset successfully. Please login with your new password.' };
  }
}
