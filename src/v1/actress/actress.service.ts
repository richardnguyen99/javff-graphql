import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { CreateActressInput } from "src/v1/actress/dto/create-actress.input";
import { UpdateActressInput } from "src/v1/actress/dto/update-actress.input";

@Injectable()
export class ActressService {
  constructor(
    @InjectRepository(Actress)
    private readonly actressRepository: Repository<Actress>,
    @InjectRepository(ActressImage)
    private readonly actressImageRepository: Repository<ActressImage>
  ) {}

  findAll(): Promise<Actress[]> {
    return this.actressRepository.find({ relations: ["videos", "images"] });
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
}
