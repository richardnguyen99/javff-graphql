import { InputType, Field } from "@nestjs/graphql";
import { IsString, IsOptional, IsNotEmpty } from "class-validator";

import { CreateActressImageInput } from "./create-actress-image.input";

@InputType()
export class CreateActressInput {
  @Field()
  @IsString({ message: "name must be a string" })
  @IsNotEmpty({ message: "name is required" })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "dmmId must be a string" })
  dmmId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "displayName must be a string" })
  displayName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "ruby must be a string" })
  ruby?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "bust must be a string" })
  bust?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "cup must be a string" })
  cup?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "waist must be a string" })
  waist?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "hip must be a string" })
  hip?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "height must be a string" })
  height?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "birthday must be a string" })
  birthday?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "bloodType must be a string" })
  bloodType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "hobby must be a string" })
  hobby?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: "prefectures must be a string" })
  prefectures?: string;

  @Field(() => [CreateActressImageInput], { nullable: true })
  images?: CreateActressImageInput[];
}
