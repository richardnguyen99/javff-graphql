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

  async findAllConnection(
    options?: ActressQueryOptionsInput
  ): Promise<ActressConnection> {
    const qb = this.actressRepository.createQueryBuilder("actress");

    if (options?.cup) {
      qb.andWhere("actress.cup = :cup", { cup: options.cup });
    }

    if (options?.after) {
      // Decode the cursor (base64 encoded id)
      const afterId = parseInt(
        Buffer.from(options.after, "base64").toString("ascii"),
        10
      );
      qb.andWhere("actress.id > :afterId", { afterId });
    }

    const take = options?.first ?? 20;
    qb.orderBy("actress.id", "ASC").take(take + 1); // fetch one extra to check hasNextPage

    const results = await qb.getMany();

    const edges: ActressEdge[] = results.slice(0, take).map((actress) => ({
      cursor: Buffer.from(actress.id.toString()).toString("base64"),
      node: actress,
    }));

    return {
      edges,
      hasNextPage: results.length > take,
    };
  }
}
