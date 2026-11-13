// src/common/validators/max-byte-length.validator.ts
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function MaxByteLength(
  maxBytes: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxByteLength',
      target: object.constructor,
      propertyName,
      constraints: [maxBytes],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return (
            Buffer.byteLength(value, 'utf8') <= (args.constraints[0] as number)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `Пароль не должен превышать ${args.constraints[0]} байт (в UTF-8)`;
        },
      },
    });
  };
}