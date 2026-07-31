import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

type Delegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
};

interface CrudOptions {
  /** Roles allowed to create/update/delete. Empty = any authenticated user. */
  writeRoles?: string[];
  /** Roles allowed to read. Empty = any authenticated user. */
  readRoles?: string[];
  /** Prisma include for relations. */
  include?: Record<string, unknown>;
  /** Fields searched by ?q= (string contains). */
  searchFields?: string[];
  /** Default orderBy. */
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Membuat router CRUD standar (list, detail, create, update, delete) untuk
 * sebuah model Prisma. Mengurangi boilerplate lintas modul.
 */
export function crudRouter(model: Delegate, opts: CrudOptions = {}): Router {
  const router = Router();
  const { writeRoles = [], readRoles = [], include, searchFields = [], orderBy } = opts;

  router.get('/', authenticate, authorize(...readRoles), async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 20));
    const q = (req.query.q as string) ?? '';

    const where: any = {};
    if (q && searchFields.length) {
      where.OR = searchFields.map((f) => ({ [f]: { contains: q } }));
    }

    const [data, total] = await Promise.all([
      model.findMany({ where, include, orderBy, skip: (page - 1) * limit, take: limit }),
      model.count({ where }),
    ]);
    res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  router.get('/:id', authenticate, authorize(...readRoles), async (req, res) => {
    const item = await model.findUnique({ where: { id: req.params.id }, include });
    if (!item) return res.status(404).json({ message: 'Data tidak ditemukan' });
    res.json(item);
  });

  router.post('/', authenticate, authorize(...writeRoles), async (req, res) => {
    try {
      const item = await model.create({ data: req.body, include });
      res.status(201).json(item);
    } catch (e: any) {
      res.status(400).json({ message: 'Gagal membuat data', detail: e.message });
    }
  });

  router.put('/:id', authenticate, authorize(...writeRoles), async (req, res) => {
    try {
      const item = await model.update({ where: { id: req.params.id }, data: req.body, include });
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: 'Gagal memperbarui data', detail: e.message });
    }
  });

  router.delete('/:id', authenticate, authorize(...writeRoles), async (req, res) => {
    try {
      await model.delete({ where: { id: req.params.id } });
      res.json({ message: 'Data dihapus' });
    } catch (e: any) {
      res.status(400).json({ message: 'Gagal menghapus data', detail: e.message });
    }
  });

  return router;
}
