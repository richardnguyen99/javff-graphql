import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { CreateActressInput } from "src/v1/actress/dto/create-actress.input";
import { UpdateActressInput } from "src/v1/actress/dto/update-actress.input";
import { ActressQueryOptionsInput } from "./dto/actress-query-options.input";
import {
  ActressConnection,
  ActressEdge,
  PageInfo,
} from "./dto/actress-connection.output";

@Injectable()
export class ActressService {
  constructor(
    @InjectRepository(Actress)
    private readonly actressRepository: Repository<Actress>,
    @InjectRepository(ActressImage)
    private readonly actressImageRepository: Repository<ActressImage>
  ) {}

  findAll(options?: ActressQueryOptionsInput): Promise<Actress[]> {
    const qb = this.actressRepository.createQueryBuilder("actress");

    if (options?.cup) {
      qb.andWhere("actress.cup = :cup", { cup: options.cup });
    }

    if (options?.bust !== undefined) {
      qb.andWhere("actress.bust >= :bust", { bust: options.bust });
    }

    if (options?.waist !== undefined) {
      qb.andWhere("actress.waist >= :waist", { waist: options.waist });
    }

    if (options?.hip !== undefined) {
      qb.andWhere("actress.hip >= :hip", { hip: options.hip });
    }

    if (options?.year !== undefined) {
      qb.andWhere("EXTRACT(YEAR FROM actress.birthday) <= :year", {
        year: options.year,
      });
    }

    return qb.getMany();
  }

  findOne(id: number): Promise<Actress> {
    return this.actressRepository.findOne({
      where: { id },
      relations: ["videos", "images"],
    });
  }

  findByName(name: string): Promise<Actress[]> {
    return this.actressRepository
      .createQueryBuilder("actress")
      .leftJoinAndSelect("actress.images", "images")
      .leftJoinAndSelect("actress.videos", "videos")
      .where("actress.name ILIKE :name", { name: `%${name}%` })
      .orWhere("actress.displayName ILIKE :name", { name: `%${name}%` })
      .orWhere("actress.ruby ILIKE :name", { name: `%${name}%` })
      .getMany();
  }

  findByDmmId(dmmId: string): Promise<Actress> {
    return this.actressRepository.findOne({
      where: { dmmId },
      relations: ["videos", "images"],
    });
  }

  async create(data: CreateActressInput): Promise<Actress> {
    const { images, ...actressData } = data;

    const actress = this.actressRepository.create(actressData);
    const savedActress = await this.actressRepository.save(actress);

    if (images && images.length > 0) {
      const imageEntities = images.map((img) =>
        this.actressImageRepository.create({ ...img, actress: savedActress })
      );

      await this.actressImageRepository.save(imageEntities);
      savedActress.images = imageEntities;
    }

    return savedActress;
  }

  update(id: number, data: UpdateActressInput): Promise<Actress> {
    return this.actressRepository.save({ id, ...data });
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.actressRepository.delete(id);
    return result.affected > 0;
  }

  private decodeCursor(cursor: string): number {
    return parseInt(Buffer.from(cursor, "base64").toString("ascii"), 10);
  }

  private encodeCursor(id: number): string {
    return Buffer.from(id.toString()).toString("base64");
  }

  async findAllConnection(
    options?: ActressQueryOptionsInput
  ): Promise<ActressConnection> {
    const qb = this.actressRepository
      .createQueryBuilder("actress")
      .leftJoinAndSelect("actress.images", "images");

    if (options?.cup) {
      qb.andWhere("actress.cup = :cup", { cup: options.cup });
    }

    if (options?.bust !== undefined) {
      qb.andWhere("actress.bust >= :bust", { bust: options.bust });
    }

    if (options?.waist !== undefined) {
      qb.andWhere("actress.waist >= :waist", { waist: options.waist });
    }

    if (options?.hip !== undefined) {
      qb.andWhere("actress.hip >= :hip", { hip: options.hip });
    }

    if (options?.year !== undefined) {
      qb.andWhere("EXTRACT(YEAR FROM actress.birthday) <= :year", {
        year: options.year,
      });
    }

    const totalQb = qb.clone();

    let forward = true;
    let limit = options?.first ?? 20;
    if (options?.last) {
      forward = false;
      limit = options.last;
    }

    if (options?.after) {
      const afterId = this.decodeCursor(options.after);
      qb.andWhere("actress.id > :afterId", { afterId });
    }
    if (options?.before) {
      const beforeId = this.decodeCursor(options.before);
      qb.andWhere("actress.id < :beforeId", { beforeId });
    }

    let sortField = "actress.id";
    const sortOrder = options?.sortOrder ?? "ASC";

    if (options?.sortBy === "cup") {
      sortField = "actress.cup";
    } else if (options?.sortBy === "bust") {
      sortField = "actress.bust";
    } else if (options?.sortBy === "waist") {
      sortField = "actress.waist";
    } else if (options?.sortBy === "hip") {
      sortField = "actress.hip";
    } else if (options?.sortBy === "height") {
      sortField = "actress.height";
    } else if (options?.sortBy === "birthday") {
      sortField = "actress.birthday";
    }

    if (
      (sortField === "actress.cup" ||
        sortField === "actress.bust" ||
        sortField === "actress.waist" ||
        sortField === "actress.hip" ||
        sortField === "actress.height" ||
        sortField === "actress.birthday") &&
      sortOrder === "DESC"
    ) {
      qb.orderBy(sortField, "DESC", "NULLS LAST").addOrderBy(
        "actress.id",
        sortOrder
      );
    } else {
      qb.orderBy(sortField, sortOrder).addOrderBy("actress.id", sortOrder);
    }

    qb.take(limit + 1);

    const [results, totalCount] = await Promise.all([
      qb.getMany(),
      totalQb.getCount(),
    ]);

    let hasNextPage = false;
    let hasPreviousPage = false;
    let edges: ActressEdge[] = [];

    if (results.length > limit) {
      hasNextPage = true;
      results.pop();
    }

    if (!forward) {
      results.reverse();
      hasPreviousPage = hasNextPage;
      hasNextPage = false;
    } else {
      if (options?.after) {
        const prevQb = this.actressRepository.createQueryBuilder("actress");
        if (options?.cup) {
          prevQb.andWhere("actress.cup = :cup", { cup: options.cup });
        }
        prevQb.andWhere("actress.id <= :afterId", {
          afterId: this.decodeCursor(options.after),
        });
        prevQb.orderBy("actress.id", "ASC");
        prevQb.take(1);
        const prev = await prevQb.getOne();
        hasPreviousPage = !!prev;
      }
    }

    edges = results.map((actress) => ({
      cursor: this.encodeCursor(actress.id),
      node: actress,
    }));

    const pageInfo: PageInfo = {
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
