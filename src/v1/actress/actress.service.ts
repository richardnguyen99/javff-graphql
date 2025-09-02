import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Actress } from "src/v1/actress/actress.entity";

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

  create(data: Partial<Actress>): Promise<Actress> {
    const actress = this.actressRepository.create(data);
    return this.actressRepository.save(actress);
  }
}
