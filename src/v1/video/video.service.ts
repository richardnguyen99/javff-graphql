import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Video } from "src/v1/video/video.entity";
import { VideoConnection } from "src/v1/video/dto/video-connection.output";
import { VideoQueryOptionsInput } from "src/v1/video/dto/video-query-options.input";

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

  async findAllConnection(
    options?: VideoQueryOptionsInput
  ): Promise<VideoConnection> {
    const first = options?.first;
    const after = options?.after;
    const last = options?.last;
    const before = options?.before;

    const qb = this.videoRepository.createQueryBuilder("video");

    const totalQb = qb.clone();

    let forward = true;
    let limit = first ?? 20;
    if (last) {
      forward = false;
      limit = last;
    }

    if (after) {
      const afterId = Buffer.from(after, "base64").toString("ascii");
      qb.andWhere("video.id > :afterId", { afterId: Number(afterId) });
    }

    if (before) {
      const beforeId = Buffer.from(before, "base64").toString("ascii");
      qb.andWhere("video.id < :beforeId", { beforeId: Number(beforeId) });
    }

    qb.orderBy("video.id", "ASC");
    qb.take(limit + 1);

    const [results, totalCount] = await Promise.all([
      qb.getMany(),
      totalQb.getCount(),
    ]);

    let hasNextPage = false;
    let hasPreviousPage = false;
    let edges = [];

    if (results.length > limit) {
      hasNextPage = true;
      results.pop();
    }

    if (!forward) {
      results.reverse();
      hasPreviousPage = hasNextPage;
      hasNextPage = false;
    } else if (after) {
      const prevQb = this.videoRepository.createQueryBuilder("video");
      prevQb.andWhere("video.id <= :afterId", {
        afterId: Number(Buffer.from(after, "base64").toString("ascii")),
      });
      prevQb.orderBy("video.id", "ASC");
      prevQb.take(1);
      const prev = await prevQb.getOne();
      hasPreviousPage = !!prev;
    }

    edges = results.map((video) => ({
      cursor: Buffer.from(video.id.toString()).toString("base64"),
      node: video,
    }));

    const pageInfo = {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    return {
      edges,
      pageInfo,
      totalCount,
    };
  }
}
