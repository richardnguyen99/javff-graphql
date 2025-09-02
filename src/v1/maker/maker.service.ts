import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Maker } from "src/v1/maker/maker.entity";

@Injectable()
export class MakerService {
  constructor(
    @InjectRepository(Maker)
    private readonly makerRepository: Repository<Maker>
  ) {}

  findAll(): Promise<Maker[]> {
    return this.makerRepository.find({ relations: ["videos"] });
  }

  findOne(id: number): Promise<Maker> {
    return this.makerRepository.findOne({
      where: { id },
      relations: ["videos"],
    });
  }

  create(data: Partial<Maker>): Promise<Maker> {
    const maker = this.makerRepository.create(data);
    return this.makerRepository.save(maker);
  }
}
