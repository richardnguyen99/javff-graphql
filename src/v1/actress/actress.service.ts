import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Actress } from "src/v1/actress/actress.entity";
import { CreateActressInput } from "src/v1/actress/dto/create-actress.input";
import { UpdateActressInput } from "src/v1/actress/dto/update-actress.input";

@Injectable()
export class ActressService {
  constructor(
    @InjectRepository(Actress)
    private readonly actressRepository: Repository<Actress>
  ) {}

  findAll(): Promise<Actress[]> {
    return this.actressRepository.find({ relations: ["videos"] });
  }

  findOne(id: number): Promise<Actress> {
    return this.actressRepository.findOne({
      where: { id },
      relations: ["videos"],
    });
  }

  create(data: CreateActressInput): Promise<Actress> {
    const actress = this.actressRepository.create(data);
    return this.actressRepository.save(actress);
  }

  update(id: number, data: UpdateActressInput): Promise<Actress> {
    return this.actressRepository.save({ id, ...data });
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.actressRepository.delete(id);
    return result.affected > 0;
  }
}
