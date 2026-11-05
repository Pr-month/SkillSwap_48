import { testUsers } from './seed-users.data';

export interface TestSkillData {
  ownerEmail: string;
  title: string;
  description: string;
  categoryName: string;
  subcategoryName: string;
  images: string[];
}

// Названия и владельцы: макет SkillSwap, каталог, node-id=437-12018.
// Иерархия категорий: node-id=468-15248 и node-id=672-23873.
// Описания — краткие тестовые резюме, изображения не копируются из макета.
export const testSkills: TestSkillData[] = [
  {
    ownerEmail: testUsers[0].email,
    title: 'Английский язык',
    description: 'Обучение английскому языку.',
    categoryName: 'Иностранные языки',
    subcategoryName: 'Английский',
    images: [],
  },
  {
    ownerEmail: testUsers[1].email,
    title: 'Игра на барабанах',
    description:
      'Обучение основам техники, ритмам и разбору песен на барабанах.',
    categoryName: 'Творчество и искусство',
    subcategoryName: 'Музыка и звук',
    images: [],
  },
];
