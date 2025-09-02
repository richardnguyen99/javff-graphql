import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Video } from "src/v1/video/video.entity";

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>
  ) {}

  findAll(): Promise<Video[]> {
    return this.videoRepository.find({
      relations: ["actresses", "series", "maker"],
    });
  }

  findOne(id: number): Promise<Video> {
    return this.videoRepository.findOne({
      where: { id },
      relations: ["actresses", "series", "maker"],
    });
  }

  create(data: Partial<Video>): Promise<Video> {
    const video = this.videoRepository.create(data);
    return this.videoRepository.save(video);
  }
}
