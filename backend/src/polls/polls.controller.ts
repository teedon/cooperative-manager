import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PollsService } from './polls.service';
import { CreatePollDto, CastVoteDto } from './dto';

@Controller('polls')
@UseGuards(AuthGuard('jwt'))
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  create(@Body() createPollDto: CreatePollDto, @Request() req: any) {
    return this.pollsService.create(createPollDto, req.user?.id);
  }

  @Get('cooperative/:cooperativeId')
  findAll(
    @Param('cooperativeId') cooperativeId: string,
    @Query() query: any,
    @Request() req: any,
  ) {
    return this.pollsService.findAll(cooperativeId, req.user?.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.pollsService.findOne(id, req.user?.id);
  }

  @Post(':id/vote')
  castVote(
    @Param('id') id: string,
    @Body() castVoteDto: CastVoteDto,
    @Request() req: any,
  ) {
    return this.pollsService.castVote(id, castVoteDto, req.user?.id);
  }

  @Post(':id/close')
  closePoll(@Param('id') id: string, @Request() req: any) {
    return this.pollsService.closePoll(id, req.user?.id);
  }

  @Post(':id/pin')
  pinPoll(@Param('id') id: string, @Request() req: any) {
    return this.pollsService.pinPoll(id, req.user?.id);
  }

  @Post(':id/unpin')
  unpinPoll(@Param('id') id: string, @Request() req: any) {
    return this.pollsService.unpinPoll(id, req.user?.id);
  }

  @Delete(':id')
  deletePoll(@Param('id') id: string, @Request() req: any) {
    return this.pollsService.deletePoll(id, req.user?.id);
  }
}
