const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { validate, validateRequest, projectSchema } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

router.use(auth);

router.get('/', cacheMiddleware(120), pagination, async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const { limit, offset } = req.pagination;
    let query = `
      SELECT p.*,
        c.first_name || ' ' || c.last_name as client_name,
        u.first_name || ' ' || u.last_name as manager_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN contacts c ON p.client_id = c.id
      LEFT JOIN users u ON p.manager_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM projects p';
    const params = [];
    const countParams = [];

    if (status) {
      params.push(status);
      countParams.push(status);
      query += ` WHERE p.status = $${params.length}`;
      countQuery += ` WHERE p.status = $${countParams.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      query += `${status ? ' AND' : ' WHERE'} p.name ILIKE $${params.length}`;
      countQuery += `${status ? ' AND' : ' WHERE'} p.name ILIKE $${countParams.length}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    query += ' ORDER BY p.updated_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        c.first_name || ' ' || c.last_name as client_name,
        u.first_name || ' ' || u.last_name as manager_name
       FROM projects p
       LEFT JOIN contacts c ON p.client_id = c.id
       LEFT JOIN users u ON p.manager_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const tasks = await pool.query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as assignee_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1
       ORDER BY t.due_date, t.priority`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], tasks: tasks.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', invalidateCache('/projects*'), validate(projectSchema), validateRequest, async (req, res, next) => {
  try {
    const { name, description, status, priority, start_date, end_date, budget, client_id, manager_id } = req.body;

    const result = await pool.query(
      `INSERT INTO projects (name, description, status, priority, start_date, end_date, budget, client_id, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, description, status, priority, start_date, end_date, budget, client_id, manager_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', invalidateCache('/projects*'), validate(projectSchema), validateRequest, async (req, res, next) => {
  try {
    const { name, description, status, priority, start_date, end_date, budget, client_id, manager_id, progress } = req.body;

    const result = await pool.query(
      `UPDATE projects SET name=$1, description=$2, status=$3, priority=$4, start_date=$5,
       end_date=$6, budget=$7, client_id=$8, manager_id=$9, progress=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 RETURNING *`,
      [name, description, status, priority, start_date, end_date, budget, client_id, manager_id, progress, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', invalidateCache('/projects*'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/tasks', invalidateCache('/projects*'), async (req, res, next) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, title, description, status, priority, assigned_to, due_date]
    );

    await pool.query(
      `UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:projectId/tasks/:taskId', invalidateCache('/projects*'), async (req, res, next) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;

    let query = `
      UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, assigned_to=$5, due_date=$6, updated_at=CURRENT_TIMESTAMP
    `;

    if (status === 'completed') {
      query += ', completed_at = CURRENT_TIMESTAMP';
    }

    query += ` WHERE id=$7 AND project_id=$8 RETURNING *`;

    const result = await pool.query(
      query,
      [title, description, status, priority, assigned_to, due_date, req.params.taskId, req.params.projectId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Task not found', 404);
    }

    const completedTasks = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = $2',
      [req.params.projectId, 'completed']
    );

    const totalTasks = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE project_id = $1',
      [req.params.projectId]
    );

    const progress = Math.round((completedTasks.rows[0].count / totalTasks.rows[0].count) * 100);

    await pool.query(
      'UPDATE projects SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [progress, req.params.projectId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
