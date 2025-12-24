import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AddReactionDto } from './dto/add-reaction.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createPostDto: CreatePostDto, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.create(createPostDto, userId);
      return {
        success: true,
        message: 'Post created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('cooperative/:cooperativeId')
  async findAll(
    @Param('cooperativeId') cooperativeId: string,
    @Query() query: any,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.findAll(cooperativeId, userId, query);
      return {
        success: true,
        message: 'Posts retrieved successfully',
        ...data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch posts',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.findOne(id, userId);
      return {
        success: true,
        message: 'Post retrieved successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.update(id, updatePostDto, userId);
      return {
        success: true,
        message: 'Post updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.delete(id, userId);
      return {
        success: true,
        message: 'Post deleted successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/pin')
  async pin(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.pin(id, userId);
      return {
        success: true,
        message: 'Post pinned successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to pin post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/unpin')
  async unpin(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.unpin(id, userId);
      return {
        success: true,
        message: 'Post unpinned successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to unpin post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.approve(id, userId);
      return {
        success: true,
        message: 'Post approved successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to approve post',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Reactions
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reactions')
  async addReaction(
    @Param('id') id: string,
    @Body() addReactionDto: AddReactionDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.addReaction(id, addReactionDto, userId);
      return {
        success: true,
        message: 'Reaction added successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to add reaction',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/reactions')
  async removeReaction(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.removeReaction(id, userId);
      return {
        success: true,
        message: 'Reaction removed successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to remove reaction',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Comments
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.addComment(id, createCommentDto, userId);
      return {
        success: true,
        message: 'Comment added successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to add comment',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/comments')
  async getComments(@Param('id') id: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.getComments(id, userId);
      return {
        success: true,
        message: 'Comments retrieved successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch comments',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.deleteComment(commentId, userId);
      return {
        success: true,
        message: 'Comment deleted successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete comment',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Comment reactions
  @UseGuards(AuthGuard('jwt'))
  @Post('comments/:commentId/reactions')
  async addCommentReaction(
    @Param('commentId') commentId: string,
    @Body() addReactionDto: AddReactionDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.addCommentReaction(commentId, addReactionDto, userId);
      return {
        success: true,
        message: 'Reaction added successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to add reaction',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('comments/:commentId/reactions')
  async removeCommentReaction(@Param('commentId') commentId: string, @Request() req: any) {
    try {
      const userId = req.user?.id;
      const data = await this.postsService.removeCommentReaction(commentId, userId);
      return {
        success: true,
        message: 'Reaction removed successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to remove reaction',
          data: null,
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
