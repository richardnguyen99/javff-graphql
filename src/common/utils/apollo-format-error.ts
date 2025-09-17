import { DatabaseError } from "pg";
import {
  GraphQLError,
  GraphQLFormattedError,
  GraphQLFormattedErrorExtensions,
} from "graphql";
import { ApolloError } from "apollo-server-express";
import { ApolloServerErrorCode } from "@apollo/server/errors";
import { QueryFailedError } from "typeorm";
import { BadRequestException, HttpException, HttpStatus } from "@nestjs/common";

export enum CustomErrorCode {
  DUPLICATE_KEY = "DUPLICATE_KEY",
}

// https://github.com/postgres/postgres/blob/master/src/backend/utils/errcodes.txt
export enum PostgresErrorCode {
  UNIQUE_VIOLATION = "23505",
}

const __formatTypeORMQueryError = (
  formattedError: GraphQLFormattedError,
  error: ApolloError | GraphQLError
) => {
  let message: string;
  let originalError: object;
  let extensions: GraphQLFormattedErrorExtensions;

  const queryFailedError =
    error.originalError as QueryFailedError<DatabaseError>;

  if (
    queryFailedError.driverError.code === PostgresErrorCode.UNIQUE_VIOLATION
  ) {
    message = queryFailedError.driverError.detail
      .toLowerCase()
      .replace(/(\(|\))/g, "")
      .replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace("-", "").replace("_", "")
      );

    extensions = {
      code: CustomErrorCode.DUPLICATE_KEY,
      originalError: null,
    };
  }

  return { message, originalError, extensions };
};

const __formatHttpException = (
  formattedError: GraphQLFormattedError,
  error: ApolloError | GraphQLError
) => {
  const httpExceptionError = error.originalError as HttpException;

  const message = httpExceptionError.message;
  const originalError = httpExceptionError.getResponse() as object;
  const extensions = {
    code: HttpStatus[httpExceptionError.getStatus()],
    originalError,
  };

  return { message, originalError, extensions };
};

const __formatBadUserInputError = (
  formattedError: GraphQLFormattedError,
  error: ApolloError | GraphQLError
) => {
  const message = error.message;
  const originalError = error.originalError;
  const extensions = {
    code: ApolloServerErrorCode.BAD_USER_INPUT,
    originalError,
  };

  return {
    message,
    originalError,
    extensions,
  };
};

const __formatBadRequestError = (
  formattedError: GraphQLFormattedError,
  error: ApolloError | GraphQLError
) => {
  let message: string;
  let originalError: object;
  let extensions: GraphQLFormattedErrorExtensions;

  const validationError = error.originalError as BadRequestException;
  const response = validationError.getResponse();

  if (typeof response === "object" && response["message"]) {
    message = (response["message"] as string[]).join(", ");
    originalError = response;
    extensions = {
      code: formattedError.extensions["code"],
      originalError,
    };
  }

  return { message, originalError, extensions };
};

const formatApolloGraphQlError = (
  formattedError: GraphQLFormattedError,
  error: ApolloError | GraphQLError
) => {
  switch (formattedError.extensions["code"]) {
    // Refer to the input validation such as @Args, @InputType, etc.
    case ApolloServerErrorCode.BAD_USER_INPUT:
      return __formatBadUserInputError(formattedError, error);

    case ApolloServerErrorCode.BAD_REQUEST:
      if (error.originalError instanceof BadRequestException) {
        return __formatBadRequestError(formattedError, error);
      }

    // eslint-disable-next-line no-fallthrough
    case ApolloServerErrorCode.INTERNAL_SERVER_ERROR:
      // Unexpected error in the server side. Could be either from the server itself
      // such as a database error or from a client request.
      if (error.originalError instanceof QueryFailedError) {
        return __formatTypeORMQueryError(formattedError, error);
      }

      // Deal with Http Exception such as 404 not found from NestJS resolvers.
      if (error.originalError instanceof HttpException) {
        return __formatHttpException(formattedError, error);
      }

    // eslint-disable-next-line no-fallthrough
    default:
      return {
        message: formattedError.message,
        originalError: error.originalError,
        extensions: {
          code: formattedError.extensions["code"],
          originalError: error.originalError,
        },
      };
  }
};

/**
 * Apollo Driver will catch all the errors from resolvers, including validation,
 * parsing and database errors.
 */
export const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown
) => {
  let message: string;
  let originalError: object;
  let extensions: GraphQLFormattedErrorExtensions;

  // All identified errors are thrown as either ApolloError or GraphQLError but
  // not limited to these two classes.
  if (error instanceof ApolloError || error instanceof GraphQLError) {
    const formatted = formatApolloGraphQlError(formattedError, error);

    message = formatted.message;
    originalError = formatted.originalError;
    extensions = formatted.extensions;
  }

  if (!message) {
    message =
      formattedError.extensions["originalError"]?.["message"].join(", ") ??
      formattedError.message;
  }

  if (!originalError) {
    originalError = formattedError.extensions["originalError"] as object;
  }

  if (!extensions) {
    extensions = {
      ...formattedError.extensions,
      originalError,
    };
  }

  return {
    message,
    path: formattedError.path,
    locations: formattedError.locations,
    extensions,
  };
};
