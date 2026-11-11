import { Gender, UserRole } from '../../users/users.enums';

export interface TestUserData {
  name: string;
  email: string;
  password: string;
  about: string;
  birthdate: string;
  city: string;
  gender: Gender;
  avatar: string;
  role: UserRole;
  refreshToken: null;
}

// TODO: После добавления сидинга категорий и навыков подготовить данные
// для связей wantToLearn и favoriteSkills.

export const testUsers: TestUserData[] = [
  {
    name: 'Анна Васильева',
    email: 'user1@example.com',
    password: 'user1234',
    about: 'Тестовый пользователь для проверки приложения',
    birthdate: '1995-05-15',
    city: 'Москва',
    gender: Gender.FEMALE,
    avatar: '',
    role: UserRole.USER,
    refreshToken: null,
  },
  {
    name: 'Иван Иванов',
    email: 'user2@example.com',
    password: 'user1234',
    about: 'Тестовый пользователь для проверки приложения',
    birthdate: '1992-10-20',
    city: 'Калининград',
    gender: Gender.MALE,
    avatar: '',
    role: UserRole.USER,
    refreshToken: null,
  },
];
