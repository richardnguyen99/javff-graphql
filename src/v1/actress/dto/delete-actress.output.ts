import { ObjectType, OmitType } from "@nestjs/graphql";
import { Actress } from "../actress.entity";

@ObjectType()
export class DeleteActressOutput extends OmitType(Actress, [
  "videos",
] as const) {}
