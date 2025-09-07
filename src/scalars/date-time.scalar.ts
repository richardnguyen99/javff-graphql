import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("DateTime", () => Date)
export class DateTimeScalar implements CustomScalar<string, Date> {
  description =
    "DateTime custom scalar type to work with ISO 8601 date strings";

  parseValue(value: string): Date {
    return new Date(value);
  }

  serialize(value: string): string {
    const newDate = new Date(value);

    if (isNaN(newDate.getTime())) {
      throw new Error("Invalid date");
    }

    return newDate.toISOString().slice(0, 10);
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
}
