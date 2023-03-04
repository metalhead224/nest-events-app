import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('/events')
export class EventsController {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) {}

  @Get()
  findAll() {}

  @Get(':id')
  async findOne(@Param('id') id) {
    return await this.repository.findOneBy(id);
  }

  @Get('/practise')
  async practise() {
    return await this.repository.find({
      where: { id: 3 },
    });
  }

  @Post()
  create() {}

  @Patch()
  update() {}

  @Delete()
  remove() {}
}
