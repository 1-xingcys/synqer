import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, AuthIdentity } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async upsertUserFromIdentity(
    provider: string,
    providerUserId: string,
    email?: string,
    displayName?: string,
  ): Promise<User> {
    // Check if AuthIdentity exists
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingIdentity) {
      // Update user info if provided
      if (email || displayName) {
        const updatedUser = await this.prisma.user.update({
          where: { id: existingIdentity.userId },
          data: {
            ...(email && { primaryEmail: email }),
            ...(displayName && { displayName }),
          },
        });
        return updatedUser;
      }
      return existingIdentity.user;
    }

    // Create new User and AuthIdentity
    const newUser = await this.prisma.user.create({
      data: {
        displayName,
        primaryEmail: email,
        identities: {
          create: {
            provider,
            providerUserId,
            providerEmail: email,
          },
        },
      },
    });

    return newUser;
  }

  async findUserById(
    userId: number,
  ): Promise<(User & { identities: AuthIdentity[] }) | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        identities: true,
      },
    });
  }
}
