import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateActressImageInput {
  @Field()
  imageUrl: string;

  @Field()
  attribute: string;
}
