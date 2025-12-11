import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CooperativesService } from './cooperatives.service';
import { CreateCooperativeDto } from './dto/create-cooperative.dto';

@Controller('cooperatives')
export class CooperativesController {
  constructor(private readonly service: CooperativesService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req: any, @Body() dto: CreateCooperativeDto) {
    // req.user is populated by JwtStrategy.validate
    const user = req.user;
    return this.service.create(dto, user?.id);
  }
}
