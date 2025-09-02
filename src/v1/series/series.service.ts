import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Series } from "src/v1/series/series.entity";

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: Repository<Series>
  ) {}

  findAll(): Promise<Series[]> {
    return this.seriesRepository.find({ relations: ["videos"] });
  }

  findOne(id: number): Promise<Series> {
    return this.seriesRepository.findOne({
      where: { id },
      relations: ["videos"],
    });
  }

  create(data: Partial<Series>): Promise<Series> {
    const series = this.seriesRepository.create(data);
    return this.seriesRepository.save(series);
  }
}
