import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { AttendeeAnswerEnum } from './attendee.entity';
import { ListEvents, WhenEventFilter } from './input/list.event';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  private getEventsBaseQuery() {
    return this.eventsRepository
      .createQueryBuilder('e')
      .orderBy('e.id', 'DESC');
  }

  public getEventsWithAttendeeCountQuery() {
    return this.getEventsBaseQuery()
      .loadRelationCountAndMap('e.attendeeCount', 'e.attendees')
      .loadRelationCountAndMap(
        'e.attendeeAccepted',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Accepted,
          }),
      )
      .loadRelationCountAndMap('e.attendeeCount', 'e.attendees')
      .loadRelationCountAndMap(
        'e.attendeeMaybe',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Maybe,
          }),
      )
      .loadRelationCountAndMap('e.attendeeCount', 'e.attendees')
      .loadRelationCountAndMap(
        'e.attendeeRejected',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.where('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Rejected,
          }),
      );
  }

  public async getEventsWithAttendeeCountFiltered(filter?: ListEvents) {
    let query = this.getEventsWithAttendeeCountQuery();

    if (!filter) {
      return query.getMany();
    }

    if (filter.when) {
      if (filter.when == WhenEventFilter.Today) {
        query = query.andWhere(
          `e.when >= CURRENT_DATE() AND e.when <= CURRENT_DATE() + INTERVAL 1 DAY`,
        );
      }
    }

    if (filter.when == WhenEventFilter.Tomorrow) {
      query = query.andWhere(
        `e.when >= CURRENT_DATE() + INTERVAL 1 DAY AND e.when <= CURRENT_DATE() + INTERVAL 2 DAY`,
      );
    }

    if (filter.when == WhenEventFilter.ThisWeek) {
      query = query.andWhere('EXTRACT(e.when, 1) = EXTRACT(CURRENT_DATE(), 1)');
    }

    if (filter.when == WhenEventFilter.NextWeek) {
      query = query.andWhere(
        'EXTRACT(e.when, 1) = EXTRACT(CURRENT_DATE(), 1) + 1',
      );
    }

    return await query.getMany();
  }

  public async getEvent(id: number): Promise<Event | undefined> {
    const query = await this.getEventsWithAttendeeCountQuery().andWhere(
      'e.id = :id',
      {
        id,
      },
    );

    this.logger.debug(query.getSql());

    return await query.getOne();
  }
}
