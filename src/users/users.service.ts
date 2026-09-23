import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    return {
      message: 'This action adds a new user',
      user: createUserDto,
    };
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return {
      message: `This action updates a #${id} user`,
      user: updateUserDto,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
