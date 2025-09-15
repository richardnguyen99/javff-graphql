import { Resolver, Query, Args, Mutation, Int } from "@nestjs/graphql";

import { Actress } from "src/v1/actress/actress.entity";
import { ActressService } from "src/v1/actress/actress.service";
import { CreateActressInput } from "src/v1/actress/dto/create-actress.input";
import { UpdateActressInput } from "src/v1/actress/dto/update-actress.input";
import { ActressConnection } from "src/v1/actress/dto/actress-connection.output";
import { ActressQueryOptionsInput } from "src/v1/actress/dto/actress-query-options.input";
import {
  AddActressImageInput,
  RemoveActressImageInput,
  UpdateActressImageInput,
} from "src/v1/actress/dto/update-actress-image.input";
import { ActressImage } from "src/v1/actress/actress-image.entity";
import { ActressImageOutput } from "src/v1/actress/dto/update-actress-image.output";
import { UpdateActressOutput } from "src/v1/actress/dto/update-actress.output";

@Resolver(() => Actress)
export class ActressResolver {
  constructor(private readonly actressService: ActressService) {}

  @Query(() => ActressConnection, {
    description:
      "Get a paginated list of actresses with optional filters and Relay-style pagination.",
  })
  async actresses(
    @Args("options", { type: () => ActressQueryOptionsInput, nullable: true })
    options?: ActressQueryOptionsInput
  ) {
    return this.actressService.findAllConnection(options);
  }

  @Query(() => Actress, {
    nullable: true,
    description: "Get a single actress by her numeric ID.",
  })
  actress(@Args("id", { type: () => Int }) id: number) {
    return this.actressService.findOne(id);
  }

  @Query(() => [Actress], {
    description: "Search for actresses by name (partial match).",
  })
  async searchActressesByName(@Args("name") name: string) {
    return this.actressService.findByName(name);
  }

  @Query(() => Actress, {
    nullable: true,
    description: "Get a single actress by her DMM ID.",
  })
  async actressByDmmId(@Args("dmmId") dmmId: string) {
    return this.actressService.findByDmmId(dmmId);
  }

  @Mutation(() => Actress, {
    description: "Create a new actress record.",
  })
  createActress(@Args("input") input: CreateActressInput) {
    return this.actressService.create(input);
  }

  @Mutation(() => UpdateActressOutput, {
    description: "Update an existing actress record by ID.",
  })
  updateActress(
    @Args("id", { type: () => Int }) id: number,
    @Args("input") input: UpdateActressInput
  ) {
    return this.actressService.update(id, input);
  }

  @Mutation(() => ActressImageOutput, {
    description: "Add an image to an actress.",
  })
  async addActressImage(
    @Args("input") input: AddActressImageInput
  ): Promise<ActressImage> {
    return this.actressService.addImageToActress(input);
  }

  @Mutation(() => ActressImageOutput, {
    description: "Update an image of an actress. Image id is required.",
  })
  async updateActressImage(
    @Args("input") input: UpdateActressImageInput
  ): Promise<ActressImage> {
    return this.actressService.updateActressImage(input);
  }

  @Mutation(() => Boolean, {
    description: "Remove an image from an actress. Image id is required.",
  })
  async removeActressImage(
    @Args("input") input: RemoveActressImageInput
  ): Promise<boolean> {
    return this.actressService.removeActressImage(input);
  }

  @Mutation(() => Boolean, {
    description: "Delete an actress record by ID.",
  })
  deleteActress(@Args("id", { type: () => Int }) id: number) {
    return this.actressService.delete(id);
  }
}
