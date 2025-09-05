import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateActressImageInput {
  @Field()
  url: string;

  @Field()
  attribute: string;
}
