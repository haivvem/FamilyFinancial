export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  remark: string | null;
  created_at?: string;
}

export interface TransactionInput {
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  remark: string;
}

export const INCOME_CATEGORIES = [
  'ເງີນເດືອນ',
  'ວຽກເສີມ ຫຼື part time',
  'ຂອງຂວັນ ຫຼື ລາງວັນ',
  'ຢືມມາໃຊ້',
  'ອື່ນໆ'
] as const;

export const EXPENSE_CATEGORIES = [
  'ອາຫານ ແລະ ເຄື່ອງດື່ມ',
  'ຄ່ານ້ຳ',
  'ຄ່າໄຟ',
  'ຄ່າອີນເຕີເນັດ',
  'ຄ່າຂີ້ເຫຍື້ອ',
  'ການເດີນທາງ',
  'ສ້ອມແປງພາຫະນະ ແລະ ເຄື່ອງໃຊ້',
  'ເຄື່ອງນຸ່ງຫົ່ມ',
  'ສຸຂະພາບ ຫຼື ຢາ',
  'ບັນເທິງ ຫຼື ທ່ອງທ່ຽວ',
  'ການສຶກສາ',
  'ການຊ່ວຍເຫຼືອ ຫຼື ງານສັງຄົມ ຫຼື ການໃຫ້ທານ',
  'ເຄື່ອງໃຊ້ຈຳເປັນໃນຄອບຄົວ',
  'ອື່ນໆ'
] as const;
