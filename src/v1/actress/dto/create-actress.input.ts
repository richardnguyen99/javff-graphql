import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class ImageURLInput {
  @Field({ nullable: true })
  small?: string;

  @Field({ nullable: true })
  large?: string;
}

@InputType()
export class CreateActressInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  ruby?: string;

  @Field({ nullable: true })
  bust?: string;

  @Field({ nullable: true })
  cup?: string;

  @Field({ nullable: true })
  waist?: string;

  @Field({ nullable: true })
  hip?: string;

  @Field({ nullable: true })
  height?: string;

  @Field({ nullable: true })
  birthday?: string;

  @Field({ nullable: true })
  blood_type?: string;

  @Field({ nullable: true })
  hobby?: string;

  @Field({ nullable: true })
  prefectures?: string;

  @Field(() => ImageURLInput, { nullable: true })
  imageURL?: ImageURLInput;
}
