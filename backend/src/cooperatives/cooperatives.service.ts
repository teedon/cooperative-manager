import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';

@Injectable()
export class CooperativesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cooperative.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coop = await this.prisma.cooperative.findUnique({ where: { id } });
    if (!coop) throw new NotFoundException('Cooperative not found');
    return coop;
  }

  async create(dto: CreateCooperativeDto, createdBy?: string) {
    const created = await this.prisma.cooperative.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        status: dto.status ?? 'active',
        createdBy: createdBy ?? null,
      },
    });
    return created;
  }
}
