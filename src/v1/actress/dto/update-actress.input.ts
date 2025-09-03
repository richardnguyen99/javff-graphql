import { InputType, Field, PartialType } from "@nestjs/graphql";
import { CreateActressInput } from "./create-actress.input";

@InputType()
export class UpdateActressInput extends PartialType(CreateActressInput) {
  @Field({ nullable: true })
  name?: string;
}
