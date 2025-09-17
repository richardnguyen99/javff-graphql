import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { CreateActressInput } from "src/v1/actress/dto/create-actress.input";
import { UpdateActressInput } from "src/v1/actress/dto/update-actress.input";
import { ActressQueryOptionsInput } from "src/v1/actress/dto/actress-query-options.input";
import {
  ActressConnection,
  ActressEdge,
  PageInfo,
} from "src/v1/actress/dto/actress-connection.output";
import {
  AddActressImageInput,
  RemoveActressImageInput,
  UpdateActressImageInput,
} from "src/v1/actress/dto/update-actress-image.input";
import { DeleteActressOutput } from "src/v1/actress/dto/delete-actress.output";

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

    if (options?.height !== undefined) {
      qb.andWhere("actress.height >= :height", { height: options.height });
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

  async update(id: number, data: UpdateActressInput): Promise<Actress> {
    const qb = await this.actressRepository
      .createQueryBuilder()
      .update()
      .set(data)
      .where("id = :id", { id })
      .execute();

    if (qb.affected === 0) {
      throw new NotFoundException(`Actress with ID ${id} not found`);
    }

    return this.actressRepository.findOne({
      where: { id },
    });
  }

  async delete(id: number): Promise<DeleteActressOutput> {
    const actress = await this.actressRepository.findOne({
      where: { id },
      relations: ["images"],
    });

    if (!actress) {
      throw new NotFoundException(`Actress with ID ${id} not found`);
    }

    await this.actressRepository.delete(id);

    return actress;
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

    if (options?.height !== undefined) {
      qb.andWhere("actress.height >= :height", { height: options.height });
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

  async addImageToActress(input: AddActressImageInput): Promise<ActressImage> {
    const actress = await this.actressRepository.findOne({
      where: { id: input.actressId },
    });
    if (!actress)
      throw new NotFoundException(
        `Actress with ID ${input.actressId} not found`
      );

    const imageEntity = this.actressImageRepository.create({
      url: input.url,
      attribute: input.attribute,
      actress: { id: input.actressId },
    });

    return this.actressImageRepository.save(imageEntity);
  }

  async updateActressImage(
    input: UpdateActressImageInput
  ): Promise<ActressImage> {
    const existing = await this.actressImageRepository.findOne({
      where: { id: input.id, actress: { id: input.actressId } },
    });

    if (!existing)
      throw new NotFoundException(
        `Image with ID ${input.id} not found for actress ${input.actressId}`
      );

    if (input.url !== undefined) existing.url = input.url;
    if (input.attribute !== undefined) existing.attribute = input.attribute;

    return this.actressImageRepository.save(existing);
  }

  async removeActressImage(input: RemoveActressImageInput): Promise<boolean> {
    const existing = await this.actressImageRepository.findOne({
      where: { id: input.id, actress: { id: input.actressId } },
    });

    if (!existing)
      throw new NotFoundException(
        `Image with ID ${input.id} not found for actress ${input.actressId}`
      );

    await this.actressImageRepository.delete({ id: input.id });

    return true;
  }
}
